import React, { useEffect, useState } from "react";
import {
    getMyLists,
    getSavedLists,
    getPopularLists,
    getFriendsLists,
  } from "../../api/api";
  
import { useNavigate } from "react-router-dom";

export default function ProfileTabLists({ user, profileUserId }) {
  const [myLists, setMyLists] = useState([]);
  const [savedLists, setSavedLists] = useState([]);
  const [popularLists, setPopularLists] = useState([]);
  const [friendsLists, setFriendsLists] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("My lists");
  const navigate = useNavigate();

  const isOwner = user?._id === profileUserId;

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [myRes, savedRes, popularRes, friendsRes] = await Promise.all([
            getMyLists(profileUserId),
            isOwner ? getSavedLists() : Promise.resolve({ data: [] }),
            getPopularLists(),
            isOwner ? getFriendsLists() : Promise.resolve({ data: [] }),
          ]);
          

        const filteredMyLists = isOwner
          ? myRes.data
          : myRes.data.filter((list) => !list.isPrivate);

        setMyLists(filteredMyLists);
        setSavedLists(savedRes.data);
        setPopularLists(popularRes.data);
        setFriendsLists(friendsRes.data);
      } catch (err) {
        console.error("❌ Failed to fetch lists", err);
      }
    };

    fetchLists();

    const refresh = () => fetchLists();
    window.addEventListener("refreshMyLists", refresh);
    return () => window.removeEventListener("refreshMyLists", refresh);
  }, [profileUserId, isOwner]);

  const getDisplayedLists = () => {
    switch (activeSubTab) {
      case "My lists":
        return myLists;
      case "Saved":
        return savedLists;
      case "Popular":
        return popularLists;
      case "Friends":
        return friendsLists;
      default:
        return [];
    }
  };

  const displayedLists = getDisplayedLists();

  return (
    <>
      {/* Sub Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "16px",
          marginBottom: "20px",
        }}
      >
        {["My lists", "Saved", "Popular", "Friends"].map((label) => (
          <button
            key={label}
            onClick={() => setActiveSubTab(label)}
            style={{
              background: activeSubTab === label ? "#222" : "transparent",
              border: "1px solid #444",
              borderRadius: "20px",
              padding: "6px 14px",
              color: "#eee",
              fontWeight: activeSubTab === label ? "bold" : "normal",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add Button */}
      {activeSubTab === "My lists" && isOwner && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 16px" }}>
          <button
            onClick={() => navigate("/create-list")}
            style={{
              background: "#222",
              color: "#fff",
              border: "1px solid #444",
              padding: "8px 16px",
              fontSize: "13px",
              borderRadius: "6px",
              marginBottom: "16px",
              cursor: "pointer",
            }}
          >
            ➕ Add List
          </button>
        </div>
      )}

      {/* Grid Display */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "16px",
          padding: "0 16px 16px",
        }}
      >
        {displayedLists.map((list) => (
          <div
            key={list._id}
            onClick={() => navigate(`/list/${list._id}`)}
            style={{
              background: "#1a1a1a",
              borderRadius: "14px",
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={list.coverImage}
              alt={list.title}
              style={{
                width: "100%",
                height: "140px",
                objectFit: "cover",
              }}
            />
            <div style={{ padding: "10px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {list.title}
              </div>
              <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>
                @{list.user?.username || "unknown"}
              </div>
              <div style={{ fontSize: "12px", color: "#bbb", marginTop: "4px" }}>
                ❤️ {list.likes?.length || 0} {list.likes?.length === 1 ? "like" : "likes"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
