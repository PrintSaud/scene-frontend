import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/api";
import toast from "react-hot-toast";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import useTranslate from "../utils/useTranslate";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "https://via.placeholder.com/300x450?text=No+Poster";

export default function ListViewPage({ customPosters = {} }) {
  const t = useTranslate();
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const [list, setList] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [externalCustomPosters, setExternalCustomPosters] = useState({}); // viewer's own posters
  const [animatingLikes, setAnimatingLikes] = useState([]);



  const isOwner = user && list?.user?._id === user?._id;

  useEffect(() => {
    const fetchList = async () => {
      try {
        const { data } = await axios.get(`/api/lists/${id}`);
        setList(data);

        if (user?._id) {
          setIsLiked(Boolean(data.likes?.includes(user._id)));
          setIsSaved(Boolean(data.savedBy?.includes(user._id)));

          // Fetch viewer’s custom posters (if logged in)
          try {
            const posterRes = await axios.get(`/api/posters/user/${user._id}`);
            const posterMap = {};
            (posterRes.data || []).forEach((p) => {
              posterMap[String(p.movieId)] = p.url;
            });
            setExternalCustomPosters(posterMap);
          } catch (e) {
            // non-fatal
            console.warn("Custom posters fetch failed:", e);
          }
        }
      } catch (err) {
        console.error("Failed to fetch list:", err);
      }
    };

    fetchList();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLike = async () => {
    if (!user?._id) return toast.error(t("You must be logged in."));
    try {
      await axios.post(`/api/lists/${id}/like`);
  
      // 🚀 Trigger animation
      setAnimatingLikes((prev) => [...prev, id]);
      setTimeout(() => {
        setAnimatingLikes((prev) => prev.filter((x) => x !== id));
      }, 400);
  
      setIsLiked((prev) => {
        const next = !prev;
        setList((prevList) => {
          if (!prevList) return prevList;
          const likes = prevList.likes || [];
          return {
            ...prevList,
            likes: next
              ? [...likes, user._id]
              : likes.filter((uid) => uid !== user._id),
          };
        });
        return next;
      });
    } catch (err) {
      console.error("Failed to like list:", err);
      toast.error(t("Something went wrong."));
    }
  };
  
  

  const handleSave = async () => {
    if (!user?._id) return toast.error(t("You must be logged in."));
    try {
      await axios.post(`/api/lists/${id}/save`);
      const next = !isSaved;
      setIsSaved(next);
      toast.success(next ? t("List saved!") : t("List unsaved!"));
    } catch (err) {
      console.error("Failed to toggle save:", err);
      toast.error(t("Something went wrong."));
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("⚠️ " + t("Are you sure you want to delete this list?"));
    if (!confirmDelete) return;
    try {
      await axios.delete(`/api/lists/${id}`);
      toast.success(t("List deleted!"));
      navigate(`/profile/${user?._id || ""}`);
    } catch (err) {
      console.error("❌ Failed to delete list", err);
      toast.error(t("Failed to delete list."));
    }
  };

  const handleShare = () => navigate(`/share/list/${id}`);

  if (!list) {
    return <div style={{ color: "white", padding: "20px" }}>{t("Loading...")}</div>;
  }

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", color: "white", paddingBottom: "80px" }}>
      {list.coverImage && (
        <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
          <img
            src={list.coverImage}
            alt="cover"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_POSTER;
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "100px",
              background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, #0e0e0e 100%)",
              zIndex: 1,
            }}
          />
        </div>
      )}

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px",
          background: list.coverImage ? "transparent" : "#0e0e0e",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label={t("Back")}
          title={t("Back")}
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ←
        </button>

        {/* Options */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            aria-label={t("More options")}
            title={t("More options")}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              color: "#fff",
              fontSize: "22px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ⋯
          </button>

          {showOptions && (
            <div
              style={{
                position: "absolute",
                top: "38px",
                right: 0,
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                padding: "12px 0",
                width: "200px",
                zIndex: 20,
              }}
            >
              {(isOwner
                ? [
                    { label: "✏️ " + t("Edit List"), onClick: () => navigate(`/list/${id}/edit`) },
                    { label: "📤 " + t("Share to Friends"), onClick: handleShare },
                    { label: "🗑️ " + t("Delete List"), onClick: handleDelete },
                  ]
                : [
                    { label: "📤 " + t("Share to Friends"), onClick: handleShare },
                    { label: isSaved ? "✅ " + t("Saved") : "💾 " + t("Save List"), onClick: handleSave },
                  ]
              ).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    item.onClick();
                    setShowOptions(false);
                  }}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "14.5px",
                    fontWeight: 500,
                    color: "#fff",
                    fontFamily: "Inter",
                    transition: "0.2s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
<div style={{ padding: "12px 16px 0 16px", marginTop: list.coverImage ? "0px" : "40px" }}>
  <h2 style={{ marginBottom: 4, fontSize: 18, fontWeight: 600 }}>{list.title}</h2>
  {list.description && (
    <p
      style={{
        color: "#bbb",
        marginBottom: 12,
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
        lineHeight: 1.4,
      }}
    >
      {list.description}
    </p>
  )}

  <div style={{ display: "flex", alignItems: "center", fontSize: 14, color: "#aaa" }}>
    {/* 👤 User info (left side) */}
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
      onClick={() => navigate(`/profile/${list.user._id}`)}
    >
      <img
        src={list.user.avatar || "/default-avatar.jpg"}
        alt="avatar"
        style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/default-avatar.jpg";
        }}
      />
      <span style={{ fontFamily: "Inter, sans-serif" }}>@{list.user.username}</span>
    </div>

    {/* ❤️ Like button (far right) */}
    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
    <span
  onClick={handleLike}
  style={{
    cursor: "pointer",
    fontSize: 24,
    display: "flex",
    alignItems: "center",
    transition: "transform 0.25s ease, color 0.05s ease",
    transform: animatingLikes.includes(id) ? "scale(1.4)" : "scale(1)",
  }}
>
  {isLiked ? (
    <AiFillHeart style={{ color: "#B327F6", transition: "color 0.25s ease" }} />
  ) : (
    <AiOutlineHeart style={{ color: "#888" }} />
  )}
</span>
<span style={{ fontSize: 14 }}>{list.likes?.length || 0}</span>

    </div>
  </div>
</div>


      {/* Movie Grid */}
      <div style={{ padding: "12px 16px", marginTop: list.coverImage ? "0px" : "12px", marginBottom: 24 }}>
        <h3 style={{ marginTop: 8, marginBottom: 12 }}>
          🎬 {list.isRanked ? t("Ranked Movies") : t("Movies")}:
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 12,
          }}
        >
          {list.movies.map((movie, index) => {
            const movieId = String(movie.id ?? movie.tmdbId ?? movie._id ?? "");
            const posterUrl =
              externalCustomPosters[movieId] || // viewer’s own custom poster, if any
              movie.posterOverride ||
              (typeof movie.poster === "string" && movie.poster.startsWith("/")
                ? `${TMDB_IMG}${movie.poster}`
                : movie.poster) ||
              customPosters[movieId] || // optional prop-based map
              FALLBACK_POSTER;

            return (
              <div
                key={movie.id || index}
                onClick={() => navigate(`/movie/${movie.id}`)}
                style={{ cursor: "pointer", textAlign: "center" }}
              >
                <img
                  src={posterUrl}
                  alt={movie.title || t("Untitled")}
                  style={{
                    width: "100%",
                    aspectRatio: "2/3",
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_POSTER;
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {list.isRanked ? `${index + 1}. ` : ""}
                  {movie.title || t("Untitled")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
