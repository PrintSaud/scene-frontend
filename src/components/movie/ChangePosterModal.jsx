// src/components/movie/ChangePosterModal.jsx
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

  // ✅ FORCE LEFT
// grid wrapper
const gridWrapperStyle = {
  width: "100%",
  margin: "0",
  padding: "0",
};

// grid itself
const gridStyle = {
  display: "grid",
  gridAutoFlow: "row",
  gridGap: "0px",
  gridTemplateColumns: isPhone
    ? "repeat(auto-fill, minmax(100px, 1fr))"
    : "repeat(auto-fill, 120px)", // 🔥 smaller posters
  justifyContent: "start",
  alignItems: "start",
  marginLeft: "-8px",
  marginright: "-4px",
  padding: 0,
};


  

  const posterStyle = (selected) => ({
    width: "95%",
    maxWidth: "160px",
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
