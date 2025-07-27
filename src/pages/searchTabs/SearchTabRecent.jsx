import React from "react";

export default function SearchTabRecent({ recentSearches, onSearch }) {
  if (recentSearches.length === 0) return null;

  return (
    <div style={{ padding: "0 16px 80px" }}>
      <h3 style={{ fontSize: "16px", color: "#aaa", marginBottom: "12px" }}>
        Recent Searches
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {recentSearches.map((item, index) => (
          <button
            key={index}
            onClick={() => onSearch(item.query, item.tab)}
            style={{
              background: "#1a1a1a",
              border: "none",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "#fff",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{item.query}</span>
            <span
              style={{
                background: "#333",
                color: "#ccc",
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "8px",
              }}
            >
              {item.tab}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
