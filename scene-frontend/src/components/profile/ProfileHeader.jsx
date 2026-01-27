// src/components/ProfileHeader.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useTranslate from "../../utils/useTranslate";



export default function ProfileHeader({
  user,
  imgRef,
  logs,
  isOwner,
  isFollowing,
  handleFollow,
  handleRemoveFollower,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslate(); // ✅ translation hook

  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;
  const backdropHeight = isMobile ? 180 : 300;

  // Me (logged-in user)
  const me = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const onShare = () => {
    try {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${user._id}`);
      toast.success(t("🔗 Profile link copied!"));
    } catch {
      toast.error(t("Couldn’t copy link"));
    }
    setMenuOpen(false);
  };

  // ✅ new: they follow me if their `following` contains my id
  const idEq = (a, b) => String(a) === String(b);
  const canRemoveFollower = (user.following || []).some((id) => idEq(id, me?._id));

  const onRemoveFollower = () => {
    if (!handleRemoveFollower) {
      toast.error(t("Remove follower isn’t wired yet"));
      return;
    }
    handleRemoveFollower(user._id);
    setMenuOpen(false);
  };

  // Menu items
  const items = isOwner
    ? [
        {
          label: `✏️ ${t("Edit Profile")}`,
          onClick: () => {
            setMenuOpen(false);
            navigate("/edit-profile");
          },
        },
        { label: `📤 ${t("Share")}`, onClick: onShare },
        {
          label: `⚙️ ${t("Settings")}`,
          onClick: () => {
            setMenuOpen(false);
            navigate("/settings");
          },
        },
      ]
    : [
        { label: `📤 ${t("Share")}`, onClick: onShare },
        ...(canRemoveFollower
          ? [{ label: `❌ ${t("Remove Follower")}`, onClick: onRemoveFollower }]
          : []),
      ];

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
          overflow: "visible",
        }}
      >
        <img
          ref={imgRef}
          src={user.profileBackdrop || "/default-backdrop.jpg"}
          alt="hidden"
          style={{ display: "none" }}
          onError={(e) => {
            e.currentTarget.src = "/default-backdrop.jpg";
          }}
        />

        {/* 🔙 Back Button for non-owners */}
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
              zIndex: 2,
            }}
          >
            ←
          </button>
        )}

        {/* ⋯ Options */}
        <div style={{ position: "absolute", top: 12, right: 16 }}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
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
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            ⋯
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "30px",
                right: "0",
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                padding: "12px 0",
                width: "190px",
                zIndex: 10000,
              }}
            >
              {items.map((item, i) => (
                <div
                  key={i}
                  role="menuitem"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick?.();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      item.onClick?.();
                    }
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

        {/* FOLLOW BUTTON */}
        {!isOwner && (
  <button
    onClick={() => handleFollow(user._id)}
    style={{
      background: isFollowing ? "#333" : "#1a1a1a",
      color: "white",
      border: "1px solid #555",
      borderRadius: "6px",
      padding: "4px 12px",
      fontSize: "12px",
      cursor: "pointer",
      height: "28px",
      marginTop: "-8px",
    }}
  >
    {isFollowing ? t("Following") : t("Follow")}
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
          alignItems: "center",
          gap: "28px",
          fontSize: "14px",
          marginTop: "12px",
          marginBottom: "12px",
          opacity: 0.9,
          textAlign: "center",
          fontFamily: "Inter",
          position: "relative",
          left: "-13px",
        }}
      >
        <div onClick={() => navigate(`/profile/${user._id}/following`)} style={{ cursor: "pointer" }}>
          <strong>{user.following?.length || 0}</strong>
          <div>{t("Following")}</div>
        </div>

        <div onClick={() => navigate(`/profile/${user._id}/followers`)} style={{ cursor: "pointer" }}>
          <strong>{user.followers?.length || 0}</strong>
          <div>{t("Followers")}</div>
        </div>

        <div
          onClick={() => {
            const event = new CustomEvent("navigateToFilms");
            window.dispatchEvent(event);
          }}
          style={{ cursor: "pointer" }}
        >
          <strong>{logs.length || 0}</strong>
          <div>{t("Films")}</div>
        </div>
      </div>
    </>
  );
}
