import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;

    const user = JSON.parse(stored);
    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });

    socket.emit("join", user._id);

    // ✅ Receive live updates
    socket.on("notification", (data) => {
      console.log("🟣 Real-time notification received:", data);
      setUnreadCount((prev) => prev + 1);
    });

    // 🔄 Fetch real unread count on load
    fetchUnreadCount(user._id);

    return () => socket.disconnect();
  }, []);

  const fetchUnreadCount = async (userId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/unread/${userId}`);
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error("❌ Failed to fetch unread count:", err);
    }
  };

  const markAllRead = () => {
    setUnreadCount(0); // ✅ Clear badge immediately
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      // Optional: re-sync from backend after short delay
      setTimeout(() => fetchUnreadCount(user._id), 500);
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
