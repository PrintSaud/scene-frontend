import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function ChangePosterModal({ movieId, onClose }) {
  const [posters, setPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const backend = import.meta.env.VITE_BACKEND;

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const { data } = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${TMDB_KEY}&include_image_language=en,null`
        );
        setPosters(data.posters || []);
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
      const token = localStorage.getItem("token");
      await axios.post(
        `${backend}/api/posters/${movieId}`,
        { posterUrl: `https://image.tmdb.org/t/p/w500${selectedPoster}` },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
    background: "rgba(0,0,0,0.8)",
    zIndex: 9999,
    overflow: "auto", // ✅ THIS FIXES ALL SCROLL
    WebkitOverflowScrolling: "touch", // ✅ smooth iOS scrolling
  }}
  onClick={onClose}
>

          <div
    style={{
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "24px",
      width: "100%",
      maxWidth: "800px",
    }}
    onClick={(e) => e.stopPropagation()}
  ></div>

<button
  onClick={() => navigate(-1)}
  style={{
    position: "absolute",
    top: "20px",
    left: "20px", // 👈 pushes it fully to the left
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
    justifyContent: "center", // center the arrow inside
  }}
>
  ←
</button>

      <div
        style={{ maxWidth: "800px", width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
<h3
  style={{
    color: "#fff",
    marginBottom: "20px",
    textAlign: "center", // ✅ fixed casing
    fontSize: "18px",
 // ✅ slight shift to left
  }}
>
  🖼 Choose a New Poster
</h3>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    paddingLeft: "8px",   // ✅ nudged more left
    paddingRight: "12px",  // ✅ tighter on right
    boxSizing: "border-box",
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
    marginTop: "24px",
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
