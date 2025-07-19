import React from "react";
import { TMDB_IMG } from "../../config";

export default function ProfileTabProfile({ favoriteMovies = [], logs = [], navigate, customPosters = {} }) {
  const recentlyWatched = Array.isArray(logs)
    ? logs
        .filter((log) => log.movie?.poster || log.movie?.poster_path)
        .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
        .slice(0, 6)
    : [];

  const handleLogClick = (log) => {
    if (!navigate) return;
    if (log.review) {
      navigate(`/review/${log._id}`);
    } else {
      navigate(`/movie/${log.movie?.id || log.movie}`);
    }
  };

  const hasFavorites = favoriteMovies.length > 0;

  return (
    <>
      {/* 🎬 Favorite Movies */}
      {hasFavorites ? (
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: "600" }}>
            Favorite Movies
          </h3>
          <div
            style={{
              overflowX: "auto",
              whiteSpace: "nowrap",
              display: "flex",
              gap: "10px",
              paddingBottom: "4px",
              marginTop: "10px",
            }}
          >
            {favoriteMovies.map((movie) => {
              const movieId = movie.id || movie.tmdbId || movie._id;
              const poster =
                customPosters[String(movieId)] ||
                (movie.poster?.startsWith("http")
                  ? movie.poster
                  : movie.poster
                  ? `${TMDB_IMG}${movie.poster}`
                  : movie.poster_path
                  ? `${TMDB_IMG}${movie.poster_path}`
                  : "/default-poster.jpg");

              return (
                <img
                  key={movieId}
                  src={poster}
                  alt={movie.title}
                  style={{
                    width: "90px",
                    height: "135px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", marginTop: "20px" }}>No favorite movies yet.</p>
      )}

      {/* 🕒 Recently Watched */}
      {recentlyWatched.length > 0 ? (
        <div style={{ marginTop: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: "600" }}>
              Recently Watched
            </h3>
            <button
              onClick={() => {
                const event = new CustomEvent("navigateToFilms");
                window.dispatchEvent(event);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              More →
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "10px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {recentlyWatched.map((log) => {
              const movieId = log.movie?.id || log.movie;
              const poster =
                customPosters[String(movieId)] ||
                (log.poster?.startsWith("http")
                  ? log.poster
                  : log.poster
                  ? `${TMDB_IMG}${log.poster}`
                  : log.movie?.poster_path
                  ? `${TMDB_IMG}${log.movie.poster_path}`
                  : "/default-poster.jpg");

              return (
                <div
                  key={log._id}
                  onClick={() => handleLogClick(log)}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                >
                  <img
                    src={poster}
                    alt={log.movie?.title}
                    style={{
                      width: "95px",
                      height: "145px",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                  />
                  {log.rating && (
                    <div
                      style={{
                        color: "#ccc",
                        fontSize: "12px",
                        textAlign: "center",
                        marginTop: "4px",
                      }}
                    >
                      ⭐ {log.rating}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", marginTop: "20px" }}>No recent logs yet.</p>
      )}
    </>
  );
}
