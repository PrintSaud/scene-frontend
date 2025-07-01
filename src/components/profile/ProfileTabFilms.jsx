import React from "react";

export default function ProfileTabFilms({ logs, navigate }) {
  const handleClick = (log) => {
    if (log.review) {
      navigate(`/review/${log._id}`);
    } else {
      navigate(`/movie/${log.movie?._id || log.movieId}`);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
        marginTop: "16px",
      }}
    >
      {logs
        .filter((log) => log.movie?.poster)
        .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
        .map((log) => (
          <div
            key={log._id}
            onClick={() => handleClick(log)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={log.movie?.poster}
              alt={log.movie?.title}
              style={{
                width: "100%",
                aspectRatio: "2/3",
                objectFit: "cover",
                borderRadius: "6px",
              }}
            />
            {/* ⭐ Rating + 📝 Review icon */}
            <div
              style={{
                marginTop: "4px",
                fontSize: "13px",
                color: "#ddd",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>⭐ {log.rating}</span>
              {log.review && <span>📝</span>}
            </div>
          </div>
        ))}
    </div>
  );
}
