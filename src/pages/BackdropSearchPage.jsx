import React, { useState, useEffect, useRef } from "react";
import axios from "../api/api";
import filterMovies from "../utils/filterMovies";
import { useNavigate } from "react-router-dom";
import { backend } from "../config";

export default function BackdropPickerPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [backdrops, setBackdrops] = useState([]);
  const [selectedBackdrop, setSelectedBackdrop] = useState(null);
  const [loading, setLoading] = useState(false);


  const navigate = useNavigate();
  const doneRef = useRef(null); // 👇 anchor for scroll

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
      const filtered = filterMovies(res.data.results || []);
      const hasBackdrop = filtered.filter((movie) => movie.backdrop_path);
      setResults(hasBackdrop);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const fetchBackdrops = async (movie) => {
    setSelectedMovie(movie);
    setLoading(true);
    try {
      const res = await axios.get(`${backend}/api/movies/${movie.id}`);
      const allBackdrops = res.data.backdrops || [];
      const urls = allBackdrops.map((b) => `https://image.tmdb.org/t/p/original${b}`);
      setBackdrops(urls);
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
    // ⏬ scroll to "Done" button
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
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "10-px", height: "9-px", }}>
          Change Backdrop
        </h1>
        <button
    onClick={() => navigate(-1)}
    style={{
      background: "rgba(0,0,0,0.5)",
      border: "none",
      borderRadius: "50%",
      width: "32px",
      height: "42px",
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
      </div>

      {/* Search */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie"
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

      {/* Movie Grid */}
      {!selectedMovie && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
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
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                style={{
                  width: "100%",
                  objectFit: "cover",
                  aspectRatio: "2 / 3",
                }}
              />
              <p style={{ fontSize: "13px", textAlign: "center", padding: "6px" }}>
                {movie.title}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Backdrop Previews */}
      {selectedMovie && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          {loading ? (
            <p style={{ color: "#888" }}>Loading backdrops...</p>
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

          {/* ✅ Done Button Anchor */}
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
                ✅ Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
