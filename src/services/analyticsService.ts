import { getApp } from "firebase/app";
import {
  Analytics,
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
} from "firebase/analytics";
import { Platform } from "react-native";

type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;
type AnalyticsEventName =
  | "sign_up"
  | "login"
  | "create_list"
  | "complete_purchase"
  | "open_plans_screen"
  | "start_subscription"
  | "complete_subscription";

let analyticsInstancePromise: Promise<Analytics | null> | null = null;

const getAnalyticsInstance = () => {
  if (!analyticsInstancePromise) {
    analyticsInstancePromise = (async () => {
      if (Platform.OS !== "web") {
        return null;
      }

      const supported = await isSupported();

      if (!supported) {
        return null;
      }

      return getAnalytics(getApp());
    })();
  }

  return analyticsInstancePromise;
};

export const identifyAnalyticsUser = async (uid: string) => {
  const analytics = await getAnalyticsInstance();

  if (!analytics) {
    return;
  }

  setUserId(analytics, uid);
};

export const trackEvent = async (
  eventName: AnalyticsEventName,
  params?: AnalyticsEventParams
) => {
  const analytics = await getAnalyticsInstance();

  if (!analytics) {
    return;
  }

  await logEvent(analytics, eventName as string, params);
};
