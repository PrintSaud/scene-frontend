import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import AddMovieModal from "../components/lists/AddMovieModal";
import MovieListSortable from "../components/lists/MovieListSortable";

export default function CreateListPage() {
  const navigate = useNavigate();
  const backend = import.meta.env.VITE_BACKEND;
  const user = JSON.parse(localStorage.getItem("user"));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [movies, setMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await axios.post(`${backend}/api/upload/list-cover`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setCoverImage(data.url);
    } catch (err) {
      console.error("❌ Upload failed", err);
      alert("Upload failed.");
    }
  };

  const canSave = title.trim().length > 0 && movies.length > 0;

  const handleSave = async () => {
    try {
      const payload = {
        title,
        description,
        coverImage,
        isPrivate,
        isRanked,
        movies: movies.map((m) => ({
          id: m.id,
          title: m.title,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "",
        })),
      };
  
      const { data } = await axios.post(`${backend}/api/lists`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
  
      // Trigger refresh on return to Profile
      window.dispatchEvent(new Event("refreshMyLists"));
  
      navigate(`/list/${data._id}`);
    } catch (err) {
      console.error("❌ Failed to create list", err);
      alert("Failed to create list.");
    }
  };
  

  return (
    <div style={{ background: "#0e0e0e", color: "white", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px" }}>
        <button onClick={() => navigate(-1)} style={btnStyle}>← Back</button>
        <button onClick={handleSave} style={{ ...btnStyle, opacity: canSave ? 1 : 0.5 }} disabled={!canSave}>
          ✅ Save
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          placeholder="List title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, height: "80px" }}
        />

        {/* Cover Image Upload */}
        {!coverImage ? (
          <div style={{ marginTop: "12px" }}>
            <label htmlFor="cover-upload" style={uploadLabel}>
              ⬆️ Upload a cover image
            </label>
            <input type="file" id="cover-upload" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
          </div>
        ) : (
          <div style={{ marginTop: "12px" }}>
            <img src={coverImage} alt="Cover" style={{ width: "100%", borderRadius: "10px", objectFit: "cover" }} />
            <button onClick={() => setCoverImage("")} style={removeBtn}>❌ Remove</button>
          </div>
        )}

        {/* Toggles */}
        <label style={toggleStyle}>
          <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} />
          <span style={{ marginLeft: "8px" }}>🔒 Private</span>
        </label>

        <label style={toggleStyle}>
          <input type="checkbox" checked={isRanked} onChange={() => setIsRanked(!isRanked)} />
          <span style={{ marginLeft: "8px" }}>🏆 Ranked</span>
        </label>

        {/* Movie List */}
{/* Movie List */}
<div>
  <h4 style={{ marginTop: "20px" }}>🎬 Movies in this list:</h4>
  {movies.length === 0 ? (
    <p style={{ color: "#888" }}>No movies added yet.</p>
  ) : isRanked ? (
    <MovieListSortable movies={movies} setMovies={setMovies} />
  ) : (
    <ul style={{ marginTop: "8px", paddingLeft: "0" }}>
      {movies.map((movie) => (
        <li key={movie.id} style={{ marginBottom: "8px",fontFamily: "Inter, sans-serif", listStyle: "none" }}>
          {movie.title}
          <button
            onClick={() => setMovies(movies.filter((m) => m.id !== movie.id))}
            style={{ marginLeft: "8px", color: "#f55", background: "none", border: "none" }}
          >
            ❌
          </button>
        </li>
      ))}
    </ul>
  )}
</div>


<button onClick={() => setShowModal(true)} style={btnStyle}>
  ➕ Add Movie
</button>
      </div>

      {/* Modal placeholder */}
      {showModal && (
  <AddMovieModal
    onClose={() => setShowModal(false)}
    onSelect={(movie) => setMovies([...movies, movie])}
    existing={movies}
  />
)}
    </div>
  );
}

const btnStyle = {
  background: "#1a1a1a",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #333",
  cursor: "pointer",
  fontSize: "14px",
};

const inputStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#1a1a1a",
  color: "#fff",
  fontSize: "14px",
};

const toggleStyle = {
  display: "flex",
  alignItems: "center",
  fontSize: "14px",
  cursor: "pointer",
};

const uploadLabel = {
  display: "block",
  padding: "12px",
  border: "1px dashed #555",
  borderRadius: "10px",
  color: "#bbb",
  textAlign: "center",
  cursor: "pointer",
};

const removeBtn = {
  marginTop: "8px",
  padding: "4px 8px",
  fontSize: "12px",
  background: "#333",
  color: "#eee",
  borderRadius: "6px",
  border: "none",
};
