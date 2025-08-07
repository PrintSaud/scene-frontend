import React, { useEffect, useRef, useState } from "react";
import api from "../api/api";
import { backend } from "../config";
const GIPHY_API = "https://api.giphy.com/v1/gifs";
const API_KEY = "Us8LunlcSYoy78SempDRQtVRJ87jOccq";

const categories = [
  { label: "Recently Used", key: "recent" },
  { label: "Trending", key: "trending" },
  { label: "Sad", key: "sad" },
  { label: "Celebrating", key: "celebration" },
  { label: "Laughing", key: "laugh" },
  { label: "Mind Blown", key: "mind blown" },
];

export default function GifSearchModal({ onSelect, onClose }) {
  const [gifs, setGifs] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const inputRef = useRef();

  const userId = JSON.parse(localStorage.getItem("user"))?._id;

  useEffect(() => {
    inputRef.current?.focus();

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    fetchGIFs(activeTab);
  }, [activeTab]);

  const fetchGIFs = async (query) => {

    if (query === "recent" && userId) {
      try {
        const res = await api.get(`/api/users/${userId}/recent-gifs`);
        const gifsArray = res.data?.recentGifs || [];
    
        setGifs(
          gifsArray.map((url, idx) => ({
            id: idx,
            url,
            images: {
              original: { url },
              fixed_width: { webp: url },
            },
          }))
        );
      } catch (err) {
        console.error("Failed to fetch recent gifs:", err);
        setGifs([]);
      }
      return;
    }
    
  
    const endpoint =
      query === "trending"
        ? `${GIPHY_API}/trending?api_key=${API_KEY}&limit=20`
        : `${GIPHY_API}/search?api_key=${API_KEY}&q=${query}&limit=20`;
  
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setGifs(json.data);
    } catch (err) {
      console.error("Failed to load GIFs:", err);
      setGifs([]); // Optional fallback
    }
  };
  

  const handleSearch = async (e) => {
    setSearch(e.target.value);
    if (e.target.value.trim()) {
      const endpoint = `${GIPHY_API}/search?api_key=${API_KEY}&q=${e.target.value}&limit=20`;
      const res = await fetch(endpoint);
      const json = await res.json();
      setGifs(json.data);
    }
  };

  const handleSelectGif = async (gif) => {
    const gifUrl = gif?.images?.original?.url || gif?.url; // prefer actual image
  

  
    onSelect(gifUrl);
    onClose();
  
    if (userId && gifUrl) {
      try {
        await api.post(`/api/users/gif/recent`, {
            userId,
            gifUrl,
          });          
      } catch (err) {
        console.error("Failed to save recent gif:", err);
      }
    }
  };

  return (
    <div
  style={{
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100vw",
    height: "75vh",
    backgroundColor: "#111",
    borderTopLeftRadius: "14px",
    borderTopRightRadius: "14px",
    zIndex: 9999,
    padding: "12px 16px 20px",
    overflowY: "auto",
  }}
>
      {/* 🔍 Search */}
      <input
        type="text"
        ref={inputRef}
        placeholder="Search GIPHY"
        value={search}
        onChange={handleSearch}
        style={{
          width: "90%",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "none",
          background: "#222",
          color: "#fff",
          fontSize: "14px",
          marginBottom: "12px",
        }}
      />

      {/* 📂 Tabs */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "12px",
          overflowX: "auto",
          fontSize: "13px",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === cat.key ? "#fff" : "#aaa",
              fontWeight: activeTab === cat.key ? "bold" : "normal",
              paddingBottom: "4px",
              borderBottom:
                activeTab === cat.key ? "2px solid #B327F6" : "2px solid transparent",
              cursor: "pointer",
              transition: "border-bottom 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

  {/* 👇 Scrollable content (GIFs + attribution together) */}
  <div>
  <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  }}
    >
      {gifs.map((gif) => (
        <img
          key={gif.id}
          src={gif.images.fixed_width.webp}
          alt={gif.title}
          style={{
            width: "100%",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onClick={() => handleSelectGif(gif)}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
      ))}
    </div>

    {/* ✅ Attribution placed immediately after GIF grid */}
    <div style={{ textAlign: "center", marginTop: 12 }}>
  <img
    src="/rrpowered-by-giphy.png" 
    alt="Powered by GIPHY"
    style={{ width: 100, opacity: 0.8 }}
  />
</div>
<div style={{ height: 80 }} />
</div>
</div>
);
}
