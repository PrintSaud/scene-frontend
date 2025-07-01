import React, { useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaImage } from "react-icons/fa6";
import { BiSolidFileGif } from "react-icons/bi";
import GifSearchModal from "../GifSearchModal";
import axios from "axios";
import toast from "react-hot-toast";

export default function LogModal({ movie, onClose, refreshLogs }) {

  const [rating, setRating] = useState(0);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [review, setReview] = useState("");
  const [image, setImage] = useState(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [showGifModal, setShowGifModal] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const user = JSON.parse(localStorage.getItem("user")); // or from context if using
  const movieId = movie?.id || movie?._id;
  

  const handleLogSubmit = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const movieId = movie?.id || movie?._id;
  
      const formData = new FormData();
      formData.append("userId", user._id);
      formData.append("movieId", movieId);
      formData.append("review", review);
      formData.append("rating", rating.toString());
      formData.append("rewatch", rewatchCount.toString());
      formData.append("watchedAt", new Date().toISOString());
      formData.append("gif", gifUrl || "");
      formData.append("title", movie.title || "Untitled");
      formData.append("poster", movie.poster || `https://image.tmdb.org/t/p/w500${movie.poster_path}`);
  
      if (uploadedImageFile) {
        formData.append("image", uploadedImageFile);
      }
  
      await axios.post(`${import.meta.env.VITE_BACKEND}/api/logs/full`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      toast.success("🎬 Log submitted!");
      onClose();
      refreshLogs?.(); // ✅ refresh logs on close      
    } catch (err) {
      console.error(err);
      toast.error("Failed to log this movie.");
    }
  };
  


  const handleStarClick = (index, isHalf) => {
    const newRating = isHalf ? index + 0.5 : index + 1;
    setRating(newRating);
  };

  

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImageFile(file);
    }
  };
  

  return (
    <div
      style={{
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
      }}
    >
      {/* 🔙 Back */}
      <button
        onClick={onClose}
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

      {/* 🎞️ Poster + Title + Stars */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <img
          src={
            movie?.poster_path
              ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
              : movie?.poster || "/default-poster.png"
          }
          alt={movie?.title}
          style={{
            width: "150px",
            height: "240px",
            objectFit: "cover",
            borderRadius: "10px",
          }}
        />
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "Inter" }}>
            {movie?.title}
          </h2>

          {/* ⭐ Rating */}
          <div style={{ display: "flex", gap: "3px", marginTop: "6px", fontSize: "28px", position: "relative" }}>
            {[...Array(5)].map((_, i) => {
              const isFull = i + 1 <= rating;
              const isHalf = rating >= i + 0.5 && rating < i + 1;
              return (
                <div key={i} style={{ position: "relative", cursor: "pointer" }}>
                  <div
                    onClick={() => handleStarClick(i, true)}
                    style={{ position: "absolute", left: 0, width: "50%", height: "100%", zIndex: 2 }}
                  />
                  <div
                    onClick={() => handleStarClick(i, false)}
                    style={{ position: "absolute", right: 0, width: "50%", height: "100%", zIndex: 2 }}
                  />
                  {isFull ? (
                    <FaStar style={{ color: "#B327F6" }} />
                  ) : isHalf ? (
                    <FaStarHalfAlt style={{ color: "#B327F6" }} />
                  ) : (
                    <FaRegStar style={{ color: "#777" }} />
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: "4px", fontSize: "12px", color: "#aaa", fontFamily: "Inter" }}>
            {rating > 0 ? `${rating.toFixed(1)} / 5` : `No rating yet`}
          </p>

          {/* 🔄 Rewatch */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", cursor: "pointer", color: "#aaa" }}
            onClick={() => setRewatchCount((prev) => prev + 1)}
          >
            <HiOutlineRefresh size={18} />
            <span style={{ fontSize: "13px" }}>
              {rewatchCount > 0 ? `Rewatched ${rewatchCount}x` : "Mark as Rewatch"}
            </span>
          </div>
        </div>
      </div>

      {/* 📝 Review + Media */}
      <div
        style={{
          width: "86%",
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "12px",
          color: "#fff",
          fontFamily: "Inter",
          position: "relative",
          minHeight: "120px",
        }}
      >
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
            minHeight: gifUrl || image ? "60px" : "100px",
            outline: "none",
          }}
        />

        {(image || gifUrl) && (
          <div style={{ marginTop: "8px", position: "relative" }}>
            <img
              src={image || gifUrl}
              alt="preview"
              style={{
                maxWidth: "100%",
                maxHeight: "160px",
                borderRadius: "8px",
                objectFit: "contain",
              }}
            />
            <button
              onClick={() => {
                setImage(null);
                setGifUrl(null);
              }}
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                background: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 📎 Upload Buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        {/* Image Upload */}
        <label
          style={{
            background: "#1a1a1a",
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          <FaImage size={20} color="#fff" />
        </label>

        {/* GIF Search */}
        <button
          onClick={() => setShowGifModal(true)}
          style={{
            background: "#1a1a1a",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BiSolidFileGif size={20} color="#fff" />
        </button>
      </div>

{/* ✅ Submit Button */}
<div style={{ position: "absolute", top: 20, right: 60 }}>
  <button
    onClick={handleLogSubmit}
    style={{
      background: "#fff",
      color: "#000",
      padding: "6px 14px",
      fontSize: "15px",
      borderRadius: "10px",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
    }}
  >
    Log
  </button>
</div>


      {/* 🟣 Gif Modal */}
      {showGifModal && (
        <GifSearchModal
          onSelect={(url) => {
            setGifUrl(url);
            setImage(null);
            setShowGifModal(false);
          }}
          onClose={() => setShowGifModal(false)}
        />
      )}
    </div>
  );
}
