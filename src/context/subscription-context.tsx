import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import { auth, db } from "../../firebaseConfig";
import { PLANS } from "@/src/config/plans";
import { hasAdminAccess, isUltimateUser } from "@/src/utils/adminPermissions";
import {
  cancelSubscription as openSubscriptionManagement,
  initializeBilling,
  purchaseSubscription,
  restorePurchases,
  syncSubscriptionWithFirestore,
} from "@/src/services/billingService";
import { SmarketPlanId, UserSubscription } from "@/src/types/subscription";
import {
  ensureUserSubscriptionProfile,
  normalizeUserSubscription,
  updateUserPlan,
} from "@/src/services/subscriptionService";

type SubscriptionContextValue = {
  subscription: UserSubscription | null;
  currentPlan: SmarketPlanId;
  isUltimate: boolean;
  isAdmin: boolean;
  subscriptionLoading: boolean;
  handleSubscribe: (plan: SmarketPlanId) => Promise<void>;
  handleCancelSubscription: () => Promise<void>;
  handleRestorePurchases: () => Promise<void>;
  billingAvailable: boolean;
  refreshAccessClaims: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [billingAvailable, setBillingAvailable] = useState(false);
  const [isUltimate, setIsUltimate] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const syncClaimsFromUser = async (forceRefresh = false) => {
      const user = auth.currentUser;

      if (!user) {
        setIsUltimate(false);
        setIsAdmin(false);
        return;
      }

      const tokenResult = await user.getIdTokenResult(forceRefresh);
      setIsUltimate(isUltimateUser(tokenResult));
      setIsAdmin(hasAdminAccess(tokenResult));
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribeSnapshot?.();

      if (!user) {
        setSubscription(null);
        setBillingAvailable(false);
        setIsUltimate(false);
        setIsAdmin(false);
        setSubscriptionLoading(false);
        return;
      }

      setSubscriptionLoading(true);

      try {
        await ensureUserSubscriptionProfile({
          uid: user.uid,
          email: user.email ?? "",
          name: user.displayName,
        });

        if (Platform.OS === "android") {
          try {
            await initializeBilling();
            await syncSubscriptionWithFirestore();
            setBillingAvailable(true);
          } catch {
            setBillingAvailable(false);
          }
        } else {
          setBillingAvailable(false);
        }

        await syncClaimsFromUser(true);
      } catch {
        setSubscriptionLoading(false);
        return;
      }

      unsubscribeSnapshot = onSnapshot(
        doc(db, "users", user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            setSubscription(
              normalizeUserSubscription(user.uid, snapshot.data(), {
                email: user.email ?? "",
                name: user.displayName,
              })
            );
          } else {
            setSubscription(null);
          }

          setSubscriptionLoading(false);
        },
        () => {
          setSubscriptionLoading(false);
        }
      );
    });

    return () => {
      unsubscribeSnapshot?.();
      unsubscribeAuth();
    };
  }, []);

  const handleSubscribe = async (plan: SmarketPlanId) => {
    if (!auth.currentUser?.uid) {
      return;
    }

    setSubscriptionLoading(true);

    try {
      if (plan === "free") {
        await updateUserPlan(plan);
        return;
      }

      const productId = PLANS[plan].billingProductId;

      if (!productId) {
        throw new Error("Produto de assinatura nao configurado.");
      }

      if (Platform.OS !== "android") {
        throw new Error("Assinaturas reais estao disponiveis apenas no Android.");
      }

      await purchaseSubscription(productId);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    await openSubscriptionManagement();
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== "android") {
      return;
    }

    setSubscriptionLoading(true);

    try {
      await restorePurchases();
    } finally {
      setSubscriptionLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        currentPlan: isUltimate ? "family" : subscription?.plan ?? "free",
        isUltimate,
        isAdmin,
        subscriptionLoading,
        handleSubscribe,
        handleCancelSubscription,
        handleRestorePurchases,
        billingAvailable,
        refreshAccessClaims: async () => {
          setSubscriptionLoading(true);

          try {
            const tokenResult = await auth.currentUser?.getIdTokenResult(true);

            if (!tokenResult) {
              setIsUltimate(false);
              setIsAdmin(false);
              return;
            }

            setIsUltimate(isUltimateUser(tokenResult));
            setIsAdmin(hasAdminAccess(tokenResult));
          } finally {
            setSubscriptionLoading(false);
          }
        },
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }

  return context;
}
