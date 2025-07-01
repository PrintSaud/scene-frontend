import React from "react";
import { FaPen, FaShareAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ProfileHeader({ user, imgRef }) {
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;
  const backdropHeight = isMobile ? 180 : 300;

  return (
    <>
      {/* BACKDROP + AVATAR OVERLAP */}
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
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: "16px" }}>
          <FaPen
            style={iconStyle}
            onClick={() => navigate("/edit-profile")}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.8)}
          />
          <FaShareAlt
            style={iconStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.8)}
          />
        </div>

        {/* Avatar */}
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

      {/* Name + Username + Bio */}
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
        {(user.fullname || "CEO") && (
          <div style={{ fontWeight: "600", fontSize: "14px", fontFamily: "Inter", color: "white" }}>
            {user.fullname || "CEO"}
          </div>
        )}
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontFamily: "Inter" }}>
          @{user.username || "Saud"}
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
          <strong>{user.following}</strong>
          <div>Following</div>
        </div>
        <div
          onClick={() => navigate(`/profile/${user._id}/followers`)}
          style={{ cursor: "pointer" }}
        >
          <strong>{user.followers}</strong>
          <div>Followers</div>
        </div>
        <div
          onClick={() => {
            const event = new CustomEvent("navigateToFilms");
            window.dispatchEvent(event);
          }}
          style={{ cursor: "pointer" }}
        >
          <strong>{user.totalLogs}</strong>
          <div>Films</div>
        </div>
      </div>
    </>
  );
}

const iconStyle = {
  color: "#fff",
  fontSize: "18px",
  cursor: "pointer",
  transition: "0.2s",
  opacity: 0.8,
};
