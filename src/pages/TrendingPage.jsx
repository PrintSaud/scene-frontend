import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function TrendingPage() {
  const [movies, setMovies] = useState([]);
  const backend = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await axios.get(`${backend}/api/movies/trending`);
        setMovies(data);
      } catch (err) {
        console.error("Error fetching trending movies:", err);
      }
    };

    fetchTrending();
  }, []);


  return (
    <div style={{ padding: "20px", color: "#fff", position: "relative" }}>
      {/* 🔙 Back to Home */}
      <button
        onClick={() => navigate("/home")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "transparent",
          border: "1px solid #fff",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ← Home
      </button>

      <h1 style={{ textAlign: "center", fontSize: "16px", marginBottom: "30px" }}>
        🔥 Trending Films This Week
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "10px",
          justifyItems: "center",
        }}
      >
        {Array.isArray(movies) && movies.length > 0 ? (
          movies.map((movie) => (
            <div
              key={movie.id}
              style={{ cursor: "pointer", width: "100%", maxWidth: "140px" }}
              onClick={() => navigate(`/movie/${movie.id}`)}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "2 / 3",
                  overflow: "hidden",
                  borderRadius: "12px",
                  boxShadow: "0 6px 12px rgba(0, 0, 0, 0.3)",
                }}
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: "14px",
                  textAlign: "center",
                  marginTop: "8px",
                  lineHeight: "1.2em",
                  maxHeight: "2.4em",
                  overflow: "hidden",
                }}
              >
                {movie.title}
              </p>
            </div>
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center" }}>
            No trending movies available.
          </p>
        )}
      </div>
    </div>
  );
}
