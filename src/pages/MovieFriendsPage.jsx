import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import StarRating from "../components/StarRating";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaRegComment } from "react-icons/fa";

export default function MovieFriendsPage() {
  const { id } = useParams(); // TMDB movie ID
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/api/logs/movie/${id}/friends`);
        setLogs(res.data);
      } catch (err) {
        console.error("❌ Failed to load friend logs", err);
      }
    };

    fetchLogs();
  }, [id]);

  // ✅ Deduplicate by user
  const seen = new Set();
  const uniqueLogs = logs.filter((log) => {
    if (seen.has(log.user._id)) return false;
    seen.add(log.user._id);
    return true;
  });

  return (
    <div
      style={{
        backgroundColor: "#0e0e0e",
        minHeight: "100vh",
        color: "white",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "20px",
            marginRight: "12px",
            cursor: "pointer",
          }}
        >
          ←
        </button>
        <h2 style={{ fontWeight: "bold", fontSize: "20px" }}>
          Watched by Friends
        </h2>
      </div>

      {/* Log List */}
      {uniqueLogs.map((log, index) => {
        const sameUserLogs = logs.filter(
          (l) => l.user._id === log.user._id
        );

        const reviews = sameUserLogs.filter((l) => l.review);
        const hasMultipleReviews = reviews.length > 1;
        const displayLog =
          sameUserLogs.find((l) => l.rating) ||
          sameUserLogs.find((l) => l.review) ||
          sameUserLogs.find((l) => l.rewatchCount > 0 || l.rewatch > 0) ||
          sameUserLogs[0];

        const hasRating = typeof displayLog.rating === "number";
        const hasReview =
          typeof displayLog.review === "string" &&
          displayLog.review.trim() !== "";
        const hasRewatch =
          (typeof displayLog.rewatchCount === "number" &&
            displayLog.rewatchCount > 0) ||
          (typeof displayLog.rewatch === "number" && displayLog.rewatch > 0);

        return (
          <React.Fragment key={log._id + index}>
            <div
              onClick={() => {
                if (hasMultipleReviews) {
                  navigate(`/movie/${id}/reviews/${log.user._id}`);
                } else if (hasReview) {
                  navigate(`/review/${reviews[0]._id}`);
                } else {
                  navigate(`/profile/${log.user._id}`);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                paddingBottom: "14px",
                marginBottom: "14px",
                cursor: "pointer",
                borderBottom: "1px solid #333",
              }}
            >
              {/* Avatar */}
              <img
                src={
                  log.user.avatar?.startsWith("http")
                    ? log.user.avatar
                    : "/default-avatar.png"
                }
                alt="avatar"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  marginRight: "14px",
                  objectFit: "cover",
                }}
              />

              {/* Username + Rating + Icon */}
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  {log.user.username}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#ccc",
                  }}
                >
                  {hasRating && <StarRating rating={displayLog.rating} />}
                  {hasReview && <FaRegComment size={14} />}
                  {hasRewatch && <HiOutlineRefresh size={16} />}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
