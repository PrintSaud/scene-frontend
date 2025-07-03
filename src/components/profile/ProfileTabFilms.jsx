import React from "react";

export default function ProfileTabFilms({ logs = [], navigate }) {
  const handleClick = (log) => {
    if (log.review) {
      navigate(`/review/${log._id}`);
    } else {
      navigate(`/movie/${log.movie?._id || log.movieId}`);
    }
  };

  const sortedLogs = logs
    .filter((log) => log.movie?.poster)
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
        marginTop: "16px",
      }}
    >
      {sortedLogs.map((log) => (
        <div
          key={log._id}
          onClick={() => handleClick(log)}
          style={{ cursor: "pointer" }}
        >
          <img
            src={log.movie?.customPoster || log.movie?.poster}
            alt={log.movie?.title}
            style={{
              width: "100%",
              aspectRatio: "2/3",
              objectFit: "cover",
              borderRadius: "6px",
            }}
          />

          {/* ⭐ Rating + 📝 Review */}
          {log.rating && (
            <div
              style={{
                marginTop: "4px",
                fontSize: "13px",
                color: "#ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              ⭐ {log.rating}
              {log.review && <span>📝</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
