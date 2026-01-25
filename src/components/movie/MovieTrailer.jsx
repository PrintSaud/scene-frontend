// src/components/movie/MovieTrailer.jsx
import React from "react";
import { backend } from "../../config";


export default function MovieTrailer({ trailerKey, setShowTrailer }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "20px",
      }}
      onClick={() => setShowTrailer(false)}
    >
      <button
        style={{
          position: "absolute",
          top: "20px",
          right: "50px",
          background: "#222",
          color: "#fff",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setShowTrailer(false);
        }}
      >
        ✕
      </button>

      <iframe
        width="100%"
        height="60%"
        src={`https://www.youtube.com/embed/${trailerKey}`}
        title="Trailer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          border: "none",
          borderRadius: "10px",
          maxWidth: "800px",
        }}
      />
    </div>
  );
}
