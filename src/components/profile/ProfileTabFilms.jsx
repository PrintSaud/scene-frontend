// src/components/profile/ProfileTabFilms.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "../StarRating";
import { AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import axios from "../../api/api";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

function toTmdbIdAny(x) {
  const id =
    x?.tmdbId ??
    x?.movie?.tmdbId ??
    x?.movie?.id ??
    x?.movieId ??
    x?.id ??
    (typeof x === "number" || (typeof x === "string" && /^\d+$/.test(x)) ? x : null);

  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

export default function ProfileTabFilms({
  logs = [],
  favorites = [], // numeric TMDB ids
  profileUserId,
  customPosters = {},
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");
  const [tmdbFallbacks, setTmdbFallbacks] = useState({});
  const [customPostersState, setCustomPostersState] = useState({});
  const [lsFavorites, setLsFavorites] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      const favs = Array.isArray(stored?.favorites) ? stored.favorites : [];
      setLsFavorites(favs);
    } catch {
      setLsFavorites([]);
    }
  }, []);

  const effectiveFavorites = favorites?.length ? favorites : lsFavorites;

  const favIds = useMemo(
    () => (effectiveFavorites || []).map((f) => Number(f)).filter(Number.isFinite),
    [effectiveFavorites]
  );

  const isFav = useCallback((tmdbId) => favIds.includes(Number(tmdbId)), [favIds]);

  useEffect(() => {
    if ((logs?.length || 0) > 100) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(t);
    }
    setIsLoading(false);
  }, [logs]);

  useEffect(() => {
    const fetchFallbackPosters = async () => {
      try {
        const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
        if (!TMDB_KEY) return;

        const idsToFetch = [];
        for (const log of logs) {
          const id = toTmdbIdAny(log);
          if (!id) continue;
          if (customPosters[String(id)]) continue;
          if (customPostersState[String(id)]) continue;
          if (tmdbFallbacks[String(id)]) continue;
          idsToFetch.push(id);
        }

        const uniqueIds = [...new Set(idsToFetch)];
        if (uniqueIds.length === 0) return;

        const posterMap = {};
        for (const id of uniqueIds) {
          try {
            const res = await fetch(
              `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`
            );
            const data = await res.json();
            posterMap[id] = data?.poster_path
              ? `${TMDB_IMG}${data.poster_path}`
              : FALLBACK_POSTER;
          } catch {
            posterMap[id] = FALLBACK_POSTER;
          }
        }

        if (Object.keys(posterMap).length) {
          setTmdbFallbacks((prev) => ({ ...prev, ...posterMap }));
        }
      } catch {
        // ignore
      }
    };

    fetchFallbackPosters();
  }, [logs, customPosters, customPostersState, tmdbFallbacks]);

  useEffect(() => {
    const fetchCustomPosters = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;

        const movieIds = logs.map(toTmdbIdAny).filter(Boolean);
        const uniqueIds = [...new Set(movieIds)];
        if (uniqueIds.length === 0) return;

        const { data } = await axios.post(
          "/api/posters/batch",
          { userId: profileUserId, movieIds: uniqueIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data && typeof data === "object") {
          setCustomPostersState(data);
        }
      } catch (err) {
        console.error("❌ Failed to load custom posters", err);
      }
    };

    if (profileUserId) fetchCustomPosters();
  }, [logs, profileUserId]);

  const sortedLogs = useMemo(() => {
    const base = Array.isArray(logs) ? [...logs] : [];

    if (sortType === "favorites") {
      return base.filter((lg) => {
        const id = toTmdbIdAny(lg);
        return id && isFav(id);
      });
    }

    base.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      switch (sortType) {
        case "rating":
          valA = Number(a.rating || 0);
          valB = Number(b.rating || 0);
          break;
        case "release":
          valA = new Date(a.movie?.release_date || 0).getTime();
          valB = new Date(b.movie?.release_date || 0).getTime();
          break;
        case "runtime":
          valA = Number(a.movie?.runtime || 0);
          valB = Number(b.movie?.runtime || 0);
          break;
        default:
          valA = new Date(a.createdAt || a.watchedAt || 0).getTime();
          valB = new Date(b.createdAt || b.watchedAt || 0).getTime();
      }
      const dir = order === "asc" ? 1 : -1;
      return (valA - valB) * dir;
    });

    return base;
  }, [logs, sortType, order, isFav]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "300px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "18px",
          color: "#888",
        }}
      >
        🎞️ Loading your Scenes...
      </div>
    );
  }

  return (
    <>
      <div style={{ height: "6px" }} />

      {/* Sorting Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
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

      {/* Logs Grid */}
      {sortedLogs.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#888",
            marginTop: "30px",
            fontSize: "14px",
          }}
        >
          {sortType === "favorites"
            ? "You haven’t marked any favorite films yet."
            : "No films found for this filter."}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(110px, 1fr))", // ✅ responsive grid
            gap: "8px",
          }}
        >
          {sortedLogs.map((lg) => {
            const movieId = toTmdbIdAny(lg);
            const posterUrl =
              customPostersState[String(movieId)] ||
              customPosters[String(movieId)] ||
              tmdbFallbacks[String(movieId)] ||
              (lg.movie?.poster_path ? `${TMDB_IMG}${lg.movie.poster_path}` : FALLBACK_POSTER);

            const favorite = isFav(movieId);
            const hasReview = !!(lg.review && lg.review.trim().length > 0);

            const handleClick = async () => {
              const stored = JSON.parse(localStorage.getItem("user"));
              const token = stored?.token;
              const ownerId = lg.user?._id || lg.user;
              if (!movieId) return;

              if (!token || !ownerId) return navigate(`/movie/${movieId}`);

              try {
                const { data: logsForThisMovie } = await axios.get(
                  `/api/logs/user/${ownerId}/movie/${movieId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                const reviewedLog = logsForThisMovie.find((x) => x.review?.trim());
                if (reviewedLog) navigate(`/review/${reviewedLog._id}`);
                else navigate(`/movie/${movieId}`);
              } catch (err) {
                console.error("Failed to fetch logs for this movie", err);
                navigate(`/movie/${movieId}`);
              }
            };

            return (
              <div key={lg._id} onClick={handleClick} style={{ position: "relative", cursor: "pointer" }}>
                <img
                  src={posterUrl}
                  loading="lazy"
                  alt={lg.title || "Poster"}
                  style={{
                    width: "100%",
                    aspectRatio: "2/3",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                  onError={(e) => (e.currentTarget.src = FALLBACK_POSTER)}
                />

                {/* Rating + Review/Fav Icons */}
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
                  <StarRating rating={lg.rating} size={12} />
                  {hasReview && (
                    <FaRegComment
                      size={9}
                      style={{ position: "relative", top: "-1.5px" }}
                    />
                  )}
                  {favorite && (
                    <AiFillHeart
                      size={11}
                      color="#B327F6"
                      style={{ position: "relative", top: "-1.5px" }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
