import React, { useEffect, useState } from "react";
import axios from "../api/api"; // ✅ Token-aware instance
import { format } from "timeago.js";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { toast } from "react-hot-toast";

export default function NotificationsPage({ setHasUnread }) {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get("/api/notifications"); // ✅ Clean & token-ready
        setNotifications(data);
        if (setHasUnread) {
          const hasUnread = data.some((n) => !n.read);
          setHasUnread(hasUnread);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();

    socket.off("notification");
    socket.on("notification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      if (setHasUnread) setHasUnread(true);
      toast(`🔔 ${newNotif.message}`);
    });

    return () => {
      socket.off("notification");
    };
  }, []);

  const handleClick = async (n) => {
    try {
      await axios.patch(`/api/notifications/read-single/${n._id}`);
  
      setNotifications((prev) =>
        prev.map((notif) => notif._id === n._id ? { ...notif, read: true } : notif)
      );
  
      if (setHasUnread) {
        const anyUnread = notifications.some((notif) => notif._id !== n._id && !notif.read);
        setHasUnread(anyUnread);
      }
  
      // 📩 Smart routing
      if (n.type === "follow") {
        navigate(`/profile/${n.from?._id}`);
      } else if (["review_like", "reaction", "reply"].includes(n.type)) {
        navigate(`/review/${n.relatedId}`);
      } else if (n.type === "suggest_movie") {
        navigate(`/movie/${n.relatedId}`);
      } else if (n.type === "share-list") {
        navigate(`/list/${n.listId}`);  // ✅ ADD THIS LINE
      } else if (n.type === "share-movie") {
        navigate(`/movie/${n.movieId}`);  // Optional: support share-movie too!
      }
  
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };
  

  const markAllAsRead = async () => {
    try {
      await axios.patch("/api/notifications/read"); // ✅
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      if (setHasUnread) setHasUnread(false);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`); // ✅
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (setHasUnread) {
        const anyUnread = notifications.some((n) => n._id !== id && !n.read);
        setHasUnread(anyUnread);
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", padding: "24px", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ margin: 0 }}>🔔 Notifications</h2>

        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              padding: "6px 10px",
              background: "#222",
              color: "#fff",
              borderRadius: "4px",
              border: "1px solid #444",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ✅ Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p style={{ color: "#888" }}>You're all caught up. No notifications yet!</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => handleClick(n)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (window.confirm("🗑️ Delete this notification?")) {
                handleDelete(n._id);
              }
            }}
            onTouchStart={(e) => {
              const timeout = setTimeout(() => {
                if (window.confirm("🗑️ Delete this notification?")) {
                  handleDelete(n._id);
                }
              }, 600);
              e.target.addEventListener("touchend", () => clearTimeout(timeout), { once: true });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 0",
              borderBottom: "1px solid #222",
              cursor: "pointer",
              opacity: n.read ? 0.5 : 1,
              transition: "0.2s",
            }}
          >
            <img
              src={n.from?.avatar || "/default-avatar.png"}
              alt="Avatar"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #444",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", color: "#eee" }}>{n.message}</div>
              <div style={{ fontSize: "12px", color: "#888" }}>{format(n.createdAt)}</div>
            </div>
            {!n.read && (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "red",
                }}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}
