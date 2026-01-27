import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import AddMovieModal from "../components/lists/AddMovieModal";
import MovieListSortable from "../components/lists/MovieListSortable";
import toast from "react-hot-toast";
import CropListImageModal from "../components/CropListImageModal";
import useTranslate from "../utils/useTranslate";

export default function CreateListPage() {
  const t = useTranslate();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [movies, setMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [rawCoverFile, setRawCoverFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRawCoverFile(file);
    setShowCropper(true);
  };

  const handleCroppedCover = async (croppedBlob) => {
    const formData = new FormData();
    formData.append("image", croppedBlob);

    try {
      const { data } = await axios.post("/api/upload/list-cover", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCoverImage(data.url);
      toast.success(t("Cover uploaded!"));
    } catch (err) {
      console.error("❌ Upload failed", err);
      toast.error(t("Upload failed."));
    }
  };

  const canSave = title.trim().length > 0 && movies.length > 0;

  const handleSave = async () => {
    try {
      const payload = {
        title,
        description,
        coverImage, // empty string if none
        isPrivate,
        isRanked,
        movies: movies.map((m) => ({
          id: m.id,
          title: m.title,
          poster:
            m.poster?.startsWith("http")
              ? m.poster
              : m.poster_path
              ? m.poster_path
              : "",
        })),
      };

      await axios.post("/api/lists", payload);
      window.dispatchEvent(new Event("refreshMyLists"));
      toast.success("✅ " + t("List created!"));
      navigate(-1);
    } catch (err) {
      console.error("❌ Failed to create list", err);
      toast.error(t("Failed to create list."));
    }
  };

  return (
    <div style={{ background: "#0e0e0e", color: "white", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px" }}>
        <button onClick={() => navigate(-1)} style={btnStyle}>← {t("Back")}</button>
        <button
          onClick={handleSave}
          style={{ ...btnStyle, opacity: canSave ? 1 : 0.5 }}
          disabled={!canSave}
        >
          ✅ {t("Save")}
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          placeholder={t("List title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
          aria-label={t("List title")}
        />

        <textarea
          placeholder={t("Description (optional)")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, height: "80px" }}
          aria-label={t("Description (optional)")}
        />

        {/* Cover Image Upload */}
        {!coverImage ? (
          <div style={{ marginTop: "12px" }}>
            <label htmlFor="cover-upload" style={uploadLabel}>
              ⬆️ {t("Upload a cover image (optional)")}
            </label>
            <input
              type="file"
              id="cover-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCoverUpload}
            />
          </div>
        ) : (
          <div style={{ marginTop: "12px" }}>
            <img
              src={coverImage}
              alt={t("Cover")}
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: "10px",
                objectFit: "cover",
                backgroundColor: "#222",
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/default-poster.jpg";
              }}
            />
            <button onClick={() => setCoverImage("")} style={removeBtn}>❌ {t("Remove")}</button>
          </div>
        )}

        {/* Toggles */}
        <label style={toggleStyle}>
          <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} />
          <span style={{ marginLeft: 8, fontFamily: "Inter, sans-serif" }}>{t("Private")}</span>
        </label>

        <label style={toggleStyle}>
          <input type="checkbox" checked={isRanked} onChange={() => setIsRanked(!isRanked)} />
          <span style={{ marginLeft: 8, fontFamily: "Inter, sans-serif" }}>{t("Ranked")}</span>
        </label>

        {/* Movie List */}
        <div>
          <h4 style={{ marginTop: "20px" }}>🎬 {t("Movies in this list:")}</h4>
          {movies.length === 0 ? (
            <p style={{ color: "#888" }}>{t("No movies added yet.")}</p>
          ) : (
            <MovieListSortable
              movies={movies}
              setMovies={setMovies}
              hideNumbers={!isRanked} // keep sortable; hide numbers if unranked
            />
          )}
        </div>

        <button onClick={() => setShowModal(true)} style={btnStyle}>➕ {t("Add Movie")}</button>
      </div>

      {/* Modal */}
      {showModal && (
        <AddMovieModal
          onClose={() => setShowModal(false)}
          onSelect={(movie) => setMovies([...movies, movie])}
          existing={movies}
        />
      )}

      {showCropper && rawCoverFile && (
        <CropListImageModal
          file={rawCoverFile}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCroppedCover}
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
