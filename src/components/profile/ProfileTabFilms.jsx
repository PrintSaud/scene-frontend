import React from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "../StarRating";
import { AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

export default function ProfileTabFilms({ logs, favorites = [], customPosters = {} }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        padding: "12px 0"
      }}
    >
      {logs.map((log) => {
        const movieId = log.movie?.id || log.movie;
        const posterUrl =
          customPosters[movieId] ||
          log.poster ||
          (log.movie?.poster_path ? `${TMDB_IMG}${log.movie.poster_path}` : FALLBACK_POSTER);

        const isFavorite = favorites.includes(Number(movieId));
        const hasReview = log.review && log.review.trim().length > 0;

        const handleClick = () => {
          if (hasReview) {
            navigate(`/review/${log._id}`);
          } else {
            navigate(`/movie/${movieId}`);
          }
        };

        return (
          <div
            key={log._id}
            onClick={handleClick}
            style={{
              cursor: "pointer",
              textAlign: "center",
              position: "relative"
            }}
          >
            <img
              src={posterUrl}
              alt={log.title}
              style={{
                width: "100%",
                height: "200px", // 🔥 Slightly larger poster
                objectFit: "cover",
                borderRadius: "10px",
                marginBottom: "4px"
              }}
              onError={(e) => (e.currentTarget.src = FALLBACK_POSTER)}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "#aaa",
                fontFamily: "Inter"
              }}
            >
              <StarRating rating={log.rating} size={12} />
              {hasReview && <FaRegComment size={10} />}
              {isFavorite && <AiFillHeart size={10} color="#B327F6" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
