import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const INACTIVITY_NOTIFICATION_KEY = "smarket:lastInactivityNotificationId";
const NOTIFICATIONS_ENABLED_KEY = "smarket:notificationsEnabled";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const canUseNotifications = () => Device.isDevice || Platform.OS === "web";

export const requestPermission = async () => {
  if (!canUseNotifications()) {
    return { granted: false, canAskAgain: false };
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return { granted: true, canAskAgain: current.canAskAgain ?? false };
  }

  const requested = await Notifications.requestPermissionsAsync();
  return {
    granted: requested.granted,
    canAskAgain: requested.canAskAgain ?? false,
  };
};

const clearPendingInactivityNotification = async () => {
  const existingId = await AsyncStorage.getItem(INACTIVITY_NOTIFICATION_KEY);

  if (!existingId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => undefined);
  await AsyncStorage.removeItem(INACTIVITY_NOTIFICATION_KEY);
};

export const cancelAllNotifications = async () => {
  await clearPendingInactivityNotification();
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
};

export const getNotificationStatus = async () => {
  const storedValue = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);

  if (storedValue === "true") {
    return true;
  }

  if (storedValue === "false") {
    return false;
  }

  return null;
};

export const enableNotifications = async () => {
  const permission = await requestPermission();

  if (!permission.granted) {
    return permission;
  }

  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "true");
  return permission;
};

export const disableNotifications = async () => {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "false");
  await cancelAllNotifications();
};

export const scheduleNotification = async (input: {
  title: string;
  body: string;
  trigger: Notifications.NotificationTriggerInput;
}) => {
  const enabled = await getNotificationStatus();

  if (enabled !== true) {
    return null;
  }

  const permission = await requestPermission();

  if (!permission.granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
    },
    trigger: input.trigger,
  });
};

export const scheduleInactivityReminder = async () => {
  await clearPendingInactivityNotification();

  const notificationId = await scheduleNotification({
    title: "SMARKET",
    body: "Voce esta ha 7 dias sem atualizar suas listas.",
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 7 * 24 * 60 * 60,
    },
  });

  if (!notificationId) {
    return;
  }

  await AsyncStorage.setItem(INACTIVITY_NOTIFICATION_KEY, notificationId);
};

export const notifyListUpdated = async (actorName?: string) => {
  await scheduleNotification({
    title: "SMARKET",
    body: actorName ? `${actorName} atualizou uma lista.` : "Sua lista foi atualizada.",
    trigger: null,
  });
};

export const notifyPurchaseAdded = async (buyerName?: string) => {
  await scheduleNotification({
    title: "SMARKET",
    body: buyerName ? `Nova compra adicionada por ${buyerName}.` : "Nova compra adicionada.",
    trigger: null,
  });
};

export const requestNotificationsPermission = async () => {
  const permission = await requestPermission();
  return permission.granted;
};
