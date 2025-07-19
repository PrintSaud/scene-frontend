import React from "react";
import { useNavigate } from "react-router-dom";
import { AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

export default function ProfileTabFilms({ logs, favorites = [] }) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "12px",
      padding: "12px 0"
    }}>
      {logs.map((log) => {
        const posterUrl = log.poster || FALLBACK_POSTER;
        const rating = log.rating ? log.rating.toFixed(1) : "0.0";
        const isFavorite = favorites.includes(Number(log.movie.id || log.movie));
        const hasReview = log.review && log.review.trim().length > 0;

        const handleClick = () => {
          if (hasReview) {
            navigate(`/review/${log._id}`);
          } else {
            navigate(`/movie/${log.movie.id || log.movie}`);
          }
        };

        return (
          <div
            key={log._id}
            onClick={handleClick}
            style={{ cursor: "pointer", textAlign: "center" }}
          >
            <img
              src={posterUrl}
              alt={log.title}
              style={{
                width: "100%",
                height: "160px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "4px"
              }}
              onError={(e) => (e.currentTarget.src = FALLBACK_POSTER)}
            />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 4px",
              fontSize: "11.5px",
              color: "#aaa",
              fontFamily: "Inter"
            }}>
              <span>⭐ {rating}</span>
              {hasReview && <FaRegComment size={12} />}
              {isFavorite && <AiFillHeart size={12} color="#B327F6" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
