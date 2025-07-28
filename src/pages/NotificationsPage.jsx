import React, { useEffect, useState } from "react";
import api from "../api/api";
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
      case "reaction": return "liked your comment";
      case "reply": return "replied to your comment";
      case "list_like": return "liked your list!";
      case "share-list": return "suggested you to check out this list!";
      case "suggest_movie": return "suggested you to check out this film!";
      case "share-review": return "suggested you to check out this review!";
      default:
        console.warn("❓ Unknown type:", type);
        return "sent you something!";
    }
  };
  
  

  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        await api.patch("/api/notifications/read");
        setHasUnread(0); // ✅ Clear count on open
      } catch (err) {
        console.error("Failed to mark all as read", err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get("/api/notifications");
        setNotifications(data);
        const unreadCount = data.filter((n) => !n.read).length;
        if (setHasUnread) setHasUnread(unreadCount);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
    markAllAsRead();

    socket.off("notification");
    socket.on("notification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      if (setHasUnread) {
        setHasUnread((prev) => prev + 1);
      }
      toast(`🔔 ${newNotif.message}`);
    });

    return () => socket.off("notification");
  }, []);

  const markAsReadAndNavigate = async (n, destination) => {
    try {
      await api.patch(`/api/notifications/read-single/${n._id}`);
      navigate(destination);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
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
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* 🔔 Heading */}
      <h2 style={{ marginBottom: "16px", fontWeight: "bold", fontFamily: "Inter" }}>
        🔔 Notifications
      </h2>

      {notifications.length === 0 ? (
        <p style={{ color: "#888" }}>You're all caught up. No notifications yet!</p>
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
