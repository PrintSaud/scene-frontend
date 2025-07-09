import { useEffect } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { backend } from "../../config";

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
  const isOwner = user?._id === profileUserId;
  const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await api.get(
          `/api/users/${profileUserId}/watchlist?sort=${sortType}&order=${order}`
        );
        console.log("🔔 FINAL RESPONSE:", res.data);


        const filtered = isOwner
          ? res.data
          : res.data.filter((movie) => !movie.isPrivate);

        setWatchList(filtered);
      } catch (err) {
        console.error("Failed to fetch watchlist", err);
      }
    };

    if (profileUserId) fetchWatchlist();
  }, [profileUserId, sortType, order]);

  return (
    <div style={{ padding: "16px" }}>
      {/* 📊 Filters (centered) */}
      {isOwner && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
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
            <option value="title">Title</option>
            <option value="release">Release Date</option>
            <option value="rating">Rating</option>
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
      )}

      {/* 🎬 Watchlist Grid */}
      {watchList?.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {watchList.map((movie) => {
            // 🔧 Safe fallback for poster
            console.log("👀 MOVIE OBJECT:", movie);
            let image = "/default-poster.jpg";

            if (movie.poster_path) {
              image = `${TMDB_IMG}${movie.poster_path}`;
            } else if (movie.poster && typeof movie.poster === "string") {
              if (movie.poster.startsWith("http")) {
                image = movie.poster;
              } else {
                image = `${TMDB_IMG}${movie.poster}`;
              }
            }

            return (
              <img
                key={movie.id || movie.tmdbId || movie._id}
                src={image}
                alt={movie.title}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  cursor: "pointer",
                  objectFit: "cover",
                }}
                onClick={() => {
                  const rawId = movie.tmdbId || movie.id;
                  const cleanedId = String(rawId).replace(/[^\d]/g, "");
                  const tmdbId = Number(cleanedId);

                  if (!tmdbId || isNaN(tmdbId)) {
                    console.warn("❌ Invalid TMDB ID:", movie);
                    toast.error("This movie has no valid TMDB ID.");
                    return;
                  }

                  navigate(`/movie/${tmdbId}`);
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-poster.jpg";
                }}
              />
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", marginTop: "40px", color: "#aaa" }}>
          This watchlist is empty.
        </p>
      )}
    </div>
  );
}
