import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Linking from "expo-linking";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases as restoreNativePurchases,
  type ProductSubscription,
  type Purchase,
} from "expo-iap";
import { Platform } from "react-native";

import { auth } from "../../firebaseConfig";
import { PLANS, PLAY_BILLING_PRODUCT_IDS } from "@/src/config/plans";
import { SmarketPlanId } from "@/src/types/subscription";
import {
  resetUserPlanToFree,
  syncUserSubscriptionState,
} from "@/src/services/subscriptionService";

type BillingValidationResult = {
  valid: boolean;
  plan: SmarketPlanId;
  productId: string | null;
  purchaseToken: string | null;
  purchaseDate: Date | null;
  expiresAt: Date | null;
};

type PurchasePromiseHandlers = {
  resolve: (value: BillingValidationResult) => void;
  reject: (reason?: unknown) => void;
};

const SUBSCRIPTION_DURATION_IN_MS = 30 * 24 * 60 * 60 * 1000;

let initialized = false;
let listenersBound = false;
let purchaseHandlers: PurchasePromiseHandlers | null = null;

const isAndroidBillingSupported = () =>
  Platform.OS === "android" &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

const productIdToPlan = (productId: string | null | undefined): SmarketPlanId => {
  if (!productId) {
    return "free";
  }

  if (productId === PLANS.pro.billingProductId) {
    return "pro";
  }

  if (productId === PLANS.family.billingProductId) {
    return "family";
  }

  return "free";
};

const buildApproximateExpiration = (referenceDate: Date, productId: string | null) => {
  if (!productId) {
    return null;
  }

  return new Date(referenceDate.getTime() + SUBSCRIPTION_DURATION_IN_MS);
};

const createUnsupportedBillingError = () =>
  new Error(
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
      ? "Assinaturas reais exigem um development build ou app publicado. O Expo Go nao suporta Google Play Billing."
      : "Google Play Billing esta disponivel apenas no Android."
  );

const validateActiveSubscription = (
  subscription: Awaited<ReturnType<typeof getActiveSubscriptions>>[number] | null | undefined
): BillingValidationResult => {
  if (!subscription?.isActive) {
    return {
      valid: false,
      plan: "free",
      productId: null,
      purchaseToken: null,
      purchaseDate: null,
      expiresAt: null,
    };
  }

  const purchaseDate = new Date(subscription.transactionDate);
  const expiresAt =
    subscription.expirationDateIOS != null
      ? new Date(subscription.expirationDateIOS)
      : buildApproximateExpiration(purchaseDate, subscription.productId);

  return {
    valid: true,
    plan: productIdToPlan(subscription.productId),
    productId: subscription.productId,
    purchaseToken: subscription.purchaseToken ?? null,
    purchaseDate,
    expiresAt,
  };
};

const getHighestPriorityValidation = (
  subscriptions: Awaited<ReturnType<typeof getActiveSubscriptions>>
) => {
  const ranked = subscriptions
    .map((subscription) => validateActiveSubscription(subscription))
    .filter((subscription) => subscription.valid)
    .sort((left, right) => {
      const score = (plan: SmarketPlanId) => {
        if (plan === "family") return 2;
        if (plan === "pro") return 1;
        return 0;
      };

      return score(right.plan) - score(left.plan);
    });

  return ranked[0] ?? validateActiveSubscription(null);
};

export const validatePurchase = async (purchase: Purchase): Promise<BillingValidationResult> => {
  const productId = purchase.productId ?? null;
  const plan = productIdToPlan(productId);

  if (!productId || plan === "free" || purchase.purchaseState !== "purchased") {
    return {
      valid: false,
      plan: "free",
      productId,
      purchaseToken: purchase.purchaseToken ?? null,
      purchaseDate: null,
      expiresAt: null,
    };
  }

  const purchaseDate = new Date(purchase.transactionDate);
  const expiresAt =
    "expirationDateIOS" in purchase && typeof purchase.expirationDateIOS === "number"
      ? new Date(purchase.expirationDateIOS)
      : buildApproximateExpiration(purchaseDate, productId);

  return {
    valid: true,
    plan,
    productId,
    purchaseToken: purchase.purchaseToken ?? null,
    purchaseDate,
    expiresAt,
  };
};

