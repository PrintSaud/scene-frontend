import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaImage } from "react-icons/fa6";
import { BiSolidFileGif } from "react-icons/bi";
import GifSearchModal from "../GifSearchModal";
import axios from "axios";
import toast from "react-hot-toast";
import { createLog } from "../../api/api";
import { backend } from "../../config";

export default function LogModal({ movie, onClose, refreshLogs, editLogId }) {
  const { logId: logIdParam } = useParams();
const logId = editLogId || logIdParam;
  const [isEditMode, setIsEditMode] = useState(false);
  const [rating, setRating] = useState(0);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [review, setReview] = useState("");
  const [gifUrl, setGifUrl] = useState(null);
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [showGifModal, setShowGifModal] = useState(false);


  const [movieId, setMovieId] = useState(movie?.id || movie?._id);
  const [movieData, setMovieData] = useState(movie || null);
  
  useEffect(() => {
    if (logId) {
        setIsEditMode(true);
        axios.get(`${backend}/api/logs/${logId}`).then(({ data }) => {
          setRating(data.rating || 0);
          setReview(data.review || "");
          setRewatchCount(data.rewatch || 0);
          setGifUrl(data.gif || null);
          setUploadedImageFile(null);
          setMovieId(data.movie?._id || data.movie?.id);
          setMovieData(data.movie);
        });
      }      
  }, [logId]);

  

  const handleLogSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("movieId", movieId);
      formData.append("review", review);
      formData.append("rating", rating.toString());
      formData.append("rewatch", rewatchCount.toString());
      formData.append("watchedAt", new Date().toISOString());
      formData.append("gif", gifUrl || "");
      formData.append("title", movieData?.title || "Untitled");
      formData.append(
        "poster",
        movieData?.poster || `https://image.tmdb.org/t/p/w500${movieData?.poster_path}`
      );
      
      if (uploadedImageFile) {
        formData.append("image", uploadedImageFile);
      }

      if (isEditMode) {
        const token = localStorage.getItem("token");
await axios.patch(`${backend}/api/logs/${logId}`, formData, {
  headers: { Authorization: `Bearer ${token}` }
});
        toast.success("✅ Log updated!");
      } else {
        await createLog(formData);
        const user = JSON.parse(localStorage.getItem("user"));
        await axios.delete(`${backend}/api/watchlist/${user._id}/watchlist/${movieId}`);
        toast.success("🎬 Log submitted!");
      }

      onClose();
      refreshLogs?.();
    } catch (err) {
      console.error("❌ Log submit failed:", err);
      toast.error("Failed to submit log.");
    }
  };

  const handleStarClick = (index, isHalf) => {
    const newRating = isHalf ? index + 0.5 : index + 1;
    setRating(newRating);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedImageFile(file);
  };

  const handleBack = () => {
    if (onClose) onClose();
    else window.history.back();
  };


  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 9999,
      width: "100vw",
      height: "100vh",
      backgroundColor: "#0e0e0e",
      color: "#fff",
      overflowY: "auto",
      padding: "20px 20px 40px",
    }}>
        <button
  onClick={() => {
    if (onClose) onClose();
    else window.history.back();
  }}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "24px",
          marginBottom: "20px",
          cursor: "pointer",
        }}
      >
        <IoArrowBack />
      </button>

      {/* Poster + Title + Stars */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
      <img
  src={
    movieData?.poster_path
      ? `https://image.tmdb.org/t/p/w300${movieData.poster_path}`
      : movieData?.poster || "/default-poster.png"
  }
  alt={movieData?.title}
          style={{
            width: "150px",
            height: "240px",
            objectFit: "cover",
            borderRadius: "10px",
          }}
        />
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "Inter" }}>
          {movieData?.title}
          </h2>

          <div style={{ display: "flex", gap: "3px", marginTop: "6px", fontSize: "28px", position: "relative" }}>
            {[...Array(5)].map((_, i) => {
              const isFull = i + 1 <= rating;
              const isHalf = rating >= i + 0.5 && rating < i + 1;
              return (
                <div key={i} style={{ position: "relative", cursor: "pointer" }}>
                  <div onClick={() => handleStarClick(i, true)} style={{ position: "absolute", left: 0, width: "50%", height: "100%", zIndex: 2 }} />
                  <div onClick={() => handleStarClick(i, false)} style={{ position: "absolute", right: 0, width: "50%", height: "100%", zIndex: 2 }} />
                  {isFull ? <FaStar style={{ color: "#B327F6" }} /> : isHalf ? <FaStarHalfAlt style={{ color: "#B327F6" }} /> : <FaRegStar style={{ color: "#777" }} />}
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: "4px", fontSize: "12px", color: "#aaa", fontFamily: "Inter" }}>
            {rating > 0 ? `${rating.toFixed(1)} / 5` : `No rating yet`}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", cursor: "pointer", color: "#aaa" }}
            onClick={() => setRewatchCount((prev) => prev + 1)}>
            <HiOutlineRefresh size={18} />
            <span style={{ fontSize: "13px" }}>
              {rewatchCount > 0 ? `Rewatched ${rewatchCount}x` : "Mark as Rewatch"}
            </span>
          </div>
        </div>
      </div>

      {/* Review + Media */}
      <div style={{
        width: "86%",
        background: "#1a1a1a",
        borderRadius: "12px",
        padding: "12px",
        fontFamily: "Inter",
        minHeight: "120px",
      }}>
        <textarea
          placeholder="Write your thoughts..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            resize: "none",
            color: "#fff",
            fontSize: "14px",
            minHeight: gifUrl || uploadedImageFile ? "60px" : "100px",
            outline: "none",
          }}
        />

        {(uploadedImageFile || gifUrl) && (
          <div style={{ marginTop: "8px", position: "relative" }}>
            <img
              src={uploadedImageFile ? URL.createObjectURL(uploadedImageFile) : gifUrl}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "8px", objectFit: "contain" }}
            />
            <button onClick={() => { setUploadedImageFile(null); setGifUrl(null); }}
              style={{
                position: "absolute", top: "-6px", right: "-6px",
                background: "#000", color: "#fff", border: "none",
                borderRadius: "50%", width: "22px", height: "22px", fontSize: "14px", cursor: "pointer",
              }}>
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Upload Buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <label style={{ background: "#1a1a1a", padding: "12px", borderRadius: "8px", cursor: "pointer" }}>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          <FaImage size={20} color="#fff" />
        </label>
        <button onClick={() => setShowGifModal(true)} style={{ background: "#1a1a1a", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
          <BiSolidFileGif size={20} color="#fff" />
        </button>
      </div>

      <div style={{ position: "absolute", top: 20, right: 60 }}>
        <button onClick={handleLogSubmit} style={{
          background: "#fff", color: "#000", padding: "6px 14px",
          fontSize: "15px", borderRadius: "10px", fontWeight: "600",
          border: "none", cursor: "pointer",
        }}>
          {isEditMode ? "Update" : "Log"}
        </button>
      </div>

      {showGifModal && (
        <GifSearchModal onSelect={(url) => { setGifUrl(url); setUploadedImageFile(null); setShowGifModal(false); }}
          onClose={() => setShowGifModal(false)} />
      )}
    </div>
  );
}
