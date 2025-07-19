import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "../StarRating";
import { AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

export default function ProfileTabFilms({ logs, favorites = [] }) {
  const navigate = useNavigate();

  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");

  const sortedLogs = useMemo(() => {
    const sorted = [...logs];
    sorted.sort((a, b) => {
      let valA, valB;
      switch (sortType) {
        case "rating":
          valA = a.rating || 0;
          valB = b.rating || 0;
          break;
        case "release":
          valA = new Date(a.movie?.release_date || 0);
          valB = new Date(b.movie?.release_date || 0);
          break;
        case "runtime":
          valA = a.movie?.runtime || 0;
          valB = b.movie?.runtime || 0;
          break;
        default:
          valA = new Date(a.watchedAt || 0);
          valB = new Date(b.watchedAt || 0);
      }
      return (valA - valB) * (order === "asc" ? 1 : -1);
    });
    return sorted;
  }, [logs, sortType, order]);

  return (
    <>
      {/* 🔽 Filter UI */}
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
          style={{
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "13px",
            minWidth: "130px",
          }}
        >
          <option value="added">Recently Added</option>
          <option value="rating">Rating</option>
          <option value="release">Release Date</option>
          <option value="runtime">Runtime</option>
        </select>

        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          style={{
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "13px",
            minWidth: "130px",
          }}
        >
          <option value="desc">⬇ Descending</option>
          <option value="asc">⬆ Ascending</option>
        </select>
      </div>

      {/* 🎬 Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", padding: "0" }}>
        {sortedLogs.map((log) => {
          const movieId = log.movie?.id || log.movie;
          const posterUrl = log.posterOverride
            || (log.poster?.startsWith("http") ? log.poster
            : log.poster ? `${TMDB_IMG}${log.poster}`
            : log.movie?.poster_path ? `${TMDB_IMG}${log.movie.poster_path}`
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
            <div key={log._id} onClick={handleClick} style={{ position: "relative", cursor: "pointer" }}>
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
                {isFavorite && <AiFillHeart size={11} color="#B327F6" style={{ position: "relative", top: "-1px" }} />}
                {hasReview && <FaRegComment size={9} style={{ position: "relative", top: "-1.5px" }} />}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
