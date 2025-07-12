import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../api/api";
import { backend } from "../config";

export default function FollowersFollowingPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isFollowersTab = location.pathname.includes("followers");

  const [activeTab, setActiveTab] = useState(isFollowersTab ? "followers" : "following");
  const [users, setUsers] = useState([]);
  const [profileUsername, setProfileUsername] = useState("User");
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("user")));

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${backend}/api/users/${id}/${activeTab}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        console.log("🔥 res.data:", res.data);
        const userArray = res.data.followers || res.data.following || [];
        setUsers(userArray);
        setProfileUsername(res.data.user?.username || "User");
      } catch (err) {
        console.error("❌ Failed to fetch:", err);
        setUsers([]);
      }
    };
    fetchUsers();
  }, [activeTab, id]);

  const toggleFollow = async (targetId) => {
    try {
      await axios.post(`${backend}/api/users/${currentUser._id}/follow/${targetId}`, null, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const updatedFollowing = currentUser.following.includes(targetId)
        ? currentUser.following.filter((id) => id !== targetId)
        : [...currentUser.following, targetId];
      const updatedUser = { ...currentUser, following: updatedFollowing };
      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Failed to toggle follow:", err);
    }
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: "24px", color: "#fff" }}>
      {/* Back + title */}
      <div style={{ position: "relative", marginBottom: "20px", height: "24px" }}>
        <button
          onClick={() => navigate(-1)}
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
          }}
        >
          {profileUsername}’s {activeTab === "followers" ? "Followers" : "Following"}
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
        >
          Following
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
        >
          Followers
        </button>
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}>No users found.</div>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {users.map((u) => (
            <li
            key={u._id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",  // Fix: space between avatar+username and follow btn
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={u.avatar}
                alt={u.username}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <div style={{ fontSize: "13px", fontWeight: "600" }}>{u.username}</div>
            </div>
          
            {u._id !== currentUser._id && (
              <button
                onClick={() => toggleFollow(u._id)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  background: currentUser.following.includes(u._id) ? "#222" : "#fff",
                  color: currentUser.following.includes(u._id) ? "#fff" : "#000",
                  border: "1px solid #444",
                  cursor: "pointer",
                }}
              >
                {currentUser.following.includes(u._id) ? "Unfollow" : "Follow"}
              </button>
            )}
          </li>
          
          ))}
        </ul>
      )}
    </div>
  );
}
