import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "../StarRating";
import { AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import axios from "../../api/api"; // or wherever you import your axios instance

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

export default function ProfileTabFilms({ logs, favorites = [] }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");

  useEffect(() => {
    if (logs.length > 100) {
      setIsLoading(true);
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 1000); // 1s loading screen for heavy logs
  
      return () => clearTimeout(timeout);
    } else {
      setIsLoading(false);
    }
  }, [logs]);

  const sortedLogs = useMemo(() => {
    let filtered = [...logs];
    
    // ⭐ FIX favorites filter to ensure numeric comparison
    if (sortType === "favorites") {
      filtered = filtered.filter((log) => {
        const movieId = log.movie?.id || log.movie;
        return favorites.includes(Number(movieId));
      });
      return filtered;
    }
  
    filtered.sort((a, b) => {
      let valA, valB;
      switch (sortType) {
        case "rating":
          valA = a.rating || 0;
          valB = b.rating || 0;
          break;
        case "release":
          valA = a.movie && a.movie.release_date
            ? new Date(a.movie.release_date).getTime()
            : 0;
          valB = b.movie && b.movie.release_date
            ? new Date(b.movie.release_date).getTime()
            : 0;
          break;
        case "runtime":
          valA = a.movie && a.movie.runtime
            ? a.movie.runtime
            : 0;
          valB = b.movie && b.movie.runtime
            ? b.movie.runtime
            : 0;
          break;
        default:
          valA = new Date(a.watchedAt || 0).getTime();
          valB = new Date(b.watchedAt || 0).getTime();
      }
      return (valA - valB) * (order === "asc" ? 1 : -1);
    });
  
    return filtered;
  }, [logs, sortType, order, favorites]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "300px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "18px",
        color: "#888",
      }}>
        🎞️ Loading your Films...
      </div>
    );
  }
  
  

  return (
    <>
      <div style={{ height: "6px" }} />

      {/* 🔽 Filter UI */}
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
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
          <option value="favorites">Favorites</option>
        </select>

        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          disabled={sortType === "favorites"}
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

      

      {/* 🎬 Grid or empty state */}
      {sortedLogs.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", marginTop: "30px", fontSize: "14px" }}>
          {sortType === "favorites"
            ? "You haven’t marked any favorite films yet."
            : "No films found for this filter."}
        </div>
        
      ) : (
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



            // Inside map:
            const handleClick = async () => {
              const user = JSON.parse(localStorage.getItem("user"));
              const token = user?.token;
              const ownerId = log.user?._id || log.user;
            
              if (!token || !ownerId) {
                return navigate(`/movie/${movieId}`);
              }
            
              try {
                const { data: logsForThisMovie } = await axios.get(
                  `/api/logs/user/${ownerId}/movie/${movieId}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
            
                // 🛠️ Check if at least one of them has a review
                const reviewedLog = logsForThisMovie.find((log) => log.review?.trim());
            
                if (reviewedLog) {
                  navigate(`/review/${reviewedLog._id}`);
                } else {
                  navigate(`/movie/${movieId}`);
                }
              } catch (err) {
                console.error("Failed to fetch logs for this movie", err);
                navigate(`/movie/${movieId}`); // fallback
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
                  {hasReview && <FaRegComment size={9} style={{ position: "relative", top: "-1.5px" }} />}
                  {isFavorite && <AiFillHeart size={11} color="#B327F6" style={{ position: "relative", top: "-1.5px" }} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
