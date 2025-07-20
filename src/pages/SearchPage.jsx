import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchFilterModal from "../components/SearchFilterModal";
import filterMovies, { isQueryBanned } from "../utils/filterMovies";
import { backend } from "../config";
import { BLOCKED_MOVIE_IDS } from "../utils/blockedMovies";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("films");
  const [results, setResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [posterOverrides, setPosterOverrides] = useState({});

  const tabs = ["films",]; //"users", "lists "];

  const handleSearch = async (q) => {
    if (!q) return;
    if (isQueryBanned(q)) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);


      if (activeTab === "films") {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        let url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&api_key=${apiKey}&language=en-US&include_adult=false`;
        if (year) url += `&year=${year}`;

        const res = await fetch(url);
        const data = await res.json();
        const filtered = filterMovies(data.results || []);

        if (filtered.length > 0) {
          setResults(filtered);
        
          const user = JSON.parse(localStorage.getItem("user"));
          const userId = user?._id;
        
          if (userId) {
            const overrides = {};
            await Promise.all(filtered.map(async (movie) => {
              try {
                const res = await fetch(`${backend}/api/posters/${movie.id}?userId=${userId}`);
                const data = await res.json();
                if (data.posterOverride) {
                  overrides[movie.id] = data.posterOverride;
                }
              } catch (err) {
                console.warn(`Custom poster fetch failed for movie ${movie.id}`, err);
              }
            }));
        
            setPosterOverrides(overrides);
          }
        
          return;
        }
        
    

        // 🔁 Fallback by ID
        if (!isNaN(q)) {
          const fallbackRes = await fetch(`https://api.themoviedb.org/3/movie/${q}?api_key=${apiKey}&language=en-US`);
          if (fallbackRes.ok) {
            const fallbackMovie = await fallbackRes.json();
            const single = filterMovies([fallbackMovie]);
            if (single.length > 0) {
              setResults(single);
              return;
            }
          }
        }

        setResults([]);
      } else if (activeTab === "users") {
        const res = await fetch(`${backend}/api/users?query=${q}`);
        const data = await res.json();
        setResults(data);
      } else if (activeTab === "lists") {
        const res = await fetch(`${backend}/api/lists/search?query=${q}`);
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("Something went wrong.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(delay);
  }, [query, activeTab]);

  return (
    <div style={{ padding: "20px", paddingBottom: "100px", background: "#0e0e0e", color: "#fff", minHeight: "100vh", overflowY: "scroll" }} className="no-scrollbar">
      {/* 🔍 Search Bar */}
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          style={{
            flex: 1,
            height: "40px",
            borderRadius: "12px",
            border: "none",
            padding: "0 14px",
            fontSize: "1rem",
            outline: "none",
            background: "#f0f0f0",
            color: "#000",
          }}
        />
        <button
          onClick={() => setShowFilters(true)}
          style={{
            marginLeft: "10px",
            border: "1px solid #888",
            borderRadius: "12px",
            padding: "0 12px",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Filters
        </button>
      </div>

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
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {query && (
        <p style={{ marginBottom: "16px", color: "#aaa" }}>
          Showing results for: <strong>{query}</strong>
        </p>
      )}

      <div>
        <h3 style={{ marginBottom: "10px" }}>{activeTab.toUpperCase()}</h3>
        {results.length === 0 && <p>No results yet.</p>}

        {activeTab === "films" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
           gap: "14px", justifyContent: "center", }}>
            {results.map((movie) => (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                style={{
                  background: "#111",
                  borderRadius: "12px",
                  overflow: "hidden",
                  padding: "10px",
                  cursor: "pointer",
                  width: "170px",
                }}
              >
                {movie.poster_path ? (
                  <img
                  src={posterOverrides[movie.id] 
                    || (movie.poster_path && `https://image.tmdb.org/t/p/w200${movie.poster_path}`) 
                    || "/default-poster.jpg"
                  }
                  alt={movie.title}
                  style={{
                    width: "100%",
                    height: "280px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                />                
                ) : (
                  <div style={{ width: "100%", height: "250px", background: "#333", borderRadius: "8px", marginBottom: "10px" }} />
                )}
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{movie.title}</div>
                <div style={{ fontSize: "0.85rem", color: "#aaa" }}>({movie.release_date?.slice(0, 4) || "N/A"})</div>
                <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>⭐ {movie.vote_average?.toFixed(1) || "N/A"}/10</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "users" &&
          results.map((user, i) => (
            <p key={i}>👤 {user.username}</p>
          ))}

        {activeTab === "lists" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px", padding: "16px" }}>
            {results.map((list) => (
              <div
                key={list._id}
                onClick={() => navigate(`/list/${list._id}`)}
                style={{
                  background: "#1a1a1a",
                  borderRadius: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  height: "160px",
                }}
              >
                <img src={list.coverImage} alt={list.title} style={{ width: "100%", height: "100px", objectFit: "cover" }} />
                <div style={{ padding: "6px 10px", color: "#fff", fontSize: "12px" }}>
                  <div style={{ fontWeight: "bold", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{list.title}</div>
                  <div style={{ color: "#aaa", fontSize: "11px", marginTop: "2px" }}>@{list.user?.username || "unknown"}</div>
                  <div style={{ fontSize: "11px", color: "#bbb", marginTop: "4px" }}>
                    ❤️ {list.likes?.length || 0} {list.likes?.length === 1 ? "like" : "likes"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SearchFilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={() => {
          setShowFilters(false);
          handleSearch(query);
        }}
        genre={genre}
        year={year}
        setGenre={setGenre}
        setYear={setYear}
      />
    </div>
  );
}
