// src/components/movie/ChangePosterModal.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "../../api/api";
import { changePoster } from "../../api/api";
import useTranslate from "../../utils/useTranslate";

export default function ChangePosterModal({ movieId, onClose }) {
  const [posters, setPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();
  const t = useTranslate();

  useEffect(() => {
    const fetchPosters = async () => {
      if (movieId === "11020" || movieId === 11020) {
        setPosters([
          { file_path: "/iAdsTUNjpHIREH4C4UNhkbVDWYi.jpg", vote_count: 999 },
        ]);
        return;
      }
      try {
        const { data } = await axios.get(
          `/api/logs/proxy/tmdb/images/${movieId}`
        );
        const sorted = (data.posters || []).sort(
          (a, b) => (b.vote_count || 0) - (a.vote_count || 0)
        );
        setPosters(sorted);
      } catch (err) {
        console.error("Failed to fetch posters", err);
      }
    };
    fetchPosters();
  }, [movieId]);

  const handleSave = async () => {
    if (!selectedPoster) return;
    try {
      setLoading(true);
      const posterUrl = `https://image.tmdb.org/t/p/w500${selectedPoster}`;

      if (
        movieId === "11020" &&
        posterUrl !==
          "https://image.tmdb.org/t/p/w500/iAdsTUNjpHIREH4C4UNhkbVDWYi.jpg"
      ) {
        alert(t("poster.approved_only"));
        setLoading(false);
        return;
      }

      await changePoster(movieId, { posterUrl });
      onClose();
    } catch (err) {
      console.error("Failed to update poster", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePosterClick = (path) => {
    setSelectedPoster(path);
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Styles
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.85)",
    zIndex: 9999,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    padding: "24px 16px 100px",
  };

  const closeBtnStyle = {
    position: "fixed",
    top: "20px",
    left: "20px",
    background: "rgba(0,0,0,0.5)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const contentStyle = {
    width: "min(100%, 1000px)",
    margin: "80px auto 0",
    padding: 0,
  };

  const titleStyle = {
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 18,
  };

  const actionsStyle = {
    marginTop: 48,
    paddingBottom: 120,
    textAlign: "center",
  };

  const confirmBtnStyle = (enabled) => ({
    padding: "10px 20px",
    background: enabled ? "#fff" : "#444",
    color: enabled ? "#000" : "#999",
    fontWeight: 600,
    borderRadius: 8,
    border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    minWidth: 160,
  });

  return (
    <div style={overlayStyle} onClick={onClose}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={closeBtnStyle}
        aria-label={t("poster.close")}
        title={t("poster.close")}
      >
        ←
      </button>

      <div onClick={(e) => e.stopPropagation()} style={contentStyle}>
        <h3 style={titleStyle}>🖼 {t("poster.choose_new")}</h3>

        <div
  className="poster-grid"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: "6px",
    justifyContent: "start",     // align grid to start
    justifyItems: "start",       // align posters left
    width: "100%",               // container spans
    margin: "0 !important",      // 🔥 force kill any margins
    padding: "0 !important",     // 🔥 force kill padding
    boxSizing: "border-box",
    transform: "translateX(-8px)", // ⬅️ manual nudge left
  }}
>
  {posters.map((poster) => {
    const src = `https://image.tmdb.org/t/p/w500${poster.file_path}`;
    const isSelected = selectedPoster === poster.file_path;
    return (
      <img
        key={poster.file_path}
        src={src}
        alt={t("poster.alt")}
        style={{
          width: "100%",
          maxWidth: "130px",
          borderRadius: 6,
          cursor: "pointer",
          border: isSelected ? "3px solid #fff" : "2px solid transparent",
        }}
        onClick={() => handlePosterClick(poster.file_path)}
      />
    );
  })}
</div>





        <div ref={scrollRef} style={actionsStyle}>
          <button
            onClick={handleSave}
            disabled={!selectedPoster || loading}
            style={confirmBtnStyle(!!selectedPoster && !loading)}
          >
            {loading ? t("poster.saving") : t("poster.confirm")}
          </button>
        </div>
      </div>

      {/* ✅ Responsive media query (always 3 on small screens) */}
      <style>
        {`
          @media (max-width: 480px) {
            .poster-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
        `}
      </style>
    </div>
  );
}
