import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/api";
import AddMovieModal from "../components/lists/AddMovieModal";
import MovieListSortable from "../components/lists/MovieListSortable";
import CropListImageModal from "../components/CropListImageModal";
import useTranslate from "../utils/useTranslate";
import toast from "react-hot-toast";

export default function EditListPage() {
  const t = useTranslate();
  const { id } = useParams();
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

  useEffect(() => {
    const fetchList = async () => {
      try {
        const { data } = await axios.get(`/api/lists/${id}`);
        if (data?.user?._id && data.user._id !== user?._id) return navigate("/");
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCoverImage(data.coverImage || "");
        setIsPrivate(!!data.isPrivate);
        setIsRanked(!!data.isRanked);
        setMovies(Array.isArray(data.movies) ? data.movies : []);
      } catch (err) {
        console.error("❌ Failed to load list", err);
        toast.error(t("Failed to load list."));
      }
    };
    fetchList();
  }, [id]);

  const canSave = title.trim().length > 0 && movies.length > 0;

  const handleSave = async () => {
    try {
      const payload = {
        title,
        description,
        coverImage,
        isPrivate,
        isRanked,
        movies,
      };
      await axios.patch(`/api/lists/${id}`, payload);
      toast.success("✅ " + t("List updated!"));
      navigate(`/list/${id}`);
    } catch (err) {
      console.error("❌ Failed to update list", err);
      toast.error(t("Failed to update list."));
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("⚠️ " + t("Are you sure you want to delete this list?"));
    if (!ok) return;
    try {
      await axios.delete(`/api/lists/${id}`);
      toast.success(t("List deleted."));
      navigate("/profile");
    } catch (err) {
      console.error("❌ Failed to delete list", err);
      toast.error(t("Failed to delete list."));
    }
  };

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

  return (
    <div style={{ background: "#0e0e0e", color: "white", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px" }}>
        <button onClick={() => navigate(-1)} style={btnStyle}>← {t("Back")}</button>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSave}
            style={{ ...btnStyle, opacity: canSave ? 1 : 0.5 }}
            disabled={!canSave}
          >
            ✅ {t("Save")}
          </button>
          <button onClick={handleDelete} style={deleteBtn}>🗑️ {t("Delete")}</button>
        </div>
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

        {/* Cover */}
        {!coverImage ? (
          <div>
            <label htmlFor="cover-upload" style={uploadLabel}>⬆️ {t("Upload a cover image")}</label>
            <input
              type="file"
              id="cover-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCoverUpload}
            />
          </div>
        ) : (
          <div>
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

        {/* Movies */}
        <div>
          <h4 style={{ marginTop: "20px" }}>🎬 {t("Movies in this list:")}</h4>
          {movies.length === 0 ? (
            <p style={{ color: "#888" }}>{t("No movies yet.")}</p>
          ) : (
            <MovieListSortable
              movies={movies}
              setMovies={setMovies}
              hideNumbers={!isRanked}
            />
          )}
        </div>

        <button onClick={() => setShowModal(true)} style={btnStyle}>➕ {t("Add Movie")}</button>
      </div>

      {/* Modal */}
      {showModal && (
        <AddMovieModal
          onClose={() => setShowModal(false)}
          onSelect={(movie) => {
            if (!movies.find((m) => m.id === movie.id)) {
              setMovies([...movies, movie]);
            }
          }}
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

// Styles
const btnStyle = {
  background: "#1a1a1a",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #333",
  cursor: "pointer",
  fontSize: "14px",
};

const deleteBtn = {
  ...btnStyle,
  border: "1px solid #922",
  color: "#f66",
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
