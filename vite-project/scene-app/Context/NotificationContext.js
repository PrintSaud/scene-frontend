// /Users/saudceo/flick-frontend/vite-project/scene-app/Context/NotificationContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../shared/api/api";
import { socket } from "../../../shared/socket";

const defaultNotificationValue = {
  unreadCount: 0,
  setUnreadCount: () => {},
  syncUnreadCount: async () => {},
  markAllRead: async () => {},
  markOneRead: async () => {},
};

const NotificationContext = createContext(defaultNotificationValue);

export const useNotification = () => {
  return useContext(NotificationContext) || defaultNotificationValue;
};

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const syncUnreadCount = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (!stored) {
        setUnreadCount(0);
        return;
      }

      const user = JSON.parse(stored);
      if (!user?._id) {
        setUnreadCount(0);
        return;
      }

      const { data } = await api.get("/api/notifications/unread-count");
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (err) {
      console.error(
        "❌ Failed to sync unread count:",
        err?.response?.data || err?.message || err
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setUnreadCount(0);

    try {
      await api.patch("/api/notifications/read");
    } catch (err) {
      console.error(
        "❌ Failed to mark all notifications as read:",
        err?.response?.data || err?.message || err
      );
      await syncUnreadCount();
    }
  }, [syncUnreadCount]);

  const markOneRead = useCallback(
    async (notificationId) => {
      if (!notificationId) return;

      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await api.patch(`/api/notifications/read-single/${notificationId}`);
      } catch (err) {
        console.error(
          "❌ Failed to mark one notification as read:",
          err?.response?.data || err?.message || err
        );
        await syncUnreadCount();
      }
    },
    [syncUnreadCount]
  );

  useEffect(() => {
    let appStateSub;
    let mounted = true;

    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (!stored) {
          setUnreadCount(0);
          return;
        }

        const user = JSON.parse(stored);
        if (!user?._id) {
          setUnreadCount(0);
          return;
        }

        try {
          socket.emit("join", user._id);
        } catch (socketErr) {
          console.log("Socket join skipped:", socketErr?.message || socketErr);
        }

        await syncUnreadCount();

        setTimeout(() => {
          if (mounted) syncUnreadCount();
        }, 1000);

        socket.off("notification");
        socket.on("notification", async (data) => {
          console.log("🟣 Real-time notification received:", data);

          setUnreadCount((prev) => prev + 1);

          setTimeout(() => {
            if (mounted) syncUnreadCount();
          }, 300);
        });

        appStateSub = AppState.addEventListener("change", (nextState) => {
          if (nextState === "active") {
            syncUnreadCount();
          }
        });
      } catch (err) {
        console.error("❌ NotificationContext init error:", err?.message || err);
      }
    };

    init();

    return () => {
      mounted = false;

      try {
        socket.off("notification");
      } catch {}

      if (appStateSub) appStateSub.remove();
    };
  }, [syncUnreadCount]);

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

