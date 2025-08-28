import React, { useEffect, useState } from "react";
import filterMovies from "../../utils/filterMovies";
import { backend } from "../../config";

export default function SimilarFilmsTab({ movieId, navigate }) {
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${apiKey}&language=en-US`
        );
        const data = await res.json();

        if (!Array.isArray(data.results)) {
          setSimilarMovies([]);
        } else {
          const filtered = filterMovies(data.results);
          setSimilarMovies(filtered);
        }
      } catch (err) {
        console.error("❌ Failed to fetch similar films:", err);
        setSimilarMovies([]);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      setLoading(true);
      fetchSimilar();
    }
  }, [movieId]);

  return (
    <div style={{ padding: "20px 20px 40px", minHeight: "100vh" }}>
      {loading ? (
        <p style={{ color: "#888", textAlign: "center" }}>
          Loading similar films...
        </p>
      ) : similarMovies.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center" }}>
          No similar films found.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", // ✅ responsive grid
            gap: "16px",
            justifyItems: "center",
          }}
        >
          {similarMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => {
                navigate(`/movie/${movie.id}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                cursor: "pointer",
                textAlign: "center",
                maxWidth: "180px", // ✅ keeps cards uniform
              }}
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                    : "/default-poster.png"
                }
                alt={movie.title}
                style={{
                  width: "100%",
                  aspectRatio: "2 / 3", // ✅ consistent ratio
                  objectFit: "cover",
                  borderRadius: "10px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                }}
              />
              <p
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  fontFamily: "Inter",
                  color: "#fff",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {movie.title}
              </p>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
}
