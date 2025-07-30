import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import getPosterUrl from "../../utils/getPosterUrl";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

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
  const isOwner = user?._id === profileUserId;
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setIsLoading(true); // ✅ Only set loading here once
        const res = await api.get(
          `/api/users/${profileUserId}/watchlist?sort=${sortType}&order=${order}&genre=${selectedGenre}`
        );
        const visibleWatchlist = isOwner ? res.data : res.data.filter((movie) => !movie.isPrivate);
        setWatchList(visibleWatchlist);
  
        // Optional: Smooth fade for large watchlists
        if (visibleWatchlist.length > 100) {
          setTimeout(() => setIsLoading(false), 800); // Smooth delay
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch watchlist", err);
        setIsLoading(false);
      }
    };
  
    if (profileUserId) fetchWatchlist();
  }, [profileUserId, sortType, order, selectedGenre]);
  
  

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
            <option value="added">Recently Added</option>
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
            <option value="">All Genres</option>
            <option value="28">Action</option>
            <option value="35">Comedy</option>
            <option value="18">Drama</option>
            <option value="27">Horror</option>
            <option value="10749">Romance</option>
            <option value="16">Animation</option>
            <option value="80">Crime</option>
            <option value="53">Thriller</option>
          </select>
        </div>
      )}
  

      {watchList?.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "4px",
            padding: "0",
          }}
        >
          {watchList.map((movie) => {
            const image = getPosterUrl(movie.tmdbId || movie.id, movie.poster_path, movie.posterOverride);
 
            return (
              <img
                key={movie.id || movie.tmdbId || movie._id}
                src={image}
                alt={movie.title}
                style={{
                  width: "100%",
                  aspectRatio: "2/3",
                  objectFit: "cover",
                  borderRadius: "6px",
                  cursor: "pointer",
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
                  e.target.src = FALLBACK_POSTER;
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
