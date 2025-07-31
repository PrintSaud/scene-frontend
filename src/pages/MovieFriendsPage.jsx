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
        const res = await api.get(`/logs/movie/${id}/friends`);
        setFriendLogs(res.data); 
      } catch (err) {
        console.error("❌ Failed to load friend logs", err);
      }
    };

    fetchLogs();
  }, [id]);

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
          }}
        >
          ←
        </button>
        <h2 style={{ fontWeight: "bold", fontSize: "20px" }}>
          Watched by Friends
        </h2>
      </div>

      {/* Log List */}
      {logs.map((log) => (
        <div
          key={log._id}
          onClick={() =>
            log.review
              ? navigate(`/review/${log._id}`)
              : navigate(`/profile/${log.user._id}`)
          }
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
            cursor: "pointer",
          }}
        >
          {/* Avatar */}
          <img
            src={log.user.avatar || "/default-avatar.jpg"}
            alt="avatar"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              marginRight: "12px",
              objectFit: "cover",
            }}
          />

          {/* Username + Rating + Icon */}
          <div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              {log.user.username}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StarRating rating={log.rating || 0} />
              {log.review ? (
                <FaRegComment size={14} />
              ) : log.rewatchCount > 1 ? (
                <HiOutlineRefresh size={16} />
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
