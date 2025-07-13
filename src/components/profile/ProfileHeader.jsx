import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiDotsVertical } from "react-icons/hi";
import toast from "react-hot-toast";

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

        {/* Back button when not owner */}
        {!isOwner && (
          <button
            onClick={() => navigate(-1)}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              background: "#1a1a1a",
              color: "white",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #444",
              fontSize: "12px",
              zIndex: 2,
            }}
          >
            ← Back
          </button>
        )}

        {/* ⋯ Top Right Menu */}
        {isOwner && (
          <div style={{ position: "absolute", top: 20, right: 20 }}>
            <HiDotsVertical
              onClick={() => setMenuOpen((prev) => !prev)}
              style={{ fontSize: "20px", color: "white", cursor: "pointer" }}
            />
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "24px",
                  right: 0,
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "8px",
                  zIndex: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  width: "140px",
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

      {/* NAME + USERNAME + FOLLOW BUTTON (SAME ROW) */}
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

        {/* FOLLOW BUTTON */}
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
          <strong>{user.followingCount ?? 0}</strong>
          <div>Following</div>
        </div>

        <div onClick={() => navigate(`/profile/${user._id}/followers`)} style={{ cursor: "pointer", fontFamily: "Inter" }}>
          <strong>{user.followerCount ?? 0}</strong>
          <div>Followers</div>
        </div>

        <div
          onClick={() => {
            const event = new CustomEvent("navigateToFilms");
            window.dispatchEvent(event);
          }}
          style={{ cursor: "pointer", fontFamily: "Inter" }}
        >
          <strong>{user.totalLogs || 0}</strong>
          <div>Films</div>
        </div>
      </div>
    </>
  );
}

const menuItemStyle = {
  fontSize: "13px",
  padding: "6px 10px",
  background: "#1c1c1c",
  borderRadius: "5px",
  cursor: "pointer",
  color: "white",
  transition: "0.2s",
};
