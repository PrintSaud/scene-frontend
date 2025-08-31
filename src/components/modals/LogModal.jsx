import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaImage } from "react-icons/fa6";
import { BiSolidFileGif } from "react-icons/bi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import GifSearchModal from "../GifSearchModal";
import toast from "react-hot-toast";
import { backend } from "../../config";
import api from "../../api/api";
import useTranslate from "../../utils/useTranslate";

export default function LogModal({ movie, onClose, refreshLogs, editLogId }) {
  const { logId: logIdParam } = useParams();
  const logId = editLogId || logIdParam;
  const navigate = useNavigate();
  const t = useTranslate();

  const [isEditMode, setIsEditMode] = useState(false);
  const [rating, setRating] = useState(0);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [review, setReview] = useState("");
  const [gifUrl, setGifUrl] = useState(null);
  const [animatingFav, setAnimatingFav] = useState(false);

  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [showGifModal, setShowGifModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [movieId, setMovieId] = useState(movie?.id || movie?._id);
  const [movieData, setMovieData] = useState(movie || null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (logId) {
      setIsEditMode(true);
      api.get(`/api/logs/${logId}`).then(async ({ data }) => {
        setRating(data.rating || 0);
        setReview(data.review || "");
        setRewatchCount(data.rewatchCount || 0);
        setGifUrl(data.gif || null);
        setUploadedImageFile(null);
        setMovieId(data.movie?.id || data.movie?._id);
        setMovieData(data.movie);

        if (user && movieId) {
          try {
            const favRes = await api.get(`/api/users/${user._id}/favorites`);
            const favIds = favRes.data.favorites.map((m) => m.id || m);
            setIsFavorite(favIds.includes(Number(data.movie?.id || data.movie?._id)));
          } catch {
            console.warn("⚠️ Failed to check favorite status");
          }
        }
      });
    }
  }, [logId]);

  const handleLogSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("movieId", movieId);
      formData.append("review", review);
      formData.append("rating", rating.toString());
      formData.append("rewatch", rewatchCount > 0 ? "true" : "false");
      formData.append("rewatchCount", rewatchCount.toString());
      formData.append("watchedAt", new Date().toISOString());
      formData.append("gif", gifUrl || "");
      formData.append("title", movieData?.title || "Untitled");
      formData.append(
        "poster",
        movieData?.posterOverride ||
          movieData?.poster ||
          `https://image.tmdb.org/t/p/w500${movieData?.poster_path}`
      );
      formData.append("backdrop", movieData?.backdrop_path || "");
      if (uploadedImageFile) {
        formData.append("image", uploadedImageFile);
      }

      if (isEditMode) {
        await api.patch(`${backend}/api/logs/${logId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(t("log_updated"));
      } else {
        const { data } = await api.post(`${backend}/api/logs/full`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        await api.delete(`/api/watchlist/${user._id}/watchlist/${movieId}`);
        toast.success(t("log_submitted"));

        const hasReviewContent = !!(review.trim() || gifUrl || uploadedImageFile);
        if (hasReviewContent && data?.log?._id) {
          navigate(`/review/${data.log._id}`);
        } else {
          navigate(`/movie/${movieId}`);
        }
      }

      if (isFavorite && user) {
        await api.post(`/api/users/${user._id}/favorites/${movieId}`);
      }

      onClose();
      refreshLogs?.();
    } catch (err) {
      console.error("❌ Log submit failed:", err);
      toast.error(t("log_failed"));
    }
  };

  const handleStarClick = (index, isHalf) => {
    setRating(isHalf ? index + 0.5 : index + 1);
  };

  const [customPoster, setCustomPoster] = useState(null);

useEffect(() => {
  const fetchPoster = async () => {
    try {
      if (!movieId || !user?._id) return;
      const res = await api.get(`/api/posters/${movieId}?userId=${user._id}`);
      if (res.data?.posterOverride) {
        setCustomPoster(res.data.posterOverride);
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch custom poster", err);
    }
  };
  fetchPoster();
}, [movieId, user?._id]);


  return (
    <div style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, width: "100vw", height: "100vh", backgroundColor: "#0e0e0e", color: "#fff", overflowY: "auto", padding: "20px 20px 40px" }}>
      <button
        onClick={() => (onClose ? onClose() : window.history.back())}
        style={{ background: "none", border: "none", color: "#fff", fontSize: "24px", marginBottom: "20px", cursor: "pointer" }}
      >
        <IoArrowBack />
      </button>

      {/* Poster + Title + Stars */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", }}>
      <img
  src={
    customPoster ||
    (movieData?.poster && movieData.poster.startsWith("http")
      ? movieData.poster
      : movieData?.poster_path
      ? `https://image.tmdb.org/t/p/w300${movieData.poster_path}`
      : "/default-poster.png")
  }
  alt={movieData?.title}
  style={{ width: "150px", height: "240px", objectFit: "cover", borderRadius: "10px" }}
/>



        <div>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", fontFamily: "Inter" }}>
            {movieData?.title}
          </h2>

          {/* Stars */}
          <div style={{ display: "flex", gap: "3px", marginTop: "6px", fontSize: "28px" }}>
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
            {rating > 0 ? `${rating.toFixed(1)} / 5` : t("no_rating_yet")}
          </p>

          {/* Favorite */}
          <div
  onClick={() => {
    setIsFavorite((prev) => !prev);
    setAnimatingFav(true);
    setTimeout(() => setAnimatingFav(false), 300);
  }}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "6px",
    cursor: "pointer",
    color: "#aaa",
  }}
