import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";
import { socket } from "../socket";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const syncUnreadCount = async () => {
    try {
      const { data } = await api.get("/api/notifications/unread-count");
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("❌ Failed to sync unread count:", err);
    }
  };

  const markAllRead = async () => {
    setUnreadCount(0);
    try {
      await api.patch("/api/notifications/read");
    } catch (err) {
      console.error("❌ Failed to mark all notifications as read:", err);
    }
  };

  const markOneRead = async (notificationId) => {
    try {
      await api.patch(`/api/notifications/read-single/${notificationId}`);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("❌ Failed to mark one notification as read:", err);
    }
  };

  useEffect(() => {
    let appStateSub;

    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (!stored) return;

        const user = JSON.parse(stored);
        if (!user?._id) return;

        socket.emit("join", user._id);

        await syncUnreadCount();

        socket.off("notification");
        socket.on("notification", (data) => {
          console.log("🟣 Real-time notification received:", data);
          setUnreadCount((prev) => prev + 1);
        });

        appStateSub = AppState.addEventListener("change", (nextState) => {
          if (nextState === "active") {
            syncUnreadCount();
          }
        });
      } catch (err) {
        console.error("❌ NotificationContext init error:", err);
      }
    };

    init();

    return () => {
      socket.off("notification");
      if (appStateSub) appStateSub.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        syncUnreadCount,
        markAllRead,
        markOneRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}