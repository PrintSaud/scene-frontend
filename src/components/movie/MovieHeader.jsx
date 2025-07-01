// src/components/movie/MovieHeader.jsx
import React from "react";

export default function MovieHeader({
  movie,
  posterOverride,
  handleLogClick,
  handleWatchTrailer,
  handleSceneBotReview,
}) {
  const TMDB_IMG = "https://image.tmdb.org/t/p/original";

  return (
    <div style={{ padding: "24px", marginTop: "-90px", position: "relative", zIndex: 3 }}>
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <img
          src={posterOverride || `${TMDB_IMG}${movie.poster_path}`}
          alt="Poster"
          style={{ width: "150px", borderRadius: "8px" }}
        />

        <div style={{ flex: 1, minWidth: "220px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>{movie.title}</h1>

          {movie.tagline && (
            <p style={{ fontStyle: "italic", color: "#aaa", marginBottom: "8px" }}>
              {movie.tagline}
            </p>
          )}

          <p style={{ margin: "8px 0", color: "#ccc" }}>
            {movie.release_date?.slice(0, 4)} • {movie.runtime} min
          </p>

          <p style={{ color: "#ccc", marginBottom: "20px" }}>
            {movie.genres?.map((g) => g.name).join(", ")}
          </p>

          {/* 🎬 Log + Trailer */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
            <button
              aria-label="Log this movie"
              onClick={handleLogClick}
              style={{
                flex: 1,
                background: "#111",
                color: "#fff",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              + Log
            </button>

            <button
              aria-label="Watch trailer"
              onClick={handleWatchTrailer}
              style={{
                flex: 1,
                background: "#111",
                color: "#fff",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🎞️ Watch Trailer
            </button>
          </div>

          {/* 🤖 SceneBot */}
          <button
            onClick={handleSceneBotReview}
            style={{
              width: "100%",
              background: "#111",
              color: "#fff",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #444",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            🤖 Ask SceneBot For a Review
          </button>
        </div>
      </div>
    </div>
  );
}
