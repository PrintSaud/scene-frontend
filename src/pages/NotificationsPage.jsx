import React, { useEffect, useState } from "react";
import axios from "../api/api";
import { format } from "timeago.js";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { toast } from "react-hot-toast";

export default function NotificationsPage({ setHasUnread }) {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const getActionText = (type) => {
    switch (type) {
      case "follow": return "just followed you";
      case "review_like": return "liked your review";
      case "reply": return "replied to your review";
      case "reaction": return "liked your reply";
      case "suggest_movie": return "suggested a movie for you";
      case "share-list": return "shared a list with you";
      case "share-movie": return "shared a movie with you";
      case "share-review": return "shared a review with you";
      default: return "sent you a notification";
    }
  };

  // ✅ Auto-mark all as read when opening
  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        await axios.patch("/api/notifications/read");
        setHasUnread(false);
      } catch (err) {
        console.error("Failed to mark all as read", err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get("/api/notifications");
        setNotifications(data);
        const hasUnread = data.some((n) => !n.read);
        if (setHasUnread) setHasUnread(hasUnread);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
    markAllAsRead();

    socket.off("notification");
    socket.on("notification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      if (setHasUnread) setHasUnread(true);
      toast(`🔔 ${newNotif.message}`);
    });

    return () => socket.off("notification");
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const markAsReadAndNavigate = async (n, destination) => {
    try {
      await axios.patch(`/api/notifications/read-single/${n._id}`);
      navigate(destination);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <div
  style={{
    background: "#0e0e0e",
    height: "100vh",
    overflowY: "auto", // ✅ enable vertical scroll
    padding: "24px",
    color: "#fff",
    WebkitOverflowScrolling: "touch", // ✅ smooth scroll on mobile
  }}
>

      {/* 🔔 Heading */}
      <h2 style={{ marginBottom: "16px", fontWeight: "bold" }}>
        🔔 Notifications
      </h2>

      {notifications.length === 0 ? (
        <p style={{ color: "#888" }}>You're all caught up. No notifications yet!</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            onContextMenu={(e) => {
              e.preventDefault();
              if (window.confirm("🗑️ Delete this notification?")) handleDelete(n._id);
            }}
            onTouchStart={(e) => {
              const timeout = setTimeout(() => {
                if (window.confirm("🗑️ Delete this notification?")) handleDelete(n._id);
              }, 600);
              e.target.addEventListener("touchend", () => clearTimeout(timeout), { once: true });
            }}
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
              alt="Avatar"
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
                  } else if (n.type === "share-list") {
                    markAsReadAndNavigate(n, `/list/${n.listId}`);
                  } else if (n.type === "share-movie") {
                    markAsReadAndNavigate(n, `/movie/${n.movieId}`);
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

              {/* 🎬 View content buttons by type */}
              {n.type === "suggest_movie" && (
                <button
                  onClick={() => markAsReadAndNavigate(n, `/movie/${n.relatedId}`)}
                  style={buttonStyle}
                >
                  🎬 View Movie
                </button>
              )}

              {n.type === "share-list" && (
                <button
                  onClick={() => markAsReadAndNavigate(n, `/list/${n.listId}`)}
                  style={buttonStyle}
                >
                  📋 View List
                </button>
              )}

              {n.type === "share-review" && (
                <button
                  onClick={() => markAsReadAndNavigate(n, `/review/${n.reviewId}`)}
                  style={buttonStyle}
                >
                  ✍️ View Review
                </button>
              )}

              <div style={{ fontSize: "12px", color: "#888" }}>{format(n.createdAt)}</div>
            </div>

            {!n.read && (
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "red" }} />
            )}
          </div>
        ))
      )}
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
