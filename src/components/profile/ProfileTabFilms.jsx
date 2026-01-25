// src/components/profile/ProfileTabFilms.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "../StarRating";
import { AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import axios from "../../api/api";
import useTranslate from "../../utils/useTranslate";
import getPosterUrl from "../../utils/getPosterUrl";

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

// ✅ Poster with shimmer that ALWAYS resolves
function Poster({ src, alt, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const showSrc = !error && src ? src : FALLBACK_POSTER;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2/3",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      {/* Purple shimmer until load/error */}
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "6px",
            background:
              "linear-gradient(90deg, #3a0d60 25%, #B327F6 50%, #3a0d60 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.2s infinite",
          }}
        />
      )}

      <img
        src={showSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "6px",
          display: "block",
        }}
      />

      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
}

export default function ProfileTabFilms({
  logs = [],
  favorites = [],
  profileUserId,
  customPosters = {},
}) {
  const t = useTranslate();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");
  const [customPostersState, setCustomPostersState] = useState({});
  const [lsFavorites, setLsFavorites] = useState([]);

  // Favorites from LS
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

  // Simulated loading
  useEffect(() => {
    if ((logs?.length || 0) > 100) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(t);
    }
    setIsLoading(false);
  }, [logs]);

  // Custom posters fetch
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

  // Sorting
  const sortedLogs = useMemo(() => {
    const base = Array.isArray(logs) ? [...logs] : [];
    if (sortType === "favorites") {
      return base.filter((lg) => {
        const id = toTmdbIdAny(lg);
        return id && isFav(id);
      });
    }
    base.sort((a, b) => {
      let valA = 0,
        valB = 0;
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
        className="films-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          gap: "6px",
          padding: "0",
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "2/3",
              borderRadius: "6px",
              overflow: "hidden",
              background:
                "linear-gradient(90deg, #3a0d60 25%, #B327F6 50%, #3a0d60 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.2s infinite",
            }}
          />
        ))}
  
        <style>
          {`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
  
            @media (max-width: 480px) {
              .films-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
            }
          `}
        </style>
      </div>
    );
  }
  

  return (
    <>
      {/* Controls */}
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
          <option value="added">{t("Recently Added")}</option>
          <option value="rating">{t("Rating")}</option>
          <option value="release">{t("Release Date")}</option>
          <option value="runtime">{t("Runtime")}</option>
          <option value="favorites">{t("Favorites")}</option>
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
          <option value="desc">⬇ {t("Descending")}</option>
          <option value="asc">⬆ {t("Ascending")}</option>
        </select>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: "6px",
        }}
      >
        {sortedLogs.map((lg) => {
          const movieId = toTmdbIdAny(lg);

          const posterUrl = getPosterUrl({
            tmdbId: lg.tmdbId || lg.movie?.tmdbId,
            posterPath: lg.poster_path || lg.movie?.poster_path,
            override:
              customPostersState[movieId] ||
              lg.posterOverride ||
              lg.movie?.posterOverride,
          });

          const favorite = isFav(movieId);
          const hasReview = !!(lg.review && lg.review.trim().length > 0);

          return (
            <div key={lg._id} style={{ position: "relative" }}>
              <Poster
                src={posterUrl}
                alt={lg.title || t("Poster")}
                onClick={() => navigate(`/movie/${movieId}`)}
              />

              {/* Rating + Icons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 4px 0 4px",
                  fontSize: "10px",
                  color: "#aaa",
                  fontFamily: "Inter",
                }}
              >
                <StarRating rating={lg.rating} size={12} />
                {hasReview && <FaRegComment size={9} />}
                {favorite && <AiFillHeart size={11} color="#B327F6" />}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
