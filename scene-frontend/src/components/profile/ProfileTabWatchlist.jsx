// src/components/profile/ProfileTabWatchlist.jsx
import { useEffect, useState } from "react";
import api, { getCustomPostersBatch } from "../../api/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useTranslate from "../../utils/useTranslate";
import getPosterUrl from "../../utils/getPosterUrl";

const FALLBACK_POSTER = "/default-poster.jpg";

// Normalize ID like Films tab
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

// ✅ Poster with shimmer loader
function Poster({ tmdbId, posters, movie, navigate, t }) {
  const [loaded, setLoaded] = useState(false);
  const posterUrl = getPosterUrl(tmdbId, posters, movie) || FALLBACK_POSTER;

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
      onClick={() => {
        if (!tmdbId) {
          toast.error(t("This movie has no valid TMDB ID."));
          return;
        }
        navigate(`/movie/${tmdbId}`);
      }}
    >
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
        src={posterUrl}
        alt="Movie"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
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

export default function ProfileTabWatchlist({
  user,
  sortType,
  setSortType,
  order,
  setOrder,
  watchList,
  setWatchList,
  profileUserId,
}) {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [posters, setPosters] = useState({});
  const t = useTranslate();

  const isOwner = user?._id === profileUserId;

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(
          `/api/users/${profileUserId}/watchlist?sort=${sortType}&order=${order}&genre=${selectedGenre}`
        );

        const visible = isOwner
          ? res.data
          : res.data.filter((m) => !m.isPrivate);

        setWatchList(visible);

        // ✅ preload first 30 ids and batch fetch posters
        const ids = visible.slice(0, 30).map(toTmdbIdAny).filter(Boolean);
if (ids.length) {
  try {
    const batch = await getCustomPostersBatch(profileUserId, ids); // ✅ pass userId
    setPosters(batch || {});
  } catch (err) {
    console.error("❌ Batch posters failed", err);
  }
}

      } catch (err) {
        console.error("❌ Failed to fetch watchlist", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (profileUserId) fetchWatchlist();
  }, [profileUserId, sortType, order, selectedGenre]);

  return (
    <div style={{ padding: "0" }}>
      {isOwner && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "12px",
            padding: "4px 8px",
          }}
        >
          {/* Sorting Controls */}
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "12px",
              minWidth: "130px",
            }}
          >
            <option value="added">{t("Recently Added")}</option>
            <option value="release">{t("Release Date")}</option>
            <option value="rating">{t("Rating")}</option>
            <option value="runtime">{t("Runtime")}</option>
          </select>

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "12px",
              minWidth: "20px",
            }}
          >
            <option value="desc">⬇</option>
            <option value="asc">⬆</option>
          </select>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "12px",
              minWidth: "130px",
            }}
          >
            <option value="">{t("All Genres")}</option>
            <option value="28">{t("Action")}</option>
            <option value="35">{t("Comedy")}</option>
            <option value="18">{t("Drama")}</option>
            <option value="27">{t("Horror")}</option>
            <option value="10749">{t("Romance")}</option>
            <option value="16">{t("Animation")}</option>
            <option value="80">{t("Crime")}</option>
            <option value="53">{t("Thriller")}</option>
          </select>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <p style={{ textAlign: "center", marginTop: "40px", color: "#aaa" }}>
          🎞️ {t("Loading your Scenes...")}
        </p>
      ) : watchList?.length > 0 ? (
        <div
          className="watchlist-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: "6px",
            padding: "0",
          }}
        >
          {watchList.map((movie) => {
            const tmdbId = toTmdbIdAny(movie);

            return (
              <Poster
  key={tmdbId || movie._id}
  tmdbId={tmdbId}
  posters={posters}
  movie={movie} // 👈 now movie.poster_path works too
  navigate={navigate}
  t={t}
/>

            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", marginTop: "40px", color: "#aaa" }}>
          {t("This watchlist is empty.")}
        </p>
      )}

      {/* Responsive */}
      <style>
        {`
          @media (max-width: 480px) {
            .watchlist-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
        `}
      </style>
    </div>
  );
}
