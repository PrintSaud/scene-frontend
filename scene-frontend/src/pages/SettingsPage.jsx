// src/pages/SettingsPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";
import useTranslate from "../utils/useTranslate";
import { SiX } from "react-icons/si";        // ✅ correct for Twitter/X
import { FaInstagram } from "react-icons/fa"; // ✅ correct for Instagram
import { useLanguage } from "../context/LanguageContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const { language, setLanguage } = useLanguage(); // ⬅️ use global contex
  const t = useTranslate();


  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success(t("Logged out!"));
    navigate("/login");
  };


  const saveLanguage = async (newLang) => {
    try {
      // update global context → triggers re-render everywhere
      setLanguage(newLang);
  
      const token = user?.token;
      if (token) {
        await api.patch(
          `/api/users/${user._id}/language`,
          { language: newLang },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
  
      const updatedUser = { ...user, language: newLang };
      localStorage.setItem("user", JSON.stringify(updatedUser));
  
      toast.success("🌐 " + t("Language updated!"));
    } catch (err) {
      console.error("❌ Language update failed", err);
      toast.error(t("Failed to update language"));
    }
  };
  

  function handleDeleteAccount() {
    if (!window.confirm("⚠️ " + t("Are you sure? This cannot be undone.")))
      return;

    const token = user?.token;
    if (!token) {
      toast.error(t("You must be logged in to delete your account."));
      return;
    }

    api
      .delete("/api/auth/account", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        toast.success(t("Account deleted."));
        localStorage.removeItem("user");
        window.location.href = "/signup";
      })
      .catch((err) => {
        console.error("❌ Delete error:", err);
        toast.error(t("Failed to delete account."));
      });
  }

  return (
    <div
      style={{
        padding: "20px",
        minHeight: "100vh",
        background: "#0e0e0e",
        color: "#fff",
        fontFamily: "Inter",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
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
          marginBottom: "20px",
        }}
      >
        ←
      </button>

      <div style={{ flex: 1 }}>
        {/* ⚙️ Account Section */}
        <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>
          {t("Account")}
        </h2>

        <div style={rowStyle}>
          <button onClick={handleLogout} style={btnStyle}>
            🚪 {t("Log Out")}
          </button>
        </div>

        <div style={rowStyle}>
          <label style={{ flex: 1 }}>🌐 {t("Change Language")}</label>
          <select
            value={language}
            onChange={(e) => saveLanguage(e.target.value)}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "13px",
            }}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <div style={rowStyle}>
          <button
            onClick={handleDeleteAccount}
            style={{ ...btnStyle, background: "#b91c1c" }}
          >
            🗑️ {t("Delete Account")}
          </button>
        </div>

        {/* 📧 App Info */}
        <h2 style={{ fontSize: "20px", margin: "28px 0 16px" }}>
          {t("App Info")}
        </h2>

        <div style={rowStyle}>
          <p>
            📧 {t("Contact Us")}:{" "}
            <a href="mailto:support@scenesa.com" style={{ color: "#a855f7" }}>
              scenewebapp@gmail.com
            </a>
          </p>
        </div>
        <div style={rowStyle}>
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <SiX color="#1DA1F2" /> :{" "}
            <a
              href="https://twitter.com/JoinSceneApp"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#a855f7" }}
            >
              @JoinSceneApp
            </a>
          </p>
        </div>
        <div style={rowStyle}>
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaInstagram color="#E1306C" />:{" "}
            <a
              href="https://instagram.com/JoinScene"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#a855f7" }}
            >
              @JoinScene
            </a>
          </p>
        </div>
      </div>

{/* 🎬 Footer above navbar */}
<footer
  style={{
    textAlign: "center",
    marginTop: "20px",
    fontSize: "12px",
    color: "#888",
    marginBottom: "99px", // ⬆️ was 60px, now sits a bit higher
  }}
>
  🎬 Scene — {t("Built with ❤️ in Saudi Arabia")}
  <br />© {new Date().getFullYear()} Scene. {t("All rights reserved.")}.
</footer>

    </div>
  );
}

const rowStyle = {
  background: "#1a1a1a",
  padding: "12px",
  borderRadius: "10px",
  marginBottom: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const btnStyle = {
  background: "#a855f7",
  border: "none",
  borderRadius: "6px",
  padding: "10px 16px",
  fontSize: "14px",
  color: "#fff",
  cursor: "pointer",
};
