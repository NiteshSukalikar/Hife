import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIFICATION_SETTINGS_KEY = "HIFE_NOTIFICATION_SETTINGS";
const READ_COUNTS_KEY = "HIFE_READ_COMMENT_COUNTS";
const NOTIFICATION_CHANNEL_ID = "hife-updates-v2";

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false,
  newRequests: true,
  statusChanges: true,
  comments: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("hife-updates", {
    name: "Hife updates",
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: "Hife updates",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function getNotificationSettings() {
  const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);

  if (!saved) return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...JSON.parse(saved),
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function updateNotificationSettings(settings) {
  const nextSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...settings,
  };

  await AsyncStorage.setItem(
    NOTIFICATION_SETTINGS_KEY,
    JSON.stringify(nextSettings)
  );

  return nextSettings;
}

export async function requestNotificationPermission() {
  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  const finalStatus =
    current.status === "granted"
      ? current.status
      : (await Notifications.requestPermissionsAsync()).status;

  const settings = await updateNotificationSettings({
    enabled: finalStatus === "granted",
  });

  return {
    granted: finalStatus === "granted",
    settings,
  };
}

export async function scheduleLocalNotification({ title, body, data = {} }) {
  const settings = await getNotificationSettings();

  if (!settings.enabled) return;

  const permissions = await Notifications.getPermissionsAsync();

  if (permissions.status !== "granted") return;

  await ensureAndroidChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: "default",
    },
    trigger:
      Platform.OS === "android"
        ? { channelId: NOTIFICATION_CHANNEL_ID, seconds: 1 }
        : null,
  });
}

async function getReadCounts() {
  const saved = await AsyncStorage.getItem(READ_COUNTS_KEY);

  if (!saved) return {};

  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

export async function getReadCommentCounts() {
  return getReadCounts();
}

export async function markCommentsRead(requestId, commentCount = 0) {
  const counts = await getReadCounts();
  const safeCount = Math.max(Number(commentCount || 0), counts[requestId] || 0);
  const nextCounts = {
    ...counts,
    [requestId]: safeCount,
  };

  await AsyncStorage.setItem(READ_COUNTS_KEY, JSON.stringify(nextCounts));
  return nextCounts;
}
