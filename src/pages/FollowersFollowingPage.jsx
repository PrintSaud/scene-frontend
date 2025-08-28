import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../api/api";
import { backend } from "../config";
import useTranslate from "../utils/useTranslate";

export default function FollowersFollowingPage() {
  const t = useTranslate();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isFollowersTab = location.pathname.includes("followers");
  const [activeTab, setActiveTab] = useState(isFollowersTab ? "followers" : "following");
  const [users, setUsers] = useState([]);
  const [profileUsername, setProfileUsername] = useState("User");

  // current user can be null if logged out — guard it
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // translated labels (don’t use these for logic)
  const TAB_LABELS = useMemo(
    () => ({
      followers: t("Followers"),
      following: t("Following"),
    }),
    [t]
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${backend}/api/users/${id}/${activeTab}`, {
          headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {},
        });
        const userArray = res.data.followers || res.data.following || [];
        setUsers(userArray);
        setProfileUsername(res.data.user?.username || t("User"));
      } catch (err) {
        console.error("❌ Failed to fetch:", err);
        setUsers([]);
      }
    };
    if (id) fetchUsers();
  }, [activeTab, id]);

  const toggleFollow = async (targetId) => {
    if (!currentUser) return; // optionally navigate("/login")
    try {
      await axios.post(
        `${backend}/api/users/${currentUser._id}/follow/${targetId}`,
        null,
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      const isFollowing = (currentUser.following || []).includes(targetId);
      const updatedFollowing = isFollowing
        ? currentUser.following.filter((fid) => fid !== targetId)
        : [...(currentUser.following || []), targetId];
      const updatedUser = { ...currentUser, following: updatedFollowing };
      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Failed to toggle follow:", err);
    }
  };

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        padding: "24px",
        paddingBottom: "120px",
        color: "#fff",
      }}
    >
      {/* Back + title */}
      <div style={{ position: "relative", marginBottom: "20px", height: "24px" }}>
        <button
          onClick={() => navigate(-1)}
          aria-label={t("Back")}
          title={t("Back")}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            background: "none",
            border: "none",
            color: "#ccc",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ←
        </button>
        <h2
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: 0,
            fontSize: "16px",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {t("{{name}}’s {{tab}}", {
            name: profileUsername,
            tab: TAB_LABELS[activeTab],
          })}
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("following")}
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            background: activeTab === "following" ? "#fff" : "#222",
            color: activeTab === "following" ? "#000" : "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
          }}
          aria-pressed={activeTab === "following"}
        >
          {TAB_LABELS.following}
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            background: activeTab === "followers" ? "#fff" : "#222",
            color: activeTab === "followers" ? "#000" : "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
          }}
          aria-pressed={activeTab === "followers"}
        >
          {TAB_LABELS.followers}
        </button>
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}>{t("No users found.")}</div>
      ) : (
        <div style={{ padding: 0 }}>
          {users.map((u) => {
            const iFollow = (currentUser?.following || []).includes(u._id);
            const isMe = currentUser?._id === u._id;
            return (
              <div
                key={u._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingRight: 16,
                  paddingLeft: 12,
                  marginLeft: -24,
                  width: "100vw",
                  borderBottom: "1px solid #222",
                  boxSizing: "border-box",
                }}
              >
                {/* Avatar + Username → link to profile */}
                <div
                  onClick={() => navigate(`/profile/${u._id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  <img
                    src={u.avatar || "/default-avatar.jpg"}
                    alt={u.username || t("User")}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: "12px",
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/default-avatar.jpg";
                    }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>
                    {u.username || t("User")}
                  </span>
                </div>

                {/* Follow/Unfollow button */}
                {!isMe && (
                  <button
                    onClick={() => toggleFollow(u._id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      background: iFollow ? "#222" : "#fff",
                      color: iFollow ? "#fff" : "#000",
                      border: "1px solid #444",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    {iFollow ? t("Unfollow") : t("Follow")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
