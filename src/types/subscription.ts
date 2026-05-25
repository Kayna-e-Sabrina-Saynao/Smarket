export type SmarketPlanId = "free" | "pro" | "family";

export type SubscriptionStatus = "active" | "inactive" | "trial" | "canceled";

export type UserSubscription = {
  uid: string;
  name: string;
  email: string;
  plan: SmarketPlanId;
  subscriptionStatus: SubscriptionStatus;
  planStartedAt: Date | null;
  planExpiresAt: Date | null;
  storeProductId?: string | null;
  purchaseToken?: string | null;
  subscriptionPlatform?: "android" | "ios" | "web" | null;
  familyMembers: string[];
  hasCompletedOnboarding: boolean;
  inviteCode: string | null;
  notificationsEnabled: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type EnsureUserSubscriptionInput = {
  uid: string;
  email: string;
  name?: string | null;
};
