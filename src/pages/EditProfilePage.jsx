import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import MovieListSortable from "../components/lists/MovieListSortable";
import { backend } from "../config";
import toast from "react-hot-toast";
import { getPlatformIcon } from "../utils/getPlatformIcon.jsx";


import ReactModal from "react-modal";
import { BLOCKED_MOVIE_IDS } from "../utils/blockedMovies";
import BackdropSearchModalV2 from "../components/BackdropSearchModalV2";

ReactModal.setAppElement("#root");

const inputStyle = {
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "6px",
  padding: "10px",
  color: "#fff",
  fontSize: "14px",
};

const btnStyle = {
  background: "none",
  border: "1px solid #444",
  color: "#aaa",
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "13px",
  cursor: "pointer",
};

export default function EditProfilePage() {
  const stored = localStorage.getItem("user");
  const rawUser = stored ? JSON.parse(stored) : null;
  const user = { ...rawUser, _id: rawUser?._id || rawUser?.id || "" };
  const token = user?.token;
  const navigate = useNavigate();

  const [socials, setSocials] = useState({
    X: "",
    youtube: "",
    instagram: "",
    tiktok: "",
    imdb: "",
    tmdb: "",
    website: "",
  });

  const [bio, setBio] = useState("");
  const [favoriteFilms, setFavoriteFilms] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [showBackdropModal, setShowBackdropModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [backdropOptions, setBackdropOptions] = useState([]);
  const [selectedBackdrop, setSelectedBackdrop] = useState("");

  useEffect(() => {
    if (user) {
      const localBackdrop = JSON.parse(localStorage.getItem("chosenBackdrop"));

      setBio(user.bio || "");
      setFavoriteFilms(user.favoriteMovies || []);
      setAvatar(user.avatar || "");
      setUsername(user.username);
      setBackdrop(localBackdrop?.backdrop || user.backdrop || "");

      setSocials({
        X: user.X || "",
        youtube: user.youtube || "",
        instagram: user.instagram || "",
        tiktok: user.tiktok || "",
        imdb: user.imdb || "",
        tmdb: user.tmdb || "",
        website: user.website || "",
      });
    }
  }, []);

  const handleSave = async () => {
    if (
      bio === user.bio &&
      avatar === user.avatar &&
      backdrop === user.backdrop &&
      JSON.stringify(favoriteFilms) === JSON.stringify(user.favoriteMovies) &&
      JSON.stringify(socials) === JSON.stringify({
        X: user.X || "",
        youtube: user.youtube || "",
        instagram: user.instagram || "",
        tiktok: user.tiktok || "",
        imdb: user.imdb || "",
        tmdb: user.tmdb || "",
        website: user.website || "",
      })
    ) {
      toast("No changes to save.");
      return;
    }

    try {
      const updatedUser = {
        bio,
        avatar,
        backdrop,
        favoriteMovies: favoriteFilms,
        ...socials,
      };

      await axios.patch(`${backend}/api/users/${user._id}`, updatedUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.setItem("user", JSON.stringify({ ...user, ...updatedUser }));

      toast.success("✅ Profile updated!");
      navigate(`/profile/${user._id}`);
    } catch (err) {
      console.error("❌ Failed to update profile", err);
      toast.error("❌ Failed to update profile.");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await axios.post(
        `${backend}/api/upload/avatar/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAvatar(res.data.avatar);
      toast.success("✅ Avatar uploaded!");
    } catch (err) {
      console.error("Avatar upload failed", err);
      toast.error("❌ Avatar upload failed.");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(favoriteFilms);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setFavoriteFilms(items);
  };

  return (
    <>
      <div
        style={{
          background: "#0e0e0e",
          color: "#fff",
          padding: "24px",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "620px" }}>
          {/* Top Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: "none", color: "#aaa", border: "none", fontSize: "16px", cursor: "pointer" }}
            >
              ←
            </button>
            <button
              onClick={handleSave}
              style={{
                background: "#fff",
                color: "#000",
                borderRadius: "6px",
                padding: "6px 14px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>

          {/* Backdrop */}
          {backdrop && (
            <img
              src={backdrop}
              alt="backdrop"
              style={{
                width: "100%",
                height: "140px",
                borderRadius: "12px",
                objectFit: "cover",
                marginBottom: "16px",
              }}
            />
          )}

          {/* Avatar Upload */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img
              src={avatar || "/default-avatar.jpg"}
              alt="Avatar"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid white",
              }}
            />
            <div>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                id="avatarInput"
                onChange={handleAvatarUpload}
              />
              <label htmlFor="avatarInput" style={btnStyle}>
                Change Photo
              </label>
            </div>
          </div>

          {/* Backdrop button */}
          <div style={{ marginTop: "16px", width: "60%", display: "flex", alignItems: "center" }}>
            <button style={btnStyle} onClick={() => navigate("/choose-backdrop")}>
              Change backdrop
            </button>
          </div>

          {/* Bio */}
          <div style={{ marginTop: "14px", width: "90%" }}>
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 180))}
              maxLength={180}
              style={{ ...inputStyle, height: "80px" }}
            />
          </div>

          {/* Favorite Films */}
          <div style={{ marginTop: "24px" }}>
            <h4>Favorite Films</h4>
            <MovieListSortable movies={favoriteFilms} setMovies={setFavoriteFilms} />
            <p style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
              Drag to reorder, click ❌ to remove
            </p>
          </div>

          {/* Connections */}
          <div style={{ marginTop: "36px" }}>
            <h4>Connections</h4>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "6px" }}>
              Add your social links (X, YouTube, etc.)
            </p>
            <details style={{ marginBottom: "20px" }}>
              <summary style={{ cursor: "pointer", color: "#ddd" }}>Add / Edit Connections</summary>
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {["X", "youtube", "instagram", "tiktok", "imdb", "tmdb", "website"].map((platform) => (
                  <div key={platform} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontSize: "18px", width: "24px" }}>
                      {getPlatformIcon(platform)}
                    </div>
                    <input
                      placeholder={`Enter your ${platform} link or username`}
                      value={socials[platform]}
                      onChange={(e) =>
                        setSocials((prev) => ({ ...prev, [platform]: e.target.value }))
                      }
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* Contact Us */}
          <div style={{ marginTop: "32px" }}>
            <h4>Contact Us</h4>
            <details>
              <summary style={{ cursor: "pointer", color: "#ddd" }}>Show contact info</summary>
              <div style={{ marginTop: "12px", color: "#aaa" }}>
                <p>Email: scenewebapp@gmail.com</p>
                <p>X: @joinsceneapp</p>
                <p>instagram: @joinscene</p>
              </div>
            </details>
          </div>

          {/* Delete My Account */}
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <button
              style={{
                background: "transparent",
                border: "1px solid red",
                color: "red",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
              onClick={async () => {
                if (!window.confirm("⚠️ Are you sure you want to delete your account? This cannot be undone.")) return;

                try {
                  await axios.delete(`${backend}/api/users/${user._id}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });

                  localStorage.clear();
                  toast.success("🗑️ Account deleted.");
                  navigate("/login");
                } catch (err) {
                  toast.error("Failed to delete account.");
                  console.error(err);
                }
              }}
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop Picker Modal */}
      {showBackdropModal && (
        <BackdropSearchModalV2
          onSelect={(movie) => {
            setBackdrop(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`);
            setShowBackdropModal(false);
            setSearchQuery("");
            setBackdropOptions([]);
            setSearchResults([]);
            setSelectedBackdrop("");
          }}
          onClose={() => setShowBackdropModal(false)}
        />
      )}
    </>
  );
}
