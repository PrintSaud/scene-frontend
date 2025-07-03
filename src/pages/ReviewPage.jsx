import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { backend } from "../config";
import toast from "react-hot-toast";

export default function ReviewPage() {
  const { logId } = useParams();
  const navigate = useNavigate();

  const [log, setLog] = useState(null);
  const [moreReviews, setMoreReviews] = useState([]);
  const [liked, setLiked] = useState(false);

  const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
  const user = JSON.parse(localStorage.getItem("user"));

  const handleDelete = async (logId) => {
    await api.delete(`/api/logs/${logId}`);
    toast.success("Deleted");
    navigate("/"); // Or refresh feed, etc
  };

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const { data } = await api.get(`/api/logs/${logId}`);
        setLog(data);
      } catch (err) {
        console.error("Failed to fetch log", err);
      }
    };

    fetchLog();
  }, [logId]);

  if (!log) return <div style={{ color: "white", padding: "20px" }}>Loading...</div>;

  const customPoster = log.movie?.customPoster;
  const defaultPoster = TMDB_IMG + log.movie?.poster;
  const poster = customPoster || defaultPoster || "/default-poster.png";

  return (
    <div style={{ backgroundColor: "#0e0e0e", minHeight: "100vh", color: "white", padding: "16px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", color: "#aaa", marginBottom: "16px", fontSize: "14px" }}
      >
        ← Back
      </button>

      {/* Poster */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src={poster}
          alt={log.movie?.title}
          style={{ width: "180px", borderRadius: "12px", marginBottom: "16px" }}
        />
      </div>

      {/* User Info */}
      {log.user && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <img src={log.user.avatar} alt="avatar" style={{ width: "30px", height: "30px", borderRadius: "50%" }} />
          <strong style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)" }}>@{log.user.username}</strong>
          <span style={{ marginLeft: "auto", fontSize: "14px", color: "#ffc107", fontWeight: "bold" }}>
            {log.rating?.toFixed(1)} / 5.0
          </span>
        </div>
      )}

      {/* Title + Review */}
      <h2 style={{ fontSize: "18px", margin: "12px 0 6px" }}>{log.movie?.title}</h2>
      <p style={{ fontSize: "15px", color: "#ccc", lineHeight: "1.7" }}>{log.review}</p>

      {/* Likes */}
      <div style={{ display: "flex", gap: "20px", marginTop: "14px", alignItems: "center" }}>
        <span
          onClick={() => setLiked(!liked)}
          style={{ cursor: "pointer", color: liked ? "#ff4d4d" : "#ccc", fontWeight: "500" }}
        >
          ❤️ {liked ? (log.likes || 0) + 1 : log.likes || 0} likes
        </span>
      </div>

      {/* More Reviews by User */}
      {log.user && (
        <div style={{ marginTop: "40px" }}>
          <h4 style={{ color: "#fff", marginBottom: "12px" }}>
            More by <span style={{ color: "#888" }}>@{log.user.username}</span>
          </h4>
          <div style={{ display: "flex", gap: "10px", overflowX: "auto" }}>
            {moreReviews.map((review) => {
              const reviewPoster = review.movie?.customPoster || TMDB_IMG + review.movie?.poster;
              return (
                <img
                  key={review._id}
                  src={reviewPoster}
                  alt={review.movie?.title}
                  style={{ width: "90px", height: "135px", borderRadius: "6px", flexShrink: 0 }}
                  onClick={() => navigate(`/review/${review._id}`)}
                />
              );
            })}
          </div>

          {user?._id === log.user._id && (
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button onClick={() => openEditModal(log)}>✏️ Edit</button>
              <button onClick={() => handleDelete(log._id)}>🗑️ Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
