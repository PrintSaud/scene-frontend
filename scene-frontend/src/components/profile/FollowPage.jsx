 // src/pages/FollowPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";



export default function FollowPage({ defaultTab }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchFollows = async () => {
      try {
        const endpoint =
          activeTab === "followers"
            ? `/api/users/${id}/followers`
            : `/api/users/${id}/following`;
            const { data } = await api.get(endpoint);

        setUsers(data);
      } catch (err) {
        console.error("Failed to load follows", err);
      }
    };

    fetchFollows();
  }, [activeTab, id]);

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", padding: "24px", color: "#fff" }}>
      {/* Top Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
        <button
          onClick={() => {
            setActiveTab("following");
            navigate(`/profile/${id}/following`);
          }}
          style={{
            background: activeTab === "following" ? "#222" : "transparent",
            border: "1px solid #444",
            padding: "6px 14px",
            borderRadius: "20px",
            color: "#eee",
            fontWeight: activeTab === "following" ? "bold" : "normal",
          }}
        >
          Following
        </button>
        <button
          onClick={() => {
            setActiveTab("followers");
            navigate(`/profile/${id}/followers`);
          }}
          style={{
            background: activeTab === "followers" ? "#222" : "transparent",
            border: "1px solid #444",
            padding: "6px 14px",
            borderRadius: "20px",
            color: "#eee",
            fontWeight: activeTab === "followers" ? "bold" : "normal",
          }}
        >
          Followers
        </button>
      </div>

      {/* Users List */}
      {users.map((user) => (
        <div
          key={user._id}
          onClick={() => navigate(`/profile/${user._id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 0",
            borderBottom: "1px solid #222",
            cursor: "pointer",
          }}
        >
          <img
            src={user.avatar || "/avatars/default.png"}
            alt={user.username}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "999px",
              objectFit: "cover",
            }}
          />
          <span style={{ fontSize: "14px", color: "#eee" }}>@{user.username}</span>
        </div>
      ))}
    </div>
  );
}
