import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";



export default function ShareListPage() {
  const { id } = useParams();  // listId
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const handleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) {
          toast.error("Not logged in");
          return;
        }

        const storedUser = JSON.parse(stored);
        setCurrentUser(storedUser);

        const usersRes = await api.get("/api/users");
        setAllUsers(usersRes.data);

        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to fetch users for ShareListPage", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSend = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one friend.");
      return;
    }
    try {
      await api.post(`/api/lists/${id}/share`, { recipients: selected });
      toast.success("Shared successfully!");
      navigate(-1);
    } catch (err) {
      console.error("❌ Failed to share list", err);
      toast.error("Failed to share.");
    }
  };

  const mutualFollowers = allUsers.filter(
    (u) =>
      u._id !== currentUser?._id &&
      currentUser?.following?.includes(u._id) &&
      u.following?.includes(currentUser._id)
  );

  if (loading) {
    return (
      <div style={{ padding: "20px", color: "#fff", background: "#0e0e0e", minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", color: "#fff", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px", justifyContent: "space-between" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <button
          onClick={handleSend}
          style={{
            background: selected.length > 0 ? "#a970ff" : "#333",
            color: "#fff",
            border: "none",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
          }}
          disabled={selected.length === 0}
        >
          Send
        </button>
      </div>

      {/* Friends List */}
      <div style={{ padding: "0 16px" }}>
        {mutualFollowers.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "40px", color: "#bbb" }}>
            You have no mutual followers yet.
          </div>
        ) : (
          mutualFollowers.map((f) => (
            <div
              key={f._id}
              onClick={() => handleSelect(f._id)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #222",
                cursor: "pointer",
                background: selected.includes(f._id) ? "#222" : "transparent",
              }}
            >
              <img
                src={f.avatar}
                alt="avatar"
                style={{ width: "36px", height: "36px", borderRadius: "50%", marginRight: "12px" }}
              />
              <span>@{f.username}</span>
              {selected.includes(f._id) && (
                <span style={{ marginLeft: "auto", fontSize: "16px", color: "#a970ff" }}>✔</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
