import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "../../firebaseConfig";
import {
  EnsureUserSubscriptionInput,
  SmarketPlanId,
  UserSubscription,
} from "@/src/types/subscription";

const usersDocRef = (uid: string) => doc(db, "users", uid);
const createInviteCode = (uid: string) => `SMK-${uid.slice(0, 6).toUpperCase()}`;
const subscriptionFunction = <TData, TResult>(name: string) =>
  httpsCallable<TData, TResult>(functions, name);

const getFallbackName = (email: string, name?: string | null) => {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  const [beforeAt] = email.split("@");
  return beforeAt || "Usuario SMARKET";
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
};

export const normalizeUserSubscription = (
  uid: string,
  data: Record<string, unknown> | undefined,
  fallback?: { email?: string; name?: string | null }
): UserSubscription => {
  const email = typeof data?.email === "string" ? data.email : fallback?.email ?? "";
  const name =
    typeof data?.name === "string"
      ? data.name
      : getFallbackName(email, fallback?.name);

  return {
    uid,
    name,
    email,
    plan:
      data?.plan === "pro" || data?.plan === "family" || data?.plan === "free"
        ? data.plan
        : "free",
    subscriptionStatus:
      data?.subscriptionStatus === "active" ||
      data?.subscriptionStatus === "inactive" ||
      data?.subscriptionStatus === "trial" ||
      data?.subscriptionStatus === "canceled"
        ? data.subscriptionStatus
        : "active",
    planStartedAt: toDate(data?.planStartedAt),
    planExpiresAt: toDate(data?.planExpiresAt),
    storeProductId: typeof data?.storeProductId === "string" ? data.storeProductId : null,
    purchaseToken: typeof data?.purchaseToken === "string" ? data.purchaseToken : null,
    subscriptionPlatform:
      data?.subscriptionPlatform === "android" ||
      data?.subscriptionPlatform === "ios" ||
      data?.subscriptionPlatform === "web"
        ? data.subscriptionPlatform
        : null,
    familyMembers: Array.isArray(data?.familyMembers)
      ? data.familyMembers.filter((member): member is string => typeof member === "string")
      : [],
    hasCompletedOnboarding: data?.hasCompletedOnboarding === true,
    inviteCode:
      typeof data?.inviteCode === "string" && data.inviteCode.trim().length > 0
        ? data.inviteCode
        : createInviteCode(uid),
    notificationsEnabled: data?.notificationsEnabled === true,
    selectedCycleMonth:
      typeof data?.selectedCycleMonth === "number" ? data.selectedCycleMonth : null,
    selectedCycleYear:
      typeof data?.selectedCycleYear === "number" ? data.selectedCycleYear : null,
    createdAt: toDate(data?.createdAt),
    updatedAt: toDate(data?.updatedAt),
  };
};

export const ensureUserSubscriptionProfile = async ({
  uid,
  email,
  name,
}: EnsureUserSubscriptionInput) => {
  const documentRef = usersDocRef(uid);
  const snapshot = await getDoc(documentRef);
  const resolvedName = getFallbackName(email, name);

  if (!snapshot.exists()) {
    await setDoc(
      documentRef,
      {
        uid,
        name: resolvedName,
        email,
        familyMembers: [],
        hasCompletedOnboarding: false,
        inviteCode: createInviteCode(uid),
        notificationsEnabled: false,
        selectedCycleMonth: new Date().getMonth(),
        selectedCycleYear: new Date().getFullYear(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  const existingData = snapshot.data();

  await setDoc(
    documentRef,
    {
      uid,
      name: typeof existingData.name === "string" ? existingData.name : resolvedName,
      email,
      familyMembers: Array.isArray(existingData.familyMembers) ? existingData.familyMembers : [],
      hasCompletedOnboarding: existingData.hasCompletedOnboarding === true,
      inviteCode:
        typeof existingData.inviteCode === "string" && existingData.inviteCode.trim().length > 0
          ? existingData.inviteCode
          : createInviteCode(uid),
      notificationsEnabled: existingData.notificationsEnabled === true,
      selectedCycleMonth:
        typeof existingData.selectedCycleMonth === "number"
          ? existingData.selectedCycleMonth
          : new Date().getMonth(),
      selectedCycleYear:
        typeof existingData.selectedCycleYear === "number"
          ? existingData.selectedCycleYear
          : new Date().getFullYear(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const getUserSubscription = async (uid: string) => {
  const snapshot = await getDoc(usersDocRef(uid));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeUserSubscription(uid, snapshot.data());
};

export const updateUserPlan = async (plan: SmarketPlanId) => {
  const callable = subscriptionFunction<{ plan: SmarketPlanId }, { ok: boolean }>("setUserPlan");
  await callable({ plan });
};

export const cancelSubscription = async () => {
  const callable = subscriptionFunction<undefined, { ok: boolean }>("cancelUserSubscription");
  await callable();
};

export const syncUserSubscriptionState = async (
  payload: {
    plan: SmarketPlanId;
    subscriptionStatus: "active" | "inactive" | "trial" | "canceled";
    planStartedAt: Date | null;
    planExpiresAt: Date | null;
    storeProductId?: string | null;
    purchaseToken?: string | null;
    subscriptionPlatform?: "android" | "ios" | "web" | null;
  }
) => {
  const callable = subscriptionFunction<
    {
      plan: SmarketPlanId;
      subscriptionStatus: "active" | "inactive" | "trial" | "canceled";
      planStartedAt: string | null;
      planExpiresAt: string | null;
      storeProductId?: string | null;
      purchaseToken?: string | null;
      subscriptionPlatform?: "android" | "ios" | "web" | null;
    },
    { ok: boolean }
  >("syncUserSubscriptionState");

  await callable({
    plan: payload.plan,
    subscriptionStatus: payload.subscriptionStatus,
    planStartedAt: payload.planStartedAt ? payload.planStartedAt.toISOString() : null,
    planExpiresAt: payload.planExpiresAt ? payload.planExpiresAt.toISOString() : null,
    storeProductId: payload.storeProductId ?? null,
    purchaseToken: payload.purchaseToken ?? null,
    subscriptionPlatform: payload.subscriptionPlatform ?? null,
  });
};

export const resetUserPlanToFree = async () => {
  const callable = subscriptionFunction<undefined, { ok: boolean }>("resetUserPlanToFree");
  await callable();
};

export const updateUserAppPreferences = async (
  uid: string,
  preferences: {
    hasCompletedOnboarding?: boolean;
    notificationsEnabled?: boolean;
    familyMembers?: string[];
    inviteCode?: string | null;
    selectedCycleMonth?: number;
    selectedCycleYear?: number;
  }
) => {
  await setDoc(
    usersDocRef(uid),
    {
      ...preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const ensureUserInviteCode = async (uid: string) => {
  const snapshot = await getDoc(usersDocRef(uid));

  if (snapshot.exists()) {
    const data = snapshot.data();

    if (typeof data.inviteCode === "string" && data.inviteCode.trim().length > 0) {
      return data.inviteCode;
    }
  }

  const inviteCode = createInviteCode(uid);

  await setDoc(
    usersDocRef(uid),
    {
      inviteCode,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return inviteCode;
};

export const isSubscriptionActive = (user: UserSubscription | null) => {
  if (!user) {
    return false;
  }

  if (user.plan === "free") {
    return true;
  }

  if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trial") {
    return false;
  }

  if (!user.planExpiresAt) {
    return true;
  }

  return user.planExpiresAt.getTime() >= Date.now();
};
