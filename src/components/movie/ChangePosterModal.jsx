import React, { useState, useEffect, useRef } from "react";
import axios from "../../api/api"; // ✅
import { backend } from "../../config";
import { changePoster } from "../../api/api";





export default function ChangePosterModal({ movieId, onClose }) {
  const [posters, setPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const { data } = await axios.get(
            `${backend}/api/logs/proxy/tmdb/images/${movieId}`
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
      await changePoster(movieId, {
        posterUrl: `https://image.tmdb.org/t/p/w500${selectedPoster}`,
      });
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

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "24px 16px 100px",
      }}
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
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
        }}
      >
        ←
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", margin: "80px auto 0" }}
      >
        <h3
          style={{
            color: "#fff",
            marginBottom: "5px",
            textAlign: "center",
            fontSize: "18px",
          }}
        >
          🖼 Choose a New Poster
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            width: "350px",
            padding: "10px 6px",
          }}
        >
          {posters.map((poster) => (
            <img
              key={poster.file_path}
              src={`https://image.tmdb.org/t/p/w500${poster.file_path}`}
              onClick={() => handlePosterClick(poster.file_path)}
              style={{
                width: "100%",
                borderRadius: "8px",
                cursor: "pointer",
                border:
                  selectedPoster === poster.file_path
                    ? "3px solid #fff"
                    : "2px solid transparent",
              }}
            />
          ))}
        </div>

      
        <div
        ref={scrollRef}
        style={{
          marginTop: "48px",
          paddingBottom: "80px", // ✅ Extra scrollable room
          textAlign: "center",
        }}
      >
          <button
            onClick={handleSave}
            disabled={!selectedPoster || loading}
            style={{
              padding: "10px 20px",
              background: selectedPoster ? "#fff" : "#444",
              color: selectedPoster ? "#000" : "#999",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              cursor: selectedPoster ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Saving..." : "✅ Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
