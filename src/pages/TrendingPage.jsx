// src/pages/TrendingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backend } from "../config";
import useTranslate from "../utils/useTranslate"; // ✅ translation hook

export default function TrendingPage() {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate();
  const t = useTranslate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await axios.get(`${backend}/api/movies/trending`);
        setMovies(data);
      } catch (err) {
        console.error("Error fetching trending movies:", err);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        color: "#fff",
        backgroundColor: "#0e0e0e",
        minHeight: "100dvh",
        paddingBottom: "120px",
        boxSizing: "border-box",
      }}
    >
      {/* 🔙 Back to Home */}
      <button
        onClick={() => navigate("/home")}
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          border: "none",
          color: "#fff",
          borderRadius: "12px",
          padding: "6px 12px",
          fontSize: "14px",
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 10,
          cursor: "pointer",
        }}
      >
        ← {t("Back")}
      </button>

      {/* 🔥 Header */}
      <h1
        style={{
          textAlign: "center",
          fontSize: "20px",
          marginTop: "60px",
          marginBottom: "30px",
          fontWeight: "600",
        }}
      >
        {t("Trending Movies This Week 🔥")}
      </h1>

      {/* 🎬 Movie Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "16px",
          justifyItems: "center",
        }}
      >
        {Array.isArray(movies) && movies.length > 0 ? (
          movies.map((movie) => (
            <div
              key={movie.id}
              style={{ cursor: "pointer", width: "100%", maxWidth: "160px" }}
              onClick={() => {
                navigate(`/movie/${movie.id}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "2 / 3",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 6px 12px rgba(0, 0, 0, 0.3)",
                }}
              >
                <img
                  src={
                    movie.poster?.startsWith("http")
                      ? movie.poster
                      : movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/default-poster.png"
                  }
                  alt={movie.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => (e.target.src = "/default-poster.png")}
                />
              </div>
              <p
                style={{
                  fontSize: "14px",
                  textAlign: "center",
                  marginTop: "8px",
                  lineHeight: "1.2em",
                  maxHeight: "2.4em",
                  overflow: "hidden",
                }}
              >
                {movie.title}
              </p>
            </div>
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center" }}>
            {t("No trending movies available.")}
          </p>
        )}
      </div>
    </div>
  );
}
