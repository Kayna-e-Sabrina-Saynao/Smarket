import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const INACTIVITY_NOTIFICATION_KEY = "smarket:lastInactivityNotificationId";

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

export const requestNotificationsPermission = async () => {
  if (!canUseNotifications()) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

const clearPendingInactivityNotification = async () => {
  const existingId = await AsyncStorage.getItem(INACTIVITY_NOTIFICATION_KEY);

  if (!existingId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => undefined);
  await AsyncStorage.removeItem(INACTIVITY_NOTIFICATION_KEY);
};

export const scheduleInactivityReminder = async () => {
  const granted = await requestNotificationsPermission();

  if (!granted) {
    return;
  }

  await clearPendingInactivityNotification();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "SMARKET",
      body: "Voce esta ha 7 dias sem atualizar suas listas.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 7 * 24 * 60 * 60,
    },
  });

  await AsyncStorage.setItem(INACTIVITY_NOTIFICATION_KEY, notificationId);
};

export const notifyListUpdated = async (actorName?: string) => {
  const granted = await requestNotificationsPermission();

  if (!granted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "SMARKET",
      body: actorName ? `${actorName} atualizou uma lista.` : "Sua lista foi atualizada.",
    },
    trigger: null,
  });
};

export const notifyPurchaseAdded = async (buyerName?: string) => {
  const granted = await requestNotificationsPermission();

  if (!granted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "SMARKET",
      body: buyerName ? `Nova compra adicionada por ${buyerName}.` : "Nova compra adicionada.",
    },
    trigger: null,
  });
};
