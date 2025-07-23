import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiDotsVertical } from "react-icons/hi";
import toast from "react-hot-toast";

const menuItemStyle = {
  fontSize: "13px",
  padding: "6px 10px",
  background: "#1c1c1c",
  borderRadius: "5px",
  cursor: "pointer",
  color: "white",
  transition: "0.2s",
};


export default function ProfileHeader({
  user,
  imgRef,
  isOwner,
  isFollowing,
  handleFollow,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth <= 768;
  const backdropHeight = isMobile ? 180 : 300;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out!");
    window.location.href = "/login";
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${user._id}`);
    toast.success("🔗 Profile link copied!");
    setMenuOpen(false);
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: `${backdropHeight}px`,
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), #0e0e0e), url(${user.profileBackdrop || "/default-backdrop.jpg"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        {/* Hidden img for ColorThief */}
        <img
          ref={imgRef}
          src={user.profileBackdrop || "/default-backdrop.jpg"}
          alt="hidden"
          style={{ display: "none" }}
          onError={(e) => {
            e.currentTarget.src = "/default-backdrop.jpg";
          }}
        />

        {/* 🔙 Back Button for non-owners (like MoviePage style) */}
{!isOwner && (
  <button
    onClick={() => navigate(-1)}
    style={{
      position: "absolute",
      top: "16px",
      left: "16px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: "999px",
      width: "36px",
      height: "36px",
      color: "#fff",
      fontSize: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      backdropFilter: "blur(6px)",
      zIndex: 2
    }}
  >
    ←
  </button>
)}

{/* ⋯ Top Right Menu for owner (cleaner look) */}
{isOwner && (
  <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10 }}>
    <button
      onClick={() => setMenuOpen((prev) => !prev)}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "999px",
        width: "36px",
        height: "36px",
        color: "#fff",
        fontSize: "20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      ⋯
    </button>

    {menuOpen && (
      <div
        style={{
          position: "absolute",
          top: "42px",
          right: 0,
          background: "#111",
          border: "1px solid #2f2f2f",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          padding: "8px 0",
          width: "160px",
        }}
      >
        <div onClick={() => navigate("/edit-profile")} style={menuItemStyle}>✏️ Edit Profile</div>
        <div onClick={handleShare} style={menuItemStyle}>📤 Share</div>
        <div onClick={handleLogout} style={menuItemStyle}>🚪 Log Out</div>
      </div>
    )}
  </div>
)}


        {/* AVATAR */}
        <div style={{ position: "absolute", left: "16px", bottom: "0px", zIndex: 2 }}>
          <img
            src={user.avatar || "/default-avatar.jpg"}
            alt="Avatar"
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #0e0e0e",
            }}
            onError={(e) => {
              e.currentTarget.src = "/default-avatar.jpg";
            }}
          />
        </div>
      </div>

      {/* NAME + USERNAME + FOLLOW BUTTON */}
      <div
        style={{
          marginTop: "8px",
          marginLeft: "16px",
          marginRight: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          {user.name && (
            <div style={{ fontWeight: "600", fontSize: "14px", fontFamily: "Inter", color: "white" }}>
              {user.name}
            </div>
          )}
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontFamily: "Inter" }}>
            @{user.username}
          </div>
        </div>

        {/* FOLLOW BUTTON with upward adjustment */}
        {!isOwner && (
          <button
            onClick={handleFollow}
            style={{
              background: isFollowing ? "#333" : "#1a1a1a",
              color: "white",
              border: "1px solid #555",
              borderRadius: "6px",
              padding: "4px 12px",
              fontSize: "12px",
              cursor: "pointer",
              height: "28px",
              marginTop: "-8px"  // ⬅️ slightly higher than before
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* BIO */}
      {user.bio && (
        <div
          style={{
            marginLeft: "16px",
            marginTop: "4px",
            color: "#aaa",
            fontSize: "13px",
            fontFamily: "Inter, sans-serif",
            lineHeight: "1.4",
          }}
        >
          {user.bio}
        </div>
      )}

      {/* STATS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          fontSize: "14px",
          marginTop: "20px",
          marginBottom: "8px",
          opacity: 0.9,
          textAlign: "center",
          padding: "0px 7px 5px",
        }}
      >
        <div onClick={() => navigate(`/profile/${user._id}/following`)} style={{ cursor: "pointer", fontFamily: "Inter" }}>
          <strong>{user.following?.length || 0}</strong>

          <div>Following</div>
        </div>

        <div onClick={() => navigate(`/profile/${user._id}/followers`)} style={{ cursor: "pointer", fontFamily: "Inter" }}>
        <strong>{user.followers?.length || 0}</strong>
          <div>Followers</div>
        </div>

        <div
          onClick={() => {
            const event = new CustomEvent("navigateToFilms");
            window.dispatchEvent(event);
          }}
          style={{ cursor: "pointer", fontFamily: "Inter" }}
        >
          <strong>{logs.length || 0}</strong>
          <div>Films</div>
        </div>
      </div>
    </>
  );
}


