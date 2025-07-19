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
        gap: "4px",
        padding: "0",
      }}
    >
      {logs.map((log) => {
        const movieId = log.movie?.id || log.movie;
        const posterUrl =
          customPosters[String(movieId)] ||
          (log.poster?.startsWith("http")
            ? log.poster
            : log.poster
            ? `${TMDB_IMG}${log.poster}`
            : log.movie?.poster_path
            ? `${TMDB_IMG}${log.movie.poster_path}`
            : FALLBACK_POSTER);

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
          <div key={log._id} style={{ position: "relative", cursor: "pointer" }} onClick={handleClick}>
            <img
              src={posterUrl}
              alt={log.title}
              style={{
                width: "100%",
                aspectRatio: "2/3",
                objectFit: "cover",
                borderRadius: "6px",
              }}
              onError={(e) => (e.currentTarget.src = FALLBACK_POSTER)}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "4px",
                padding: "2px 4px 0 4px",
                fontSize: "10px",
                color: "#aaa",
                fontFamily: "Inter",
              }}
            >
              <StarRating rating={log.rating} size={12} />
              {isFavorite && <AiFillHeart size={11} color="#B327F6" />}
              {hasReview && <FaRegComment size={9} style={{ position: "relative", top: "-1.5px" }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