const bindBillingListeners = () => {
  if (listenersBound) {
    return;
  }

  purchaseUpdatedListener(async (purchase) => {
    try {
      const validation = await validatePurchase(purchase);

      if (!validation.valid) {
        purchaseHandlers?.reject(
          new Error("Nao foi possivel validar essa assinatura com seguranca.")
        );
        purchaseHandlers = null;
        return;
      }

      await syncSubscriptionWithFirestore(validation);
      await finishTransaction({ purchase, isConsumable: false });
      purchaseHandlers?.resolve(validation);
    } catch (error) {
      purchaseHandlers?.reject(error);
    } finally {
      purchaseHandlers = null;
    }
  });

  purchaseErrorListener((error) => {
    if (error.code === "user-cancelled") {
      purchaseHandlers?.reject(new Error("Compra cancelada pelo usuario."));
    } else if (error.code === "network-error") {
      purchaseHandlers?.reject(
        new Error("Internet indisponivel. Verifique sua conexao e tente novamente.")
      );
    } else if (error.code === "service-error" || error.code === "billing-unavailable") {
      purchaseHandlers?.reject(
        new Error("O Google Play Billing nao esta disponivel agora.")
      );
    } else {
      purchaseHandlers?.reject(
        new Error(error.message || "Pagamento recusado ou indisponivel no momento.")
      );
    }

    purchaseHandlers = null;
  });

  listenersBound = true;
};

export const initializeBilling = async () => {
  if (!isAndroidBillingSupported()) {
    throw createUnsupportedBillingError();
  }

  if (!initialized) {
    await initConnection();
    initialized = true;
  }

  bindBillingListeners();
  return true;
};

export const getProducts = async () => {
  await initializeBilling();

  const products = await fetchProducts({
    skus: PLAY_BILLING_PRODUCT_IDS,
    type: "subs",
  });

  return (products ?? []) as ProductSubscription[];
};

export const purchaseSubscription = async (productId: string) => {
  await initializeBilling();

  const products = await getProducts();
  const product = products.find((item) => item.id === productId);

  if (!product) {
    throw new Error("Produto de assinatura nao encontrado no Google Play.");
  }

  const offerToken = product.subscriptionOffers?.[0]?.offerTokenAndroid ?? null;

  return new Promise<BillingValidationResult>(async (resolve, reject) => {
    purchaseHandlers = { resolve, reject };

    try {
      await requestPurchase({
        type: "subs",
        request: {
          android: {
            skus: [productId],
            subscriptionOffers: offerToken
              ? [{ sku: productId, offerToken }]
              : undefined,
          },
          google: {
            skus: [productId],
            subscriptionOffers: offerToken
              ? [{ sku: productId, offerToken }]
              : undefined,
          },
        },
      });
    } catch (error) {
      purchaseHandlers = null;
      reject(error);
    }
  });
};

export const restorePurchases = async () => {
  await initializeBilling();
  await restoreNativePurchases();

  return syncSubscriptionWithFirestore();
};

export const cancelSubscription = async () => {
  if (Platform.OS !== "android") {
    throw createUnsupportedBillingError();
  }

  const subscriptionsCenter = "https://play.google.com/store/account/subscriptions";
  await Linking.openURL(subscriptionsCenter);
};

export const syncSubscriptionWithFirestore = async (
  prevalidated?: BillingValidationResult
) => {
  if (!auth.currentUser?.uid) {
    return null;
  }

  let validation = prevalidated;

  if (!validation) {
    if (!isAndroidBillingSupported()) {
      return null;
    }

    await initializeBilling();
    const activeSubscriptions = await getActiveSubscriptions(PLAY_BILLING_PRODUCT_IDS);
    validation = getHighestPriorityValidation(activeSubscriptions);
  }

  if (!validation.valid || validation.plan === "free") {
    await resetUserPlanToFree();
    return {
      ...validation,
      plan: "free" as const,
      valid: false,
    };
  }

  await syncUserSubscriptionState({
    plan: validation.plan,
    subscriptionStatus: "active",
    planStartedAt: validation.purchaseDate,
    planExpiresAt: validation.expiresAt,
    storeProductId: validation.productId,
    purchaseToken: validation.purchaseToken,
    subscriptionPlatform: "android",
  });

  return validation;
};

export const closeBillingConnection = async () => {
  if (!initialized) {
    return;
  }

  await endConnection().catch(() => undefined);
  initialized = false;
};
