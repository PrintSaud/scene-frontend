// PushTest.js
import fetch from "node-fetch";

// Replace this with your device's Expo push token from TestFlight logs
const EXPO_PUSH_TOKEN = "ExponentPushToken[YA95Gq-KYj68BuZtfcg_r-v]";

async function sendPushNotification(token, title, body) {
  const message = {
    to: token,
    sound: "default",
    title,
    body,
    data: { extra: "Test data" },
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log("Push notification response:", data);
  } catch (err) {
    console.error("Error sending push notification:", err);
  }
}

// Run test
sendPushNotification(
  EXPO_PUSH_TOKEN,
  "Test Notification ✅",
  "If you see this, push notifications are working!"
);
