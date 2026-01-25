import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import filterMovies from "../../utils/filterMovies";
import useTranslate from "../../utils/useTranslate";
import { useLanguage } from "../../context/LanguageContext";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function AddMovieModal({ onClose, onSelect, existing }) {
  const t = useTranslate();
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // TMDB accepts locales like "en-US" / "ar-SA"
  const tmdbLang = useMemo(() => (language === "ar" ? "ar-SA" : "en-US"), [language]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim()) fetchResults(query.trim());
      else setResults([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [query, tmdbLang]);

  const fetchResults = async (term) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
          term
        )}&include_adult=false&language=${tmdbLang}`
      );

      let filtered = filterMovies(data.results || []);

      // If no hits and term is numeric, try direct movie lookup
      if (filtered.length === 0 && /^\d+$/.test(term)) {
        try {
          const res = await axios.get(
            `https://api.themoviedb.org/3/movie/${term}?api_key=${TMDB_KEY}&language=${tmdbLang}`
          );
          const movie = res.data;
          const single = filterMovies([movie]);
          if (single.length > 0) filtered = single;
        } catch {
          // ignore
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
      role="dialog"
      aria-modal="true"
      aria-label={t("Add Movie")}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        padding: "24px",
        paddingBottom: "100px",
        background: "rgba(0,0,0,0.95)",
        overflowY: "scroll",
      }}
    >
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center" }}>
        <button onClick={onClose} style={backBtn} aria-label={t("Back")}>
          ← {t("Back")}
        </button>
        <input
          type="text"
          placeholder={t("Search movies...")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={input}
          aria-label={t("Search movies...")}
        />
      </div>

      {loading && <p style={{ color: "#aaa" }}>{t("Loading...")}</p>}
      {!loading && query.trim() && results.length === 0 && (
        <p style={{ color: "#aaa" }}>{t("No results found.")}</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "12px",
        }}
      >
        {results.map((movie) => {
          const already = existing.some((m) => m.id === movie.id);
          return (
            <div
              key={movie.id}
              onClick={() => handleAdd(movie)}
              style={{
                background: "#1a1a1a",
                borderRadius: "8px",
                overflow: "hidden",
                cursor: already ? "not-allowed" : "pointer",
                color: "white",
                border: already ? "2px solid #888" : "none",
                position: "relative",
                opacity: already ? 0.75 : 1,
              }}
              aria-disabled={already}
              title={already ? t("Already added") : movie.title}
            >
              <img
                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                alt={movie.title}
                style={{ width: "100%", height: "250px", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.src = "/default-poster.jpg";
                }}
              />
              {already && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "rgba(0,0,0,0.7)",
                    padding: "2px 6px",
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                >
                  {t("Added")}
                </div>
              )}
              <div
                style={{
                  padding: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {movie.title}
              </div>
            </div>
          );
        })}
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
