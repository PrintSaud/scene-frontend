import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import filterMovies, { isQueryBanned } from "../utils/filterMovies";
import { backend } from "../config";
import StarRating from "../components/StarRating";

import SearchTabUsers from "./searchTabs/SearchTabUsers";
import SearchTabLists from "./searchTabs/SearchTabLists";
import SearchTabActors from "./searchTabs/SearchTabActors";
import SearchTabDirectors from "./searchTabs/SearchTabDirectors";
import SearchTabRecent from "./searchTabs/SearchTabRecent";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("films");
  const [results, setResults] = useState([]);
  const [posterOverrides, setPosterOverrides] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);

  const navigate = useNavigate();
  const tabs = ["films", "lists", "actors", "directors"]; // "users"

  useEffect(() => {
    const savedQuery = sessionStorage.getItem("sceneSearchQuery");
    const savedTab = sessionStorage.getItem("sceneSearchTab");
    if (savedQuery) setQuery(savedQuery);
    if (savedTab) setActiveTab(savedTab);

    const stored = JSON.parse(localStorage.getItem("sceneRecentSearches") || "[]");
    setRecentSearches(stored);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("sceneSearchQuery", query);
    sessionStorage.setItem("sceneSearchTab", activeTab);
  }, [query, activeTab]);

  const handleResultClick = (q, tab) => {
    const updated = [
      { query: q, tab },
      ...recentSearches.filter((item) => item.query !== q || item.tab !== tab),
    ].slice(0, 10);
  
    localStorage.setItem("sceneRecentSearches", JSON.stringify(updated));
    setRecentSearches(updated);
    setQuery(q);
    setActiveTab(tab);
    handleSearch(q); // 🔥 Directly trigger the search
  };
  

  const handleSearch = async (q) => {
    if (!q) return;
    if (isQueryBanned(q)) {
      setResults([]);
      return;
    }
  
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  
    try {
      if (activeTab === "films") {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&api_key=${apiKey}`);
        const data = await res.json();
        const filtered = filterMovies(data.results || []);
        setResults(filtered);
  
        const userId = JSON.parse(localStorage.getItem("user"))?._id;
        if (userId) {
          const overrides = {};
          await Promise.all(filtered.map(async (movie) => {
            try {
              const res = await fetch(`${backend}/api/posters/${movie.id}?userId=${userId}`);
              const data = await res.json();
              if (data.posterOverride) overrides[movie.id] = data.posterOverride;
            } catch {}
          }));
          setPosterOverrides(overrides);
        }
  
      } else if (activeTab === "users") {
        const res = await fetch(`${backend}/api/users?query=${q}`);
        setResults(await res.json());
  
        if (activeTab === "lists") {
          const user = JSON.parse(localStorage.getItem("user"));
          const token = user?.token;
        
          const res = await fetch(`${backend}/api/lists/search?query=${q}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        
          const data = await res.json();
          console.log("📦 List Search Result:", data);
        
          if (Array.isArray(data)) {
            setResults(data);
          } else {
            console.error("❌ Unexpected list search response:", data);
            setResults([]);
          }
        }
        
  
      } else if (activeTab === "actors" || activeTab === "directors") {
        const res = await fetch(`https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(q)}&api_key=${apiKey}`);
        const data = await res.json();
        const filtered = (data.results || []).filter((p) =>
          activeTab === "actors"
            ? p.known_for_department === "Acting"
            : p.known_for_department === "Directing"
        );
        setResults(filtered);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }
  };
  

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query) handleSearch(query);
    }, 300);
    return () => clearTimeout(delay);
  }, [query, activeTab]);

  return (
    <div style={{ padding: "20px", paddingBottom: "100px", background: "#0e0e0e", color: "#fff", minHeight: "100vh", overflowY: "scroll" }} className="no-scrollbar">
      {/* 🔍 Search Bar */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        style={{
          width: "95%",
          height: "40px",
          borderRadius: "16px",
          padding: "0 14px",
          fontSize: "1rem",
          outline: "none",
          background: "#f0f0f0",
          color: "#000",
          marginBottom: "20px"
        }}
      />

      {/* 📂 Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: activeTab === tab ? "#fff" : "#222",
              color: activeTab === tab ? "#000" : "#aaa",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 🧠 Dynamic Results */}
      {query ? (
        <>
          <p style={{ marginBottom: "16px", color: "#aaa" }}>
            Showing results for: <strong>{query}</strong>
          </p>

          {activeTab === "films" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "14px"
            }}>
              {results.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  style={{
                    background: "#111",
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  <img
                    src={
                      posterOverrides[movie.id] ||
                      (movie.poster_path && `https://image.tmdb.org/t/p/w200${movie.poster_path}`) ||
                      "/default-poster.jpg"
                    }
                    alt={movie.title}
                    style={{
                      width: "100%",
                      aspectRatio: "2 / 3",
                      objectFit: "cover",
                      borderRadius: "8px",
                      background: "#222",
                    }}
                  />
                  <div style={{ padding: "8px" }}>
                    <div style={{ fontWeight: 600 }}>{movie.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "#aaa" }}>{movie.release_date?.slice(0, 4) || "N/A"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
  <StarRating rating={movie.vote_average || 0} size={16} compact />
</div>
                  </div>
                </div>
              ))}
            </div>
          )}

{activeTab === "lists" && (
        <SearchTabLists results={results} onSearch={handleResultClick} />
      )}
      {activeTab === "users" && (
        <SearchTabUsers results={results} onSearch={handleResultClick} />
      )}
      {activeTab === "actors" && (
        <SearchTabActors results={results} onSearch={handleResultClick} />
      )}
      {activeTab === "directors" && (
        <SearchTabDirectors results={results} onSearch={handleResultClick} />
      )}
        </>
      ) : (
        <SearchTabRecent
  recentSearches={recentSearches}
  onSearch={handleResultClick}
/>

      )}
    </div>
  );
}
