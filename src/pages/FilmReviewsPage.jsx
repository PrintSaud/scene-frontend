import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../api/api";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { IoArrowBack } from "react-icons/io5";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

const getRelativeTime = (date) => {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);

  if (min < 1) return "Just now";
  if (min < 60) return `${min}min ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day <= 7) return `${day}d ago`;

  const d = new Date(date);
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
};

export default function FilmReviewsPage() {
  const { movieId, userId } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  const myUserId = JSON.parse(localStorage.getItem("user"))?._id;

  useEffect(() => {
    axios
      .get(`/api/logs/user/${userId}/movie/${movieId}`)
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Failed to fetch reviews:", err));
  }, [userId, movieId]);

  const handleLike = async (logId) => {
    try {
      await axios.post(`/api/logs/${logId}/like`);
      setLogs((prev) =>
        prev.map((log) =>
          log._id === logId
            ? {
                ...log,
                likes: log.likes?.includes(myUserId)
                  ? log.likes.filter((id) => id !== myUserId)
                  : [...(log.likes || []), myUserId],
              }
            : log
        )
      );
    } catch (err) {
      console.error("Failed to like/unlike log:", err);
    }
  };

  return (
    <div style={{ padding: "12px" }}>
      {/* 🔙 Back button */}
      <div
        style={{ cursor: "pointer", color: "#fff", marginBottom: "12px" }}
        onClick={() => navigate(-1)}
      >
        <IoArrowBack size={22} />
      </div>

      {/* Reviews list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {logs.map((log) => {
          let poster = "/default-poster.png";
          if (log.posterOverride) {
            poster = log.posterOverride;
          } else if (log.poster) {
            poster = log.poster.startsWith("http")
              ? log.poster
              : `${TMDB_IMG}${log.poster}`;
          }

          const isLikedByMe = log.likes?.includes(myUserId);

          return (
            <div
              key={log._id}
              onClick={() => {
                const hasReview = log.review?.trim();
                const tmdbId = log.tmdbId || log.movie?.id || log.movie;
              
                if (hasReview) {
                  navigate(`/review/${log._id}`);
                } else if (tmdbId) {
                  navigate(`/movie/${tmdbId}`);
                } else {
                  console.warn("⚠️ Missing TMDB ID or review for log:", log);
                }
              }}
              
              style={{
                backgroundColor: "#181818",
                padding: "12px",
                borderRadius: "10px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* 📅 Relative timestamp in top right */}
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "12px",
                  fontSize: "11px",
                  color: "#888",
                }}
              >
                {getRelativeTime(log.watchedAt)}
              </div>

              {/* 🎬 Movie poster + review */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <img
                  src={poster}
                  alt={log.title}
                  style={{
                    width: "100px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, color: "#fff", fontSize: "15px" }}>
                    {log.title}
                  </h4>

                  {/* ⭐ Rating */}
                  <div
                    style={{
                      display: "flex",
                      gap: "3px",
                      marginTop: "4px",
                      fontSize: "18px",
                    }}
                  >
                    {[...Array(5)].map((_, i) => {
                      const isFull = i + 1 <= log.rating;
                      const isHalf =
                        log.rating >= i + 0.5 && log.rating < i + 1;
                      return (
                        <span key={i}>
                          {isFull ? (
                            <FaStar style={{ color: "#B327F6" }} />
                          ) : isHalf ? (
                            <FaStarHalfAlt style={{ color: "#B327F6" }} />
                          ) : (
                            <FaRegStar style={{ color: "#777" }} />
                          )}
                        </span>
                      );
                    })}
                  </div>

                  {/* 📝 Review text */}
                  <p
                    style={{
                      color: "#ccc",
                      fontSize: "13px",
                      fontFamily: "Inter, sans-serif",
                      marginTop: "8px",
                    }}
                  >
                    {log.review}
                  </p>
                </div>
              </div>

              {/* 🎁 GIF or Image */}
              {log.image && (
                <img
                  src={log.image}
                  alt="uploaded"
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    maxHeight: "220px",
                    objectFit: "cover",
                    marginTop: "10px",
                  }}
                />
              )}
              {log.gif && (
                <img
                  src={log.gif}
                  alt="gif"
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    maxHeight: "220px",
                    objectFit: "cover",
                    marginTop: "10px",
                  }}
                />
              )}

              {/* 🔥 Likes + 💬 Replies */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "10px",
                }}
              >
                {/* ❤️ Likes */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(log._id);
                  }}
                >
                  {isLikedByMe ? (
                    <AiFillHeart style={{ fontSize: "14px", color: "#B327F6" }} />
                  ) : (
                    <AiOutlineHeart style={{ fontSize: "14px", color: "#999" }} />
                  )}
                  <span style={{ fontSize: "13px", color: "#999" }}>
                    {log.likes?.length || 0}
                  </span>
                </div>

                {/* 💬 Replies */}
                {log.replies?.length > 0 && (
                  <span style={{ fontSize: "12px", color: "#999" }}>
                    💬 {log.replies.length}{" "}
                    {log.replies.length === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
