import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiDotsVertical } from "react-icons/hi";
import toast from "react-hot-toast";

export default function ProfileHeader({ user, imgRef }) {
  const navigate = useNavigate();
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner = stored?._id === user?._id;

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
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), #0e0e0e), url(${user.profileBackdrop})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        <img
          ref={imgRef}
          src={user.profileBackdrop}
          alt="hidden"
          style={{ display: "none" }}
          onError={(e) => {
            e.currentTarget.src = "/default-backdrop.jpg";
          }}
        />

        {/* Top Right Buttons */}
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
                <div
                  onClick={() => navigate("/edit-profile")}
                  style={menuItemStyle}
                >
                  ✏️ Edit Profile
                </div>
                <div onClick={handleShare} style={menuItemStyle}>
                  📤 Share
                </div>
                <div onClick={handleLogout} style={menuItemStyle}>
                  🚪 Log Out
                </div>
              </div>
            )}
          </div>
        )}

        {/* AVATAR */}
        <div
          style={{
            position: "absolute",
            left: "16px",
            bottom: "-10px",
            zIndex: 2,
          }}
        >
          <img
            src={user.avatar}
            alt="Avatar"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid #0e0e0e",
            }}
          />
        </div>
      </div>

      {/* NAME + USERNAME */}
      <div
        style={{
          marginTop: "8px",
          marginLeft: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "4px",
        }}
      >
        {user.name && (
          <div style={{ fontWeight: "600", fontSize: "14px", fontFamily: "Inter", color: "white" }}>
            {user.name}
          </div>
        )}
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontFamily: "Inter" }}>
          @{user.username}
        </div>

        {user.bio && (
          <div style={{ color: "#aaa", fontSize: "13px", maxWidth: "300px", marginTop: "4px" }}>
            {user.bio}
          </div>
        )}
      </div>

      {/* STATS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          fontSize: "14px",
          marginTop: "28px",
          marginBottom: "8px",
          opacity: 0.9,
          textAlign: "center",
          padding: "0px 7px 5px",
        }}
      >
        <div
          onClick={() => navigate(`/profile/${user._id}/following`)}
          style={{ cursor: "pointer" }}
        >
          <strong>{user.following ?? 0}</strong>
          <div>Following</div>
        </div>
        <div
          onClick={() => navigate(`/profile/${user._id}/followers`)}
          style={{ cursor: "pointer" }}
        >
          <strong>{user.followers ?? 0}</strong>
          <div>Followers</div>
        </div>
        <div
          onClick={() => {
            const event = new CustomEvent("navigateToFilms");
            window.dispatchEvent(event);
          }}
          style={{ cursor: "pointer" }}
        >
          <strong>{user.totalLogs ?? 0}</strong>
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
