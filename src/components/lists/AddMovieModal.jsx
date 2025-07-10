import React, { useState, useEffect } from "react";
import axios from "axios";
import { BLOCKED_MOVIE_IDS } from "../../utils/blockedMovies";
import { backend } from "../../config";
import filterMovies, { isQueryBanned } from "../utils/filterMovies";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function AddMovieModal({ onClose, onSelect, existing }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim()) fetchResults(query);
      else setResults([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const fetchResults = async (term) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(term)}&include_adult=false&language=en-US`
      );
  
      let filtered = (data.results || []).filter(
        (movie) =>
          movie.poster_path &&
          !movie.adult &&
          movie.vote_count > 10 &&
          !BLOCKED_MOVIE_IDS.includes(movie.id)
      );
  
      if (filtered.length === 0 && !isNaN(term)) {
        // fallback: fetch by ID
        const res = await axios.get(
          `https://api.themoviedb.org/3/movie/${term}?api_key=${TMDB_KEY}&language=en-US`
        );
        const movie = res.data;
        if (
          movie &&
          movie.poster_path &&
          !movie.adult &&
          movie.vote_count > 10 &&
          !BLOCKED_MOVIE_IDS.includes(movie.id)
        ) {
          filtered = [movie];
        }
      }
  
      setResults(filtered);
    } catch (err) {
      console.error("TMDB search failed", err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleAdd = (movie) => {
    if (existing.some((m) => m.id === movie.id)) return;
    onSelect(movie);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        padding: "24px",
        paddingBottom: "100px",
        background: "rgba(0,0,0,0.95)",
        overflowY: "scroll",
      }}
    >
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center" }}>
        <button onClick={onClose} style={backBtn}>← Back</button>
        <input
          type="text"
          placeholder="Search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={input}
        />
      </div>

      {loading && <p style={{ color: "#aaa" }}>Loading...</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "12px",
        }}
      >
        {results.map((movie) => (
          <div
            key={movie.id}
            onClick={() => handleAdd(movie)}
            style={{
              background: "#1a1a1a",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              color: "white",
              border: existing.some((m) => m.id === movie.id)
                ? "2px solid #888"
                : "none",
            }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={movie.title}
              style={{ width: "100%", height: "250px", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src = "/default-poster.jpg";
              }}
            />
            <div style={{ padding: "6px", fontSize: "12px", fontWeight: "bold", textAlign: "center" }}>
              {movie.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const input = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#111",
  color: "white",
  fontSize: "14px",
  marginLeft: "12px",
};

const backBtn = {
  background: "none",
  color: "#fff",
  fontSize: "16px",
  border: "none",
  cursor: "pointer",
};
