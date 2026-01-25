// src/pages/NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import { format } from "timeago.js";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { toast } from "react-hot-toast";
import { useNotification } from "../context/NotificationContext";
import useTranslate from "../utils/useTranslate"; // ✅ translation hook

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const { markAllRead, syncUnreadCount } = useNotification();
  const t = useTranslate();

  const getActionText = (type) => {
    switch (type) {
      case "follow": return t("just followed you");
      case "review_like": return t("liked your review");
      case "reaction": return t("liked your comment");
      case "reply": return t("replied to your comment");
      case "list_like": return t("liked your list!");
      case "share-list": return t("suggested you to check out this list!");
      case "suggest_movie": return t("suggested you to check out this film!");
      case "share-review": return t("suggested you to check out this review!");
      case "share-movie": return t("shared a movie with you!");
      default:
        console.warn("❓ Unknown type:", type);
        return t("sent you something!");
    }
  };

  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        await api.patch("/api/notifications/read");
        markAllRead();     // ✅ clear purple dot globally
        syncUnreadCount(); // ✅ backend recheck
      } catch (err) {
        console.error("Failed to mark all as read", err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get("/api/notifications");
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
        toast.error(t("Failed to load notifications"));
      }
    };

    fetchNotifications();
    markAllAsRead();

    socket.off("notification");
    socket.on("notification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      toast(`${t("🔔 New notification")}: ${newNotif.message || ""}`);
      syncUnreadCount(); // ✅ increase dot count via backend check
    });

    return () => socket.off("notification");
  }, []);

  const markAsReadAndNavigate = async (n, destination) => {
    try {
      await api.patch(`/api/notifications/read-single/${n._id}`);
      navigate(destination);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
      toast.error(t("Something went wrong"));
    }
  };

  return (
    <div
      style={{
        background: "#0e0e0e",
        minHeight: "100vh",
        padding: "24px",
        color: "#fff",
        overflowY: "scroll",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Hide scrollbar */}
      <style>
        {`
          div::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* 🔔 Heading */}
      <h2 style={{ marginBottom: "16px", fontWeight: "bold", fontFamily: "Inter" }}>
        🔔 {t("Notifications")}
      </h2>

      {notifications.length === 0 ? (
        <p style={{ color: "#888" }}>{t("You're all caught up. No notifications yet!")}</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 0",
              borderBottom: "1px solid #222",
            }}
          >
            <img
              src={n.from?.avatar || "/default-avatar.png"}
              alt={t("Avatar")}
              onClick={() => navigate(`/profile/${n.from?._id}`)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #444",
                cursor: "pointer",
              }}
            />

            <div style={{ flex: 1 }}>
              {/* 🧠 Notification text */}
              <div
                onClick={() => {
                  if (n.type === "follow") {
                    navigate(`/profile/${n.from?._id}`);
                  } else if (["review_like", "reaction", "reply"].includes(n.type)) {
                    markAsReadAndNavigate(n, `/review/${n.relatedId}`);
                  } else if (n.type === "share-list" || n.type === "list_like") {
                    markAsReadAndNavigate(n, `/list/${n.listId}`);
                  } else if (n.type === "share-movie" || n.type === "suggest_movie") {
                    markAsReadAndNavigate(n, `/movie/${n.movieId || n.relatedId}`);
                  } else if (n.type === "share-review") {
                    markAsReadAndNavigate(n, `/review/${n.reviewId}`);
                  }
                }}
                style={{ fontSize: "14px", color: "#ddd", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "Inter", fontWeight: "500", color: "#fff" }}>
                  @{n.from?.username}
                </span>{" "}
                {getActionText(n.type)}
              </div>

              {/* 🎬 View content buttons */}
              {n.type === "suggest_movie" && (
                <button
                  onClick={() => markAsReadAndNavigate(n, `/movie/${n.movieId}`)}
                  style={buttonStyle}
                >
                  🎬 {t("View Movie")}
                </button>
              )}

              {n.type === "share-list" && (
                <button
                  onClick={() => markAsReadAndNavigate(n, `/list/${n.listId}`)}
                  style={buttonStyle}
                >
                  📋 {t("View List")}
                </button>
              )}

              {n.type === "share-review" && (
                <button
                  onClick={() => markAsReadAndNavigate(n, `/review/${n.reviewId}`)}
                  style={buttonStyle}
                >
                  ✍️ {t("View Review")}
                </button>
              )}

              <div style={{ fontSize: "12px", color: "#888" }}>{format(n.createdAt)}</div>
            </div>

            {!n.read && (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#b46eff", // Scene purple dot
                }}
              />
            )}
          </div>
        ))
      )}

      <div style={{ height: "80px" }} /> {/* bottom padding for scroll */}
    </div>
  );
}

const buttonStyle = {
  marginTop: "6px",
  padding: "4px 10px",
  background: "#222",
  border: "1px solid #555",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
  color: "#fff",
};
