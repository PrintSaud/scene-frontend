import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/api";
import { backend } from "../config";
import toast from "react-hot-toast";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";  // replace BsHeart

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_COVER = "/default-list-cover.jpg";
const FALLBACK_POSTER = "https://via.placeholder.com/300x450?text=No+Poster";


export default function ListViewPage({ customPosters = {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [list, setList] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  

  useEffect(() => {
    const fetchList = async () => {
      try {
        const { data } = await axios.get(`${backend}/api/lists/${id}`);
        setList(data);
        if (user) {
          setIsLiked(data.likes?.includes(user._id));
          setIsSaved(data.savedBy?.includes(user._id));
        }
      } catch (err) {
        console.error("Failed to fetch list:", err);
      }
    };
    fetchList();
  }, [id]);

  const [externalCustomPosters, setExternalCustomPosters] = useState({});

useEffect(() => {
  const fetchList = async () => {
    try {
      const { data } = await axios.get(`${backend}/api/lists/${id}`);
      setList(data);
      if (user) {
        setIsLiked(data.likes?.includes(user._id));
        setIsSaved(data.savedBy?.includes(user._id));
      }

      // 🧠 Fetch custom posters for list creator
      const posterRes = await axios.get(`${backend}/api/posters/user/${data.user._id}`);
      const posterMap = {};
      posterRes.data.forEach(p => posterMap[p.movieId] = p.url);
      setExternalCustomPosters(posterMap);
    } catch (err) {
      console.error("Failed to fetch list or custom posters:", err);
    }
  };

  fetchList();
}, [id]);


  const isOwner = user && list?.user._id === user._id;

  const handleLike = async () => {
    try {
      await axios.post(`${backend}/api/lists/${id}/like`);
      setIsLiked(!isLiked);
      setList((prev) => ({
        ...prev,
        likes: isLiked
          ? prev.likes.filter((uid) => uid !== user._id)
          : [...prev.likes, user._id],
      }));
    } catch (err) {
      console.error("Failed to like list:", err);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post(`${backend}/api/lists/${id}/save`);
      setIsSaved(!isSaved);
      toast.success(isSaved ? "List unsaved!" : "List saved!");
    } catch (err) {
      console.error("Failed to toggle save:", err);
      toast.error("Something went wrong.");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this list?");
    if (!confirmDelete) return;
    try {
      await axios.delete(`${backend}/api/lists/${id}`);
      toast.success("List deleted!");
      navigate(`/profile/${user._id}`);
    } catch (err) {
      console.error("❌ Failed to delete list", err);
      toast.error("Failed to delete list.");
    }
  };
  
  const handleShare = () => {
    navigate(`/share/list/${id}`);
  };
  
  

  if (!list) {
    return <div style={{ color: "white", padding: "20px" }}>Loading...</div>;
  }

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", color: "white", paddingBottom: "80px" }}>
      {/* Cover */}
      {list.coverImage && (
        <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
          <img
            src={list.coverImage}
            alt="cover"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
  
          {/* 🔥 Fade-down overlay */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, #0e0e0e 100%)",
            zIndex: 1
          }} />
        </div>
      )}
  
  <div
  style={{
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    padding: "16px",
    background: list.coverImage ? "transparent" : "#0e0e0e",  // 🔥 This fixes the gray mismatch perfectly!
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>

          {/* 🔙 Back */}
          <button
            onClick={() => navigate(-1)}
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

          {/* ⋯ Options */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowOptions((prev) => !prev)}
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
                  right: "0",
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  padding: "12px 0",
                  width: "180px",
                  zIndex: 20,
                }}
              >
                {(isOwner
                  ? [
                      { label: "✏️ Edit List", onClick: () => navigate(`/list/${id}/edit`) },
                      { label: "📤 Share to Friend", onClick: handleShare },
                      { label: "🗑️ Delete List", onClick: handleDelete },
                    ]
                  : [
                      { label: "📤 Share to Friend", onClick: handleShare },
                      
                      { label: isSaved ? "✅ Saved" : "💾 Save List", onClick: handleSave },
                    ]
                ).map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setShowOptions(false);
                    }}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: "14.5px",
                      fontWeight: "500",
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
<div style={{
  padding: "12px 16px 0 16px",
  marginTop: list.coverImage ? "0px" : "40px"  // 🔥 Add clean spacing only when no cover image
}}>

        <h2 style={{
          marginBottom: "4px",
          fontSize: "18px",
          fontWeight: "600"
        }}>
          {list.title}
        </h2>

        {list.description && (
          <p style={{
            color: "#bbb",
            marginBottom: "12px",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            lineHeight: "1.4"
          }}>
            {list.description}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#aaa" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            onClick={() => navigate(`/profile/${list.user._id}`)}
          >
            <img
              src={list.user.avatar}
              alt="avatar"
              style={{ width: "28px", height: "28px", borderRadius: "50%" }}
            />
            <span style={{ fontFamily: "Inter, sans-serif" }}>@{list.user.username}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
  <span onClick={handleLike} style={{ cursor: "pointer", fontSize: "24px" }}>
    {isLiked ? <AiFillHeart style={{ color: "#B327F6" }} /> : <AiOutlineHeart />}
  </span>
  <span style={{ fontSize: "14px" }}>{list.likes?.length || 0}</span>
</div>
        </div>
      </div> 

{/* Movies grid */}
<div
  style={{
    padding: "12px 16px",
    marginTop: list.coverImage ? "0px" : "12px",  // 🔥 Only add margin if no image
    marginBottom: "24px",
  }}
>
<h3 style={{ marginTop: "8px", marginBottom: "12px" }}>
  🎬 {list.isRanked ? "Ranked Movies" : "Movies"}:
</h3>


  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: "12px",
    }}
  >
{list.movies.map((movie, index) => {
  const id = movie.id || movie._id;
  const posterUrl =
  movie.posterOverride ||  // ✅ use backend-prepared override first
  externalCustomPosters?.[id] ||
  customPosters?.[id] ||
  (movie.poster?.startsWith("/")
    ? `${TMDB_IMG}${movie.poster}`
    : movie.poster) ||
  FALLBACK_POSTER;




      return (
        <div
          key={movie.id}
          onClick={() => navigate(`/movie/${movie.id}`)}
          style={{ cursor: "pointer", textAlign: "center" }}
        >
          {posterUrl && (
            <img
              src={posterUrl}
              alt={movie.title}
              style={{
                width: "100%",
                aspectRatio: "2/3",  // 🔥 match Watchlist / Films tab perfectly
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "4px",
              }}
            />
          )}
          <div
            style={{
              fontSize: "12px",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              lineHeight: "1.2",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {list.isRanked ? `${index + 1}. ` : ""}
            {movie.title}
          </div>
        </div>
      );
    })}
  </div>
</div>
    </div>
  );
}
