// src/components/movie/MovieTabs.jsx
import React from "react";
import FullCastTab from "../movieTabs/FullCastTab";
import SimilarFilmsTab from "../movieTabs/SimilarFilmsTab";
import WhereToWatchTab from "../movieTabs/WhereToWatchTab";

export default function MovieTabs({
  activeTab,
  setActiveTab,
  credits,
  navigate,
  movieId,
  providers,
  selectedRegion,
  setSelectedRegion,
}) {
  const tabs = [
    { key: "cast", label: "Full Cast" },
    { key: "similar", label: "Similar Films" },
    { key: "watch", label: "Where to Watch" },
  ];

  return (
    <div style={{ marginTop: "40px" }}>
      {/* 🗂 Tab Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          borderBottom: "1px solid #333",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              fontSize: "14px",
              fontWeight: activeTab === tab.key ? "bold" : "normal",
              color: activeTab === tab.key ? "#fff" : "#888",
              borderBottom: activeTab === tab.key ? "2px solid #fff" : "none",
              flex: 1,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 📂 Tab Content */}
      {activeTab === "cast" && <FullCastTab credits={credits} navigate={navigate} />}
      {activeTab === "similar" && (
        
        <SimilarFilmsTab movieId={movieId} navigate={navigate} />
        
      )}
      {activeTab === "watch" && (
        <WhereToWatchTab
          providers={providers}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
        />
      )}
    </div>
  );
}
