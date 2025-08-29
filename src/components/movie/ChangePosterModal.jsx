import React, { useState, useEffect, useRef } from "react";
import axios from "../../api/api";
import { changePoster } from "../../api/api";
import useTranslate from "../../utils/useTranslate"; 


export default function ChangePosterModal({ movieId, onClose }) {
  const [posters, setPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 640 : true
  );
  const scrollRef = useRef();
  const t = useTranslate();

  // Responsive breakpoint (no CSS, just JS)
  useEffect(() => {
    const onResize = () => setIsPhone(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const fetchPosters = async () => {
      if (movieId === "11020" || movieId === 11020) {
        setPosters([{ file_path: "/iAdsTUNjpHIREH4C4UNhkbVDWYi.jpg", vote_count: 999 }]);
        return;
      }
      try {
        const { data } = await axios.get(`/api/logs/proxy/tmdb/images/${movieId}`);
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
        posterUrl !== "https://image.tmdb.org/t/p/w500/iAdsTUNjpHIREH4C4UNhkbVDWYi.jpg"
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

  

  // Inline styles
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

  // Center the content block
  const contentStyle = {
    width: "min(100%, 1000px)",
    margin: "80px auto 0", // centered container
    paddingLeft: 8,
    paddingRight: 8,
  };

  const titleStyle = {
    color: "#fff",
    marginBottom: 8,
    textAlign: "left",
    fontSize: 18,
  };

  // Grid wrapper centers the whole grid
  const gridWrapperStyle = {
    display: "flex",
    justifyContent: "center", // center the grid block
    width: "100%",
  };

  // Grid: 3 columns on phones; auto-fill on wider screens; center items in cells
  const gridStyle = {
    display: "grid",
    gap: 12,
    padding: "10px 6px",
    right: "20px",
    left:"90px",
    justifyItems: "center", // center posters within cells
    gridTemplateColumns: isPhone
      ? "repeat(3, 1fr)"
      : "repeat(auto-fill, minmax(140px, 1fr))",
    maxWidth: isPhone ? "100%" : 900,
    width: "100%",
  };

  const posterStyle = (selected) => ({
    width: "100%",
    borderRadius: 8,
    cursor: "pointer",
    border: selected ? "3px solid #fff" : "2px solid transparent",
    transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
  });

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

        <div style={gridWrapperStyle}>
          <div style={gridStyle}>
            {posters.map((poster) => {
              const src = `https://image.tmdb.org/t/p/w500${poster.file_path}`;
              const isSelected = selectedPoster === poster.file_path;
              return (
                <img
                  key={poster.file_path}
                  src={src}
                  alt={t("poster.alt")}
                  style={posterStyle(isSelected)}
                  onClick={() => handlePosterClick(poster.file_path)}
                />
              );
            })}
          </div>
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
    </div>
  );
}
 



