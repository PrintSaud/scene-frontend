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

    // ✅ Match backend emit("notification")
    socket.on("notification", (data) => {
      console.log("🟣 Real-time notification received:", data);
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket.disconnect();
  }, []);

  const markAllRead = () => setUnreadCount(0); // ✅ Clear badge when user visits notifications page

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
