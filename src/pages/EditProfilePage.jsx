import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import MovieListSortable from "../components/lists/MovieListSortable";
import { backend } from "../config";


import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import ReactModal from "react-modal";
import { BLOCKED_MOVIE_IDS } from "../utils/blockedMovies";
import BackdropSearchModalV2 from "../components/BackdropSearchModalV2";



const inputStyle = {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "6px",
    padding: "10px",
    color: "#fff",
    fontSize: "14px",
  };
  
  const btnStyle = {
    background: "none",
    border: "1px solid #444",
    color: "#aaa",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  };
  
  const posterStyle = {
    width: "72px",
    height: "108px",
    borderRadius: "6px",
    objectFit: "cover",
  };
  
  const addPosterStyle = {
    width: "72px",
    height: "108px",
    background: "#222",
    color: "#999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    borderRadius: "6px",
    cursor: "pointer",
  };

ReactModal.setAppElement("#root");

export default function EditProfilePage() {
    const stored = localStorage.getItem("user");
const rawUser = stored ? JSON.parse(stored) : null;

const user = {
  ...rawUser,
  _id: rawUser?._id || rawUser?.id || "", // Ensure _id always exists
};


const token = user?.token;


  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteFilms, setFavoriteFilms] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [showBackdropModal, setShowBackdropModal] = useState(false);
  const [tmdbBackdrops, setTmdbBackdrops] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [backdropOptions, setBackdropOptions] = useState([]);
const [selectedBackdrop, setSelectedBackdrop] = useState("");




console.log("User object:", user);


useEffect(() => {
    if (user) {
      const localBackdrop = JSON.parse(localStorage.getItem("chosenBackdrop"));
  
      setDisplayName(user.name || "");
      setBio(user.bio || "");
      setFavoriteFilms(user.favoriteMovies || []);
      setAvatar(user.avatar || "");
      setUsername(user.username);
  
      // 🔥 Use chosen backdrop if exists, fallback to saved one
      setBackdrop(localBackdrop?.backdrop || user.backdrop || "");
    }
  }, []);
  



  const handleSave = async () => {
    if (!user._id || !token) {
        alert("User not found. Please log in again.");
        return;
      }
      
      localStorage.removeItem("chosenBackdrop");


    try {
      const updatedUser = {
        name: displayName,
        bio,
        avatar,
        backdrop,
        favoriteMovies: favoriteFilms,
        
      };

      await axios.patch(`${backend}/api/users/${user._id}`, updatedUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // 🧠 UPDATE localStorage
      localStorage.setItem("user", JSON.stringify({ ...user, ...updatedUser }));
      
      alert("Profile updated!");
      navigate(`/profile/${user._id}`);
      


    } catch (err) {
      console.error("❌ Failed to update profile", err);
      alert("Something went wrong.");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("avatar", file); // ✅ key must be 'avatar'
  
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload/${user._id}/upload-avatar`, // ✅ route
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      setAvatar(res.data.avatar); // ✅ backend returns avatar: url
    } catch (err) {
      console.error("Avatar upload failed", err);
      alert("Upload failed.");
    }
  };
  

  const searchTMDBMovies = async () => {
    if (!searchQuery) return;
  
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/movies/search?q=${searchQuery}`);
  
      const bannedWords = ["porn", "sex", "nude", "xxx", "hentai", "fetish"];
      const indianLangs = ["hi", "ta", "te", "ml", "kn", "bn", "pa", "ur"];
      const foreignLangs = ["zh", "fr", "de", "ru", "ko"];
  
      const filtered = (res.data.results || []).filter((movie) => {
        const title = (movie.title || "").toLowerCase();
  
        const isBlocked = BLOCKED_MOVIE_IDS.includes(movie.id);
        const isLowRatedJapanese = movie.original_language === "ja" && movie.vote_count < 2500;
        const isIndian = indianLangs.includes(movie.original_language);
        const isForeignLowRated =
          foreignLangs.includes(movie.original_language) && movie.vote_count < 5000;
        const hasBannedWord = bannedWords.some((word) => title.includes(word));
  
        return (
          movie.vote_count > 10 &&
          movie.poster_path &&
          !movie.adult &&
          !isBlocked &&
          !isLowRatedJapanese &&
          !isIndian &&
          !isForeignLowRated &&
          !hasBannedWord
        );
      });
  
      setSearchResults(filtered);
      setBackdropOptions([]); // clear old backdrops
      setSelectedBackdrop(""); // reset selected
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults([]);
    }
  };
  
  
  const fetchMovieBackdrops = async (tmdbId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/movies/${tmdbId}`);
      const backdrops = res.data.backdrops || [];
      const formatted = backdrops.map(
        (img) => `https://image.tmdb.org/t/p/original${img}`
      );
      setBackdropOptions(formatted);
      // 🔥 Do NOT clear searchResults here!
    } catch (err) {
      console.error("Backdrop fetch failed", err);
    }
  };
  

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(favoriteFilms);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setFavoriteFilms(items);
  };

  return (
    <>
      <div style={{ background: "#0e0e0e", color: "#fff", padding: "24px", minHeight: "100vh" }}>
        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "none", color: "#aaa", border: "none", fontSize: "16px", cursor: "pointer" }}
          >
            ← Back
          </button>
          <button
            onClick={handleSave}
            style={{
              background: "#fff",
              color: "#000",
              borderRadius: "6px",
              padding: "6px 14px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
  
        {/* Backdrop Preview */}
        {backdrop && (
          <img
            src={backdrop}
            alt="backdrop"
            style={{
              width: "100%",
              height: "140px",
              borderRadius: "12px",
              objectFit: "cover",
              marginBottom: "16px",
            }}
          />
        )}
  
        {/* Avatar Upload */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <img
  src={user.avatar || "/default-avatar.png"}
  alt="Avatar"
  style={{
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid white",
  }}
/>
          <div>
            <h2 style={{ marginBottom: "6px" }}>{displayName}</h2>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              id="avatarInput"
              onChange={handleAvatarUpload}
            />
            <label htmlFor="avatarInput" style={btnStyle}>
              Change Photo
            </label>
          </div>
        </div>
  
        <div style={{ marginTop: "24px", width: "90%" }}>
          <label>Display Name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
        </div>
  
        <div style={{ marginTop: "16px", width: "60%", display: "flex", alignItems: "center" }}>
        <button style={btnStyle} onClick={() => navigate("/choose-backdrop")}>
  Change backdrop
</button>

        </div>
  
        <div style={{ marginTop: "14px", width: "90%" }}>
          <label>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...inputStyle, height: "80px" }} />
        </div>

{/* 🎬 Favorite Films - Drag & Drop */}
<div style={{ marginTop: "24px" }}>
  <h4>Favorite Films</h4>
  <MovieListSortable movies={favoriteFilms} setMovies={setFavoriteFilms} />
  <p style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
    Drag to reorder, click ❌ to remove
  </p>
</div>

  
        <div style={{ marginTop: "32px", color: "#ccc" }}>
        </div>
  
        <div style={{ marginTop: "40px", display: "flex", alignItems: "center", gap: "12px" }}>
        </div>
      </div>
  
      {/* 🟩 This is OUTSIDE the main div AND the fragment — so it renders like a modal! */}
      {showBackdropModal && (
        <BackdropSearchModalV2
          onSelect={(movie) => {
            setBackdrop(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`);
            setShowBackdropModal(false);
            setSearchQuery("");
            setBackdropOptions([]);
            setSearchResults([]);
            setSelectedBackdrop("");
          }}
          onClose={() => setShowBackdropModal(false)}
        />
      )}
    </>
  );
}
