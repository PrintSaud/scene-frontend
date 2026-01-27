import React, { useState, useEffect, useRef } from "react";
import axios from "../api/api";
import { useNavigate } from "react-router-dom";
import { backend } from "../config";
import useTranslate from "../utils/useTranslate";
import filterMovies from "../utils/filterMovies"; // ✅ make sure it's imported




export default function BackdropPickerPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [backdrops, setBackdrops] = useState([]);
  const [selectedBackdrop, setSelectedBackdrop] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const doneRef = useRef(null);
  const t = useTranslate();

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim()) fetchMovies(query);
      else setResults([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const fetchMovies = async (q) => {
    try {
      const res = await axios.get(`${backend}/api/movies/search?q=${q}`);
      const movies = res.data.results || [];
  
      // 🔑 Normalize structure to satisfy filterMovies
      const normalized = movies.map((m) => ({
        ...m,
        poster_path: m.poster_path || (m.poster ? m.poster.replace("https://image.tmdb.org/t/p/w500", "") : null),
        backdrop_path: m.backdrop_path || null,
        title: m.title_en || m.title,
        overview: m.overview || "",
      }));
  
      // ✅ Apply your filtering logic
      const filtered = filterMovies(normalized);
  
      console.log(
        "✅ Showing movies:",
        filtered.map((m) => `${m.title} (${m.id})`)
      );
  
      setResults(filtered);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };
  

  const fetchBackdrops = async (movie) => {
    setSelectedMovie(movie);
    setLoading(true);
    try {
      const res = await axios.get(`${backend}/api/movies/${movie.id}`);
      // Backend already returns full URLs ✅
      setBackdrops(res.data.backdrops || []);
    } catch (err) {
      console.error("Backdrop fetch failed:", err);
      setBackdrops([]);
    }
    setLoading(false);
  };
  

  const handleSave = () => {
    if (!selectedMovie || !selectedBackdrop) return;
    localStorage.setItem(
      "chosenBackdrop",
      JSON.stringify({
        movieId: selectedMovie.id,
        backdrop: selectedBackdrop,
      })
    );
    navigate("/edit-profile");
  };

  const handleBackdropSelect = (url) => {
    setSelectedBackdrop(url);
    setTimeout(() => {
      doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <div
      style={{
        background: "#0e0e0e",
        color: "#fff",
        minHeight: "100vh",
        padding: "24px",
        paddingBottom: "140px",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Back button */}
      <button
        onClick={() => {
          if (selectedMovie) {
            setSelectedMovie(null);
            setBackdrops([]);
            setSelectedBackdrop(null);
          } else {
            navigate(-1);
          }
        }}
        style={{
          position: "absolute",
          top: "30px",
          left: "20px",
          background: "rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
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

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", marginTop: "10px" }}>
          {t("Change Backdrop")}
        </h1>
      </div>

      {/* Search */}
      {!selectedMovie && (
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search for a movie")}
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "#1a1a1a",
              color: "#fff",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #333",
              fontSize: "14px",
            }}
          />
        </div>
      )}

{/* Movie Grid */}
{!selectedMovie && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
      gap: "16px",
    }}
  >
    {results.map((movie) => (
      <div
        key={movie.id}
        onClick={() => fetchBackdrops(movie)}
        style={{
          cursor: "pointer",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #333",
        }}
      >
        <img
          src={
            movie.poster
              ? movie.poster
              : movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : movie.backdrop_path
              ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
              : "/default-poster.jpg"
          }
          alt={movie.title_en || movie.title}
          style={{
            width: "100%",
            objectFit: "cover",
            aspectRatio: "2 / 3",
          }}
          onError={(e) => (e.currentTarget.src = "/default-poster.jpg")}
        />
        <p
          style={{
            fontSize: "13px",
            textAlign: "center",
            padding: "6px",
          }}
        >
          {movie.title_en || movie.title}
        </p>
      </div>
    ))}
  </div>
)}


      {/* Backdrop Previews */}
      {selectedMovie && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          {loading ? (
            <p style={{ color: "#888" }}>{t("Loading backdrops...")}</p>
          ) : (
            backdrops.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Backdrop ${idx}`}
                onClick={() => handleBackdropSelect(url)}
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  cursor: "pointer",
                  border:
                    selectedBackdrop === url
                      ? "3px solid white"
                      : "1px solid #333",
                  transition: "border 0.2s ease",
                }}
              />
            ))
          )}

          <div ref={doneRef}>
            {selectedBackdrop && (
              <button
                onClick={handleSave}
                style={{
                  background: "#fff",
                  color: "#000",
                  padding: "10px 20px",
                  fontWeight: "bold",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginTop: "16px",
                }}
              >
                ✅ {t("Done")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
