import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/api";
import { backend } from "../config";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

export default function ListViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [list, setList] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const { data } = await axios.get(`${backend}/api/lists/${id}`);
        setList(data);
        if (user) {
          setIsLiked(data.likes?.includes(user._id));
        }
      } catch (err) {
        console.error("Failed to fetch list:", err);
      }
    };
    fetchList();
  }, [id]);

  const handleLike = async () => {
    try {
      await axios.post(`${backend}/api/lists/${id}/like`);
      setIsLiked(!isLiked);
      setList((prev) => ({
        ...prev,
        likes: isLiked
          ? prev.likes.filter((uid) => uid !== user._id)
          : [...prev.likes, user._id],
      }));
    } catch (err) {
      console.error("Failed to like list:", err);
    }
  };

  if (!list) {
    return <div style={{ color: "white", padding: "20px" }}>Loading...</div>;
  }

  const isOwner = user && list.user._id === user._id;

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", color: "white", paddingBottom: "80px" }}>
      {/* Cover */}
      {list.coverImage && (
        <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
          <img
            src={list.coverImage}
            alt="cover"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, #0e0e0e 100%)"
          }} />
                <button
        onClick={() => navigate(-1)}
        style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            background: "#1a1a1a",
            color: "white",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #444",
            fontSize: "12px",
            zIndex: 2
          }}
      >
        ←
      </button>
          {isOwner && (
            <button
              onClick={() => navigate(`/list/${id}/edit`)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#1a1a1a",
                color: "white",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #444",
                fontSize: "12px",
                zIndex: 2
              }}
            >
              Edit
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "16px" }}>
        <h2 style={{
          marginBottom: "4px",
          fontSize: "22px",
          fontFamily: "Inter, sans-serif",
          fontWeight: "600"
        }}>
          {list.title}
        </h2>

        <p style={{
          color: "#bbb",
          marginBottom: "12px",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          lineHeight: "1.4"
        }}>
          {list.description}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#aaa" }}>
          <img
            src={list.user.avatar}
            alt="avatar"
            style={{ width: "28px", height: "28px", borderRadius: "50%" }}
          />
          <span style={{ fontFamily: "Inter, sans-serif" }}>@{list.user.username}</span>

          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#aaa" }}>
              {new Date(list.createdAt).toLocaleDateString()}
            </div>
            <div style={{ fontSize: "13px", color: "#aaa", marginTop: "2px" }}>
              ❤️ {list.likes?.length || 0} {list.likes?.length === 1 ? "like" : "likes"}
            </div>
          </div>
        </div>

        {/* Like Button */}
        <div style={{ marginTop: "16px" }}>
          <button onClick={handleLike} style={actionBtn}>
            {isLiked ? "❤️ Liked" : "🤍 Like"}
          </button>
        </div>
      </div>

      {/* Movies as poster grid */}
      <div style={{ padding: "0 16px" }}>
  <h3 style={{ marginBottom: "12px" }}>🎬 {list.isRanked ? "Ranked Movies" : "Movies"}:</h3>
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "12px"
  }}>
    {list.movies.map((movie, index) => {
        const posterUrl =
        movie.poster?.startsWith("http")
          ? movie.poster
          : movie.poster
          ? `${TMDB_IMG}${movie.poster}`
          : "/default-poster.jpg";
      

      return (
        <div
          key={movie.id}
          onClick={() => navigate(`/movie/${movie.id}`)}
          style={{ cursor: "pointer", textAlign: "center" }}
        >
          <img
            src={posterUrl}
            alt={movie.title}
            style={{
              width: "100%",
              height: "180px",
              objectFit: "cover",
              borderRadius: "8px",
              marginBottom: "4px"
            }}
          />
          <div style={{
            fontSize: "12px",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            lineHeight: "1.2"
          }}>
            {list.isRanked ? `${index + 1}. ` : ""}{movie.title}
          </div>
        </div>
      );
    })}
  </div>
</div>

    </div>
  );
}

const actionBtn = {
  background: "#1a1a1a",
  color: "#fff",
  padding: "6px 12px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #333",
  cursor: "pointer",
};
