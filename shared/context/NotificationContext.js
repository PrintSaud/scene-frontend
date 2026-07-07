// shared/context/NotificationContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "../socket";
// import { socket } from "shared/socket";
import { backend } from "../config";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (!stored) return;
        const user = JSON.parse(stored);

        socket.connect();
        socket.emit("join", user._id);

        socket.on("notification", (data) => {
          console.log("🟣 Real-time notification received:", data);
          setUnreadCount((prev) => prev + 1);
        });

        fetchUnreadCount(user._id);
      } catch (err) {
        console.error("❌ Notification init failed:", err);
      }

      return () => {
        socket.off("notification");
        socket.disconnect();
      };
    };
    init();
  }, []);

  const fetchUnreadCount = async (userId) => {
    try {
      const res = await fetch(`${backend}/api/notifications/unread/${userId}`);
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error("❌ Failed to fetch unread count:", err);
    }
  };

  const syncUnreadCount = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        await fetchUnreadCount(user._id);
      }
    } catch (err) {
      console.error("❌ syncUnreadCount failed:", err);
    }
  };

  const markAllRead = async () => {
    setUnreadCount(0);
    try {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        setTimeout(() => fetchUnreadCount(user._id), 500);
      }
    } catch {}
  };

  return (
    <NotificationContext.Provider
      value={{ unreadCount, markAllRead, syncUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
