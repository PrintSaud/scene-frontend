import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "../StarRating";
import { AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import axios from "../../api/api";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

export default function ProfileTabFilms({ logs, favorites = [], profileUserId, customPosters = {} }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");
  const [tmdbFallbacks, setTmdbFallbacks] = useState({});

  useEffect(() => {
    if (logs.length > 100) {
      setIsLoading(true);
      const timeout = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timeout);
    } else {
      setIsLoading(false);
    }
  }, [logs]);

  // ✅ Fetch TMDB posters if no custom exists
  useEffect(() => {
    const fetchFallbackPosters = async () => {
      const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
  
      // ✅ Get IDs with no custom posters
      const idsToFetch = logs
        .map((log) => log.tmdbId || log.movie?.id || log.movie?._id || log.movie)
        .filter((id) => id && !customPosters[String(id)]);
  
      const uniqueIds = [...new Set(idsToFetch)];
  
      const posterMap = {};
      const preloadCount = 60;
  
      const preloadIds = uniqueIds.slice(0, preloadCount);
      const backgroundIds = uniqueIds.slice(preloadCount);
  
      const fetchPoster = async (id) => {
        try {
          const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`);
          const data = await res.json();
          posterMap[id] = data?.poster_path ? `${TMDB_IMG}${data.poster_path}` : FALLBACK_POSTER;
        } catch (err) {
          posterMap[id] = FALLBACK_POSTER;
        }
      };
  
      // ✅ Preload first 30–60 immediately
      await Promise.all(preloadIds.map(fetchPoster));
      setTmdbFallbacks({ ...posterMap });
  
      // ⏳ Fetch the rest in background
      setTimeout(async () => {
        await Promise.all(backgroundIds.map(fetchPoster));
        setTmdbFallbacks((prev) => ({ ...prev, ...posterMap }));
      }, 0); // can adjust delay if needed
    };
  
    fetchFallbackPosters();
  }, [logs, customPosters]);
  

  const sortedLogs = useMemo(() => {
    let filtered = [...logs];
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
          valA = new Date(a.movie?.release_date || 0).getTime();
          valB = new Date(b.movie?.release_date || 0).getTime();
          break;
        case "runtime":
          valA = a.movie?.runtime || 0;
          valB = b.movie?.runtime || 0;
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
        🎞️ Loading your Scenes...
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

      {/* 🎬 Grid */}
      {sortedLogs.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", marginTop: "30px", fontSize: "14px" }}>
          {sortType === "favorites"
            ? "You haven’t marked any favorite films yet."
            : "No films found for this filter."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
          {sortedLogs.map((log) => {
            const movieId = log.tmdbId || log.movie?.id || log.movie?._id || log.movie;

            const posterUrl =
            customPosters[String(movieId)] ||
            tmdbFallbacks[String(movieId)] ||
            (log.movie?.poster_path ? `${TMDB_IMG}${log.movie.poster_path}` : FALLBACK_POSTER);
          

            const isFavorite = favorites.includes(Number(movieId));
            const hasReview = log.review && log.review.trim().length > 0;

            const handleClick = async () => {
              const user = JSON.parse(localStorage.getItem("user"));
              const token = user?.token;
              const ownerId = log.user?._id || log.user;

              if (!token || !ownerId) return navigate(`/movie/${movieId}`);

              try {
                const { data: logsForThisMovie } = await axios.get(
                  `/api/logs/user/${ownerId}/movie/${movieId}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                const reviewedLog = logsForThisMovie.find((log) => log.review?.trim());
                if (reviewedLog) navigate(`/review/${reviewedLog._id}`);
                else navigate(`/movie/${movieId}`);
              } catch (err) {
                console.error("Failed to fetch logs for this movie", err);
                navigate(`/movie/${movieId}`);
              }
            };

            return (
              <div key={log._id} onClick={handleClick} style={{ position: "relative", cursor: "pointer" }}>
                <img
  src={posterUrl}
  loading="lazy" // ✅ THIS line adds the lazy loading boost
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
