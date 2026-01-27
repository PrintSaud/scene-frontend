// src/pages/searchTabs/SearchTabRecent.jsx
import React from "react";
import useTranslate from "../../utils/useTranslate"; // ✅ translation hook

export default function SearchTabRecent({ recentSearches, onSearch }) {
  const t = useTranslate();

  if (recentSearches.length === 0) return null;

  // map tab keys to translated labels
  const tabLabels = {
    films: t("Movies"),
    users: t("Users"),
    lists: t("Lists"),
    actors: t("Actors"),
    directors: t("Directors"),
  };

  return (
    <div style={{ paddingRight: "16px", paddingBottom: "80px", paddingLeft: "0" }}>
      <h3
        style={{
          fontSize: "16px",
          color: "#aaa",
          marginBottom: "12px",
          paddingLeft: "16px",
        }}
      >
        {t("Recent Searches")}
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
              width: "90vw",
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
              {tabLabels[item.tab] || item.tab}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
