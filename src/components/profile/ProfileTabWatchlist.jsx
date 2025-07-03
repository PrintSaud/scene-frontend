import { useEffect } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";


export default function ProfileTabWatchlist({
  user,
  sortType,
  setSortType,
  order,
  setOrder,
  watchList,
  setWatchList,
  profileUserId
}) {
  const navigate = useNavigate();
  const isOwner = user?._id === profileUserId;

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await api.get(
            `/api/users/${profileUserId}/watchlist?sort=${sortType}&order=${order}`
          );
          
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
      {watchList?.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {watchList.map((movie) => (
            <img
              key={movie._id || movie.id}
              src={movie.poster || "https://image.tmdb.org/t/p/w500/default.jpg"}
              alt={movie.title}
              style={{ width: "100%", borderRadius: "12px", cursor: "pointer" }}
              onClick={() => navigate(`/movie/${movie.tmdbId || movie.id}`)}
            />
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", marginTop: "40px", color: "#aaa" }}>
          This watchlist is empty.
        </p>
      )}
    </div>
  );
}
