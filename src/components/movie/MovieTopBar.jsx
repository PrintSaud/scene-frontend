// src/components/movie/MovieTopBar.jsx
import React from "react";
import { toast } from "react-hot-toast";
import { toggleWatchlist } from "../../api/api";
import { backend } from "../../config";



export default function MovieTopBar({
  navigate,
  movie,
  isInWatchlist,
  setIsInWatchlist,
  setShowPosterModal,
  setShowAddToListModal,
}) {
  const TMDB_IMG = "https://image.tmdb.org/t/p/original";

  const handleToggleWatchlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return toast.error("Not logged in");

      await toggleWatchlist(movie.id);


      setIsInWatchlist(!isInWatchlist);
      toast.success(
        isInWatchlist ? "Removed from Watchlist" : "Added to Watchlist"
      );
    } catch (err) {
      console.error("Watchlist error:", err);
      toast.error("Failed to update watchlist");
    }
  };

  const [showOptions, setShowOptions] = React.useState(false);

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
      {/* 🔙 Back */}
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

      {/* ⋯ Options */}
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
              width: "180px",
            }}
          >
            {[
              {
                label: "🖼 Change Poster",
                onClick: () => setShowPosterModal(true),
              },
              {
                label: isInWatchlist ? "✅ In Watchlist" : "➕ Add to Watchlist",
                onClick: handleToggleWatchlist,
              },
              {
                label: "🎞 Add to List",
                onClick: () =>
                  setShowAddToListModal(true), // handled by parent modal logic
              },
              {
                label: "📤 Share to a Friend",
                onClick: () => navigate(`/share/${movie.id}`),
              },
            ].map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  item.onClick();
                  setShowOptions(false);
                }}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "14.5px",
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
