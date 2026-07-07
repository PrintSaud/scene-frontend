//Users/saudceo/flick-frontend/shared/utils/registerPushNotifications.js
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import api from "../api/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const PUSH_TOKEN_STORAGE_KEY = "scene:lastExpoPushToken:v2";

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    Constants?.manifest2?.extra?.eas?.projectId ||
    null
  );
}

export async function registerPushNotifications() {
  try {
    const rawUser = await AsyncStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (!user?.token) {
      console.log("🔕 Push skipped: no logged-in user token");
      return null;
    }

    if (!Device.isDevice) {
      console.log("🔕 Push skipped: physical device required");
      return null;
    }

    const currentPermissions = await Notifications.getPermissionsAsync();

    let finalStatus = currentPermissions.status;

    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
      console.log("🔕 Push permission not granted");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#B327F6",
      });
    }

    const projectId = getProjectId();

    const tokenResult = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const expoPushToken = tokenResult?.data;

    if (!expoPushToken) {
      console.log("🔕 No Expo push token returned");
      return null;
    }

    const cacheKey = `${user._id || user.id || "unknown"}:${expoPushToken}`;
    const lastSavedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    
    if (lastSavedToken === cacheKey) {
      console.log("✅ Expo push token already saved for this user");
      return expoPushToken;
    }

    await api.post("/api/auth/save-token", {
        deviceToken: expoPushToken,
        provider: "expo",
        platform: Platform.OS,
      });

    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, cacheKey);

    console.log("✅ Expo push token saved:", expoPushToken);
    return expoPushToken;
  } catch (err) {
    console.log(
      "❌ registerPushNotifications failed:",
      err?.response?.data || err?.message || err
    );
    return null;
  }
}

