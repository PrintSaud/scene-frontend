// src/components/movie/MovieHeader.jsx
import React from "react";
import { backend } from "../../config";
import useTranslate from "../../utils/useTranslate";

export default function MovieHeader({
  movie,
  posterOverride,
  handleLogClick,
  handleWatchTrailer,
  handleSceneBotReview,
}) {
  const t = useTranslate();

  const TMDB_IMG = "https://image.tmdb.org/t/p/original";
  const defaultPoster = "/default-poster.jpg";

  const finalPoster =
    posterOverride ||
    (movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : defaultPoster);

  return (
    <div style={{ padding: "24px", marginTop: "-90px", position: "relative", zIndex: 3 }}>
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          flexWrap: "nowrap",
          overflowX: "hidden",
          maxWidth: "100%",
        }}
      >
        <img
          src={finalPoster}
          alt={t("alt.poster")}
          style={{ width: "150px", borderRadius: "8px" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultPoster;
          }}
        />

        <div
          style={{
            flex: 1,
            minWidth: "220px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div>
            {/* ✅ Keep movie title always original */}
            <h1 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "2px" }}>
              {movie.title}
            </h1>

            {movie.tagline && (
              <p
                style={{
                  fontSize: "11px",
                  fontStyle: "italic",
                  color: "#aaa",
                  marginBottom: "4px",
                }}
              >
                {t(movie.tagline)}
              </p>
            )}

            <p style={{ fontSize: "12px", color: "#ccc", marginBottom: "2px" }}>
              {movie.release_date?.slice(0, 4)} • {movie.runtime} {t("minutes")}
            </p>

            <p style={{ fontSize: "12px", color: "#ccc", marginBottom: "8px" }}>
              {movie.genres?.map((g) => t(g.name)).join(", ")}
            </p>
          </div>

          {/* 🎬 Buttons Row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button
              onClick={handleLogClick}
              style={{
                width: "80px",
                background: "#111",
                color: "#fff",
                padding: "6px 8px",
                borderRadius: "5px",
                border: "1px solid #444",
                fontWeight: "500",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              + {t("log")}
            </button>

            <button
              onClick={handleWatchTrailer}
              style={{
                width: "80px",
                background: "#111",
                color: "#fff",
                padding: "6px 8px",
                borderRadius: "5px",
                border: "1px solid #444",
                fontWeight: "500",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              🎞️ {t("trailer")}
            </button>

            <button
              onClick={handleSceneBotReview}
              style={{
                width: "167px",
                background: "#111",
                color: "#fff",
                padding: "6px 8px",
                borderRadius: "5px",
                border: "1px solid #444",
                fontWeight: "500",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              🤖 {t("ask_scenebot")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
