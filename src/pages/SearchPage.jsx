// src/pages/SearchPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { backend } from "../config";
import StarRating from "../components/StarRating";
import SearchTabUsers from "./searchTabs/SearchTabUsers";
import SearchTabLists from "./searchTabs/SearchTabLists";
import SearchTabActors from "./searchTabs/SearchTabActors";
import SearchTabDirectors from "./searchTabs/SearchTabDirectors";
import SearchTabRecent from "./searchTabs/SearchTabRecent";
import filterMovies, { isQueryBanned, whitelistIds } from "../utils/filterMovies";
import useTranslate from "../utils/useTranslate"; // ✅ translation hook

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("films");
  const [results, setResults] = useState([]);
  const [posterOverrides, setPosterOverrides] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const t = useTranslate();

  // stable tab keys; labels are translated below
  const tabs = ["films", "users", "lists", "actors", "directors"];
  const tabLabels = {
    films: t("Movies"),
    users: t("Users"),
    lists: t("Lists"),
    actors: t("Actors"),
    directors: t("Directors"),
  };

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

    setTimeout(() => {
      handleSearch(q); // wait for state to settle
    }, 50);
  };

  const saveToRecentSearches = (q, tab) => {
    const updated = [
      { query: q, tab },
      ...recentSearches.filter((item) => item.query !== q || item.tab !== tab),
    ].slice(0, 10);

    localStorage.setItem("sceneRecentSearches", JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const handleSearch = async (q) => {
    if (!q) return;
    if (isQueryBanned(q)) {
      setResults([]);
      return;
    }

    const apiKey = import.meta.env.VITE_TMDB_API_KEY;

    try {
      // 🎬 Films Tab
      if (activeTab === "films") {
        const [res1, res2] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&api_key=${apiKey}&page=1`),
          fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&api_key=${apiKey}&page=2`)
        ]);

        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
        let allResults = [...(data1.results || []), ...(data2.results || [])];

        // filter + whitelist backfill
        let filtered = filterMovies(allResults);
        const normalizedQuery = q.toLowerCase();
        const missingWhitelisted = whitelistIds.filter(
          (id) => !filtered.some((m) => Number(m.id) === id)
        );

        for (const id of missingWhitelisted) {
          try {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`);
            if (res.ok) {
              const movieData = await res.json();
              const titleMatch =
                movieData.title?.toLowerCase().includes(normalizedQuery) ||
                movieData.original_title?.toLowerCase().includes(normalizedQuery);
              if (titleMatch) filtered.push(movieData);
            }
          } catch {}
        }

        setResults(filtered);

        // 🎨 Load poster overrides
        const userId = JSON.parse(localStorage.getItem("user"))?._id;
        if (userId) {
          const overrides = {};
          await Promise.all(
            filtered.map(async (movie) => {
              try {
                const res = await fetch(`${backend}/api/posters/${movie.id}?userId=${userId}`);
                const data = await res.json();
                if (data.posterOverride) overrides[movie.id] = data.posterOverride;
              } catch {}
            })
          );
          setPosterOverrides(overrides);
        }
      }

      // 👤 Users Tab
      else if (activeTab === "users") {
        const res = await fetch(`${backend}/api/users/search?query=${q}`);
        const users = await res.json();
        setResults(users);
      }

      // 📝 Lists Tab
      else if (activeTab === "lists") {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;
        if (!token) {
          console.warn("⚠️ No token found in localStorage — user not logged in?");
          return;
        }

        try {
          const url = `${backend}/api/lists/search?q=${encodeURIComponent(q)}`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
        } catch {
          setResults([]);
        }
      }

      // 🎭 Actors or Directors Tab
      else if (activeTab === "actors" || activeTab === "directors") {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(q)}&api_key=${apiKey}`
        );
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
    <div
      style={{
        padding: "20px",
        paddingBottom: "100px",
        background: "#0e0e0e",
        color: "#fff",
        minHeight: "100vh",
        overflowY: "scroll",
      }}
      className="no-scrollbar"
    >
      {/* 🔍 Search Bar */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("Search")}
        style={{
          width: "95%",
          height: "40px",
          borderRadius: "16px",
          padding: "0 14px",
          fontSize: "1rem",
          outline: "none",
          background: "#f0f0f0",
          color: "#000",
          marginBottom: "20px",
        }}
      />

      {/* 📂 Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: activeTab === tab ? "#fff" : "#222",
              color: activeTab === tab ? "#000" : "#aaa",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* 🧠 Dynamic Results */}
      {query ? (
        <>
          <p style={{ marginBottom: "16px", color: "#aaa" }}>
            {t("Search results")}: <strong>{query}</strong>
          </p>

          {activeTab === "films" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "14px",
              }}
            >
              {results.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => {
                    saveToRecentSearches(movie.title, "films");
                    navigate(`/movie/${movie.id}`);
                  }}
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
                    <div style={{ fontSize: "0.85rem", color: "#aaa" }}>
                      {movie.release_date?.slice(0, 4) || t("N/A")}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <StarRating rating={movie.vote_average || 0} size={16} compact />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "lists" && (
            <SearchTabLists
              searchTerm={query}
              activeTab={activeTab}
              onSearch={handleResultClick}
              saveToRecentSearches={saveToRecentSearches}
            />
          )}

          {activeTab === "users" && (
            <SearchTabUsers
              results={results}
              onSearch={handleResultClick}
              saveToRecentSearches={saveToRecentSearches}
            />
          )}
          {activeTab === "actors" && (
            <SearchTabActors
              results={results}
              onSearch={handleResultClick}
              saveToRecentSearches={saveToRecentSearches}
            />
          )}
          {activeTab === "directors" && (
            <SearchTabDirectors
              results={results}
              onSearch={handleResultClick}
              saveToRecentSearches={saveToRecentSearches}
            />
          )}
        </>
      ) : (
        <SearchTabRecent recentSearches={recentSearches} onSearch={handleResultClick} />
      )}
    </div>
  );
}
