import React from "react";

export default function SearchFilterModal({ isOpen, onClose, onApply, genre, year, setGenre, setYear }) {
  if (!isOpen) return null;

  const genres = ["Action", "Drama", "Comedy", "Thriller", "Romance", "Sci-Fi", "Horror"];

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#111",
          padding: "20px",
          borderRadius: "12px",
          width: "85%",
          maxWidth: "400px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>Filters</h2>

        {/* Genre */}
        <label style={{ display: "block", marginBottom: "8px" }}>Genre</label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            background: "#222",
            color: "#fff",
            border: "1px solid #333",
            marginBottom: "16px",
          }}
        >
          <option value="">All</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Year */}
        <label style={{ display: "block", marginBottom: "8px" }}>Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="e.g. 2022"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            background: "#222",
            color: "#fff",
            border: "1px solid #333",
            marginBottom: "20px",
          }}
        />

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={onClose}
            style={{
              background: "#444",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            style={{
              background: "#4d4be3",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