>
  {isFavorite ? (
    <AiFillHeart
      style={{
        color: "#B327F6",
        fontSize: "20px",
        transition: "transform 0.3s ease, color 0.3s ease",
        transform: animatingFav ? "scale(1.4)" : "scale(1)",
      }}
    />
  ) : (
    <AiOutlineHeart
      style={{
        color: "#777",
        fontSize: "20px",
        transition: "transform 0.3s ease, color 0.3s ease",
        transform: animatingFav ? "scale(1.4)" : "scale(1)",
      }}
    />
  )}
  <span style={{ fontSize: "13px" }}>
    {isFavorite ? t("marked_as_favorite") : t("mark_as_favorite")}
  </span>
</div>



          {/* Rewatch */}
          <div onClick={() => setRewatchCount((prev) => prev + 1)} style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", cursor: "pointer", color: "#aaa" }}>
            <HiOutlineRefresh size={18} />
            <span style={{ fontSize: "13px" }}>
              {rewatchCount > 0 ? `${rewatchCount}x` : t("mark_as_rewatch")}
            </span>
          </div>
        </div>
      </div>

      {/* Review */}
      <div style={{ width: "86%", background: "#1a1a1a", borderRadius: "12px", padding: "12px", fontFamily: "Inter", minHeight: "120px" }}>
        <textarea
          placeholder={t("write_your_thoughts")}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          style={{ width: "100%", background: "transparent", border: "none", resize: "none", color: "#fff", fontSize: "14px", minHeight: gifUrl || uploadedImageFile ? "60px" : "100px", outline: "none" }}
        />
        {(uploadedImageFile || gifUrl) && (
          <div style={{ marginTop: "8px", position: "relative" }}>
            <img src={uploadedImageFile ? URL.createObjectURL(uploadedImageFile) : gifUrl} alt="preview" style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "8px", objectFit: "contain" }} />
            <button onClick={() => { setUploadedImageFile(null); setGifUrl(null); }} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#000", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", fontSize: "14px", cursor: "pointer" }}>✕</button>
          </div>
        )}
      </div>

      {/* Upload */}
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <label style={{ background: "#1a1a1a", padding: "12px", borderRadius: "8px", cursor: "pointer" }}>
          <input type="file" accept="image/*" onChange={(e) => setUploadedImageFile(e.target.files[0])} style={{ display: "none" }} />
          <FaImage size={20} color="#fff" />
        </label>
        <button onClick={() => setShowGifModal(true)} style={{ background: "#1a1a1a", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
          <BiSolidFileGif size={20} color="#fff" />
        </button>
      </div>

      {/* Submit */}
      <div style={{ position: "absolute", top: 20, right: 60 }}>
        <button onClick={handleLogSubmit} style={{ background: "#fff", color: "#000", padding: "6px 14px", fontSize: "15px", borderRadius: "10px", fontWeight: "600", border: "none", cursor: "pointer" }}>
          {isEditMode ? t("update") : t("log")}
        </button>
      </div>

      {showGifModal && <GifSearchModal onSelect={(url) => { setGifUrl(url); setUploadedImageFile(null); setShowGifModal(false); }} onClose={() => setShowGifModal(false)} />}
    </div>
  );
}
