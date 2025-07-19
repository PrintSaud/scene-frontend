import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { toggleWatchlist } from "../../api/api";
import axios from "axios";
import { backend } from "../../config";

export default function MovieTopBar({
  navigate,
  movie,
  isInWatchlist,
  setIsInWatchlist,
  setShowPosterModal,
  setShowAddToListModal,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [myLog, setMyLog] = useState(null);

  useEffect(() => {
    const fetchMyLog = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        const res = await axios.get(`${backend}/api/logs/user/${user._id}`);
        const log = res.data.find((l) => String(l.movie.id) === String(movie.id));
        setMyLog(log || null);
      } catch (err) {
        console.error("Failed to fetch user logs:", err);
      }
    };
    fetchMyLog();
  }, [movie.id]);

  const handleToggleWatchlist = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
      if (!token) return toast.error("Not logged in");

      const movieId = Number(movie.id || movie._id);
      await toggleWatchlist(movieId);

      setIsInWatchlist(!isInWatchlist);
      toast.success(
        isInWatchlist ? "Removed from Watchlist" : "Added to Watchlist"
      );
    } catch (err) {
      console.error("❌ Watchlist error:", err.response?.data || err.message);
      toast.error("Failed to update watchlist");
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
      if (!token) return toast.error("Not logged in");

      const movieId = Number(movie.id || movie._id);

      if (isFavorite) {
        await axios.delete(`${backend}/api/users/${user._id}/favorites/${movieId}`);
        toast.success("❌ Removed from Favorites");
      } else {
        await axios.post(`${backend}/api/users/${user._id}/favorites/${movieId}`);
        toast.success("❤️ Added to Favorites");
      }

      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("❌ Favorite error:", err.response?.data || err.message);
      toast.error("Failed to update favorites");
    }
  };

  const handleDeleteLog = async () => {
    if (!myLog) return;
    if (window.confirm("Are you sure you want to delete your log for this film?")) {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;
  
        await axios.delete(`${backend}/api/logs/${myLog._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        toast.success("✅ Log deleted successfully!");
        setMyLog(null);
      } catch (err) {
        console.error("❌ Delete log error:", err);
        toast.error("Failed to delete log");
      }
    }
  };
  

  return (
    <div
      style={{
        position: "absolute",
        top: "16px",
        left: "16px",
        right: "16px",
        zIndex: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ←
      </button>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowOptions((prev) => !prev)}
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: "#fff",
            fontSize: "22px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⋯
        </button>

        {showOptions && (
          <div
            style={{
              position: "absolute",
              top: "38px",
              right: "0",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              padding: "12px 0",
              width: "200px",
            }}
          >
            {[
              {
                label: "🖼 Change Poster",
                onClick: () => setShowPosterModal(true),
              },
              {
                label: isInWatchlist ? "❌ Remove From Watchlist" : "➕ Add to Watchlist",
                onClick: handleToggleWatchlist,
              },
              {
                label: "❤️ " + (isFavorite ? "Remove From Favorites" : "Add to Favorites"),
                onClick: handleToggleFavorite,
              },
              {
                label: "🎞 Add to List",
                onClick: () => setShowAddToListModal(true),
              },
              {
                label: "📤 Share to a Friend",
                onClick: () => navigate(`/share/movie/${movie.id}`),
              },
              myLog && {
                label: "🗑️ Delete Log",
                onClick: handleDeleteLog,
              }
            ].filter(Boolean).map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  item.onClick();
                  setShowOptions(false);
                }}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "12.5px",
                  fontWeight: "500",
                  color: "#fff",
                  fontFamily: "Inter",
                  transition: "0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#2a2a2a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
