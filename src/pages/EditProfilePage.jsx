import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import toast from "react-hot-toast";
import { getPlatformIcon } from "../utils/getPlatformIcon.jsx";
import MovieListSortable from "../components/lists/MovieListSortable";
import AddMovieModal       from "../components/lists/AddMovieModal";
import CropperModal from "../components/CropperModal";

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
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [rawAvatarFile, setRawAvatarFile] = useState(null);
const [showCropper, setShowCropper] = useState(false);
const [avatarFile, setAvatarFile] = useState(null);


  useEffect(() => {
    if (user) {
      const localBackdrop = JSON.parse(localStorage.getItem("chosenBackdrop"));

      setBio(user.bio || "");
      setFavoriteFilms(user.favoriteFilms || []);
      setAvatar(user.avatar || "");
      setUsername(user.username);
      setBackdrop(localBackdrop?.backdrop || user.backdrop || "");

      setSocials({
        X: user.socials?.X || "",
        youtube: user.socials?.youtube || "",
        instagram: user.socials?.instagram || "",
        tiktok: user.socials?.tiktok || "",
        imdb: user.socials?.imdb || "",
        tmdb: user.socials?.tmdb || "",
        website: user.socials?.website || "",
      });      
    }
  }, []);

  const handleSave = async () => {
    if (
      bio === user.bio &&
      avatar === user.avatar &&
      backdrop === user.backdrop &&
      JSON.stringify(favoriteFilms) === JSON.stringify(user.favoriteFilms) &&
      JSON.stringify(socials) === JSON.stringify(user.socials || {})
    ) {
      toast("No changes to save.");
      return;
    }
  
    try {
      const updatedUser = {
        bio,
        avatar,
        backdrop,
        favoriteFilms,
        socials, // ✅ NESTED correctly
      };
      
  
      const res = await axios.patch(`/api/users/${user._id}`, updatedUser);

  
      // 🔥 Save updated user (includes favoriteMovies)
      localStorage.setItem("user", JSON.stringify({ ...user, ...res.data.user }));
  

      toast.success("✅ Profile updated!");
      navigate(`/profile/${user._id}`);
    } catch (err) {
      console.error("❌ Failed to update profile", err);
      toast.error("❌ Failed to update profile.");
    }
  };
  
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRawAvatarFile(file);
    setShowCropper(true);
  };
  
  const handleCroppedAvatar = async (croppedBlob) => {
    const formData = new FormData();
    formData.append("avatar", croppedBlob);
  
    try {
      const res = await axios.post(
        `/api/upload/avatar/${user._id}`,
        formData,
        {
          headers: {
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
          paddingBottom: "100px", // ✅ adds scroll space for delete button
          overflowY: "auto",       // ✅ enables scrolling if needed
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "620px" }}>
          {/* Top Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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
  src={
    avatar && avatar !== "null" && avatar !== "undefined"
      ? avatar
      : "/default-avatar.jpg"
  }
  alt="Avatar"
  style={{
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid white",
  }}
  onError={(e) => {
    e.currentTarget.onerror = null; // prevent infinite loop
    e.currentTarget.src = "/default-avatar.jpg";
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

  {favoriteFilms.length === 0 ? (
    <p style={{ color: "#888" }}>No favorite movies yet.</p>
  ) : (
    <MovieListSortable movies={favoriteFilms} setMovies={setFavoriteFilms} />
  )}

  {/* only show add button if fewer than 4 movies */}
  {favoriteFilms.length < 4 && (
    <button
      onClick={() => setShowAddMovieModal(true)}
      style={{
        marginTop: "12px",
        padding: "8px 16px",
        fontSize: "14px",
        cursor: "pointer",
        backgroundColor: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "6px",
        color: "white",
      }}
    >
      ➕ Add Movie
    </button>
  )}

  {/* likewise, only allow modal to open if under 4 */}
  {showAddMovieModal && favoriteFilms.length < 4 && (
    <AddMovieModal
      onClose={() => setShowAddMovieModal(false)}
      onSelect={(movie) => {
        if (!favoriteFilms.some((m) => m.id === movie.id)) {
          setFavoriteFilms([...favoriteFilms, movie]);
        }
        setShowAddMovieModal(false);
      }}
      existing={favoriteFilms}
    />
  )}
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

          <div style={{ marginTop: "24px" }}>
  <button
    onClick={() => navigate("/import")}
    style={{
      padding: "10px 16px",
      background: "#1e1e1e",
      color: "#fff",
      border: "1px solid #444",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    📦 Transfer Data from Letterboxd
  </button>
</div>


          {/* Contact Us */}
          <div style={{ marginTop: "32px" }}>
            <h4>Contact Us</h4>
            <details>
              <summary style={{ cursor: "pointer", color: "#ddd" }}>Show contact info</summary>
              <div style={{ marginTop: "12px", color: "#aaa",fontFamily: "Inter, sans-serif", }}>
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
                  await axios.delete(`/api/users/${user._id}`);

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
      {showCropper && rawAvatarFile && (
  <CropperModal
    file={rawAvatarFile}                      // ✅ fix here
    onClose={() => setShowCropper(false)}     // ✅ typo fix here
    onCropComplete={(blob) => handleCroppedAvatar(blob)}
    shape="circle"
    aspectRatio={1}
  />
)}

    </>
  );
}
