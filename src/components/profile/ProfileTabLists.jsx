import React, { useEffect, useState, useMemo } from "react";
import {
  getMyLists,
  getUserLists,
  getSavedLists,
  getPopularLists,
  getFriendsLists,
} from "../../api/api";
import { useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import useTranslate from "../../utils/useTranslate";

export default function ProfileTabLists({ user, profileUserId, refreshTrigger }) {
  const t = useTranslate();
  const navigate = useNavigate();

  const [myLists, setMyLists] = useState([]);
  const [savedLists, setSavedLists] = useState([]);
  const [popularLists, setPopularLists] = useState([]);
  const [friendsLists, setFriendsLists] = useState([]);

  // 🔤 keep an internal ID (not a label) so translation doesn’t break logic
  const isOwner = user?._id === profileUserId;
  const availableTabs = isOwner ? ["my", "saved", "popular", "friends"] : ["my", "saved", "popular"];
  const [activeSubTab, setActiveSubTab] = useState(availableTabs[0]);

  // labels map (recomputed when language changes)
  const TAB_LABELS = useMemo(
    () => ({
      my: t("My lists"),
      saved: t("Saved"),
      popular: t("Popular"),
      friends: t("Friends"),
    }),
    [t]
  );

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [myRes, savedRes, popularRes, friendsRes] = await Promise.all([
          isOwner ? getMyLists() : getUserLists(profileUserId),
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
  }, [profileUserId, isOwner, refreshTrigger]);

  const displayedLists = useMemo(() => {
    switch (activeSubTab) {
      case "my":
        return myLists;
      case "saved":
        return savedLists;
      case "popular":
        return popularLists;
      case "friends":
        return friendsLists;
      default:
        return [];
    }
  }, [activeSubTab, myLists, savedLists, popularLists, friendsLists]);

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
        {availableTabs.map((tabId) => {
          const isActive = activeSubTab === tabId;
          return (
            <button
              key={tabId}
              onClick={() => setActiveSubTab(tabId)}
              style={{
                background: isActive ? "#222" : "transparent",
                border: "1px solid #444",
                borderRadius: "20px",
                padding: "6px 14px",
                color: "#eee",
                fontWeight: isActive ? "bold" : "normal",
                cursor: "pointer",
                fontSize: "13px",
              }}
              aria-pressed={isActive}
            >
              {TAB_LABELS[tabId]}
            </button>
          );
        })}
      </div>

      {/* Add Button */}
      {activeSubTab === "my" && isOwner && (
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
            ➕ {t("Add List")}
          </button>
        </div>
      )}

      {/* Grid Display */}
      <div
        className="lists-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
          padding: "0 16px 16px",
          justifyItems: "center",
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
              width: "100%",
              maxWidth: "400px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {list.coverImage && (
              <img
                src={list.coverImage}
                alt={list.title}
                style={{
                  width: "100%",
                  height: "160px",
                  objectFit: "cover",
                }}
              />
            )}

            <div style={{ padding: "12px" }}>
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
                @{list.user?.username || t("unknown")}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "6px",
                }}
              >
                {list.likes?.includes(user?._id) ? (
                  <AiFillHeart style={{ fontSize: "14px", color: "#B327F6" }} />
                ) : (
                  <AiOutlineHeart style={{ fontSize: "14px", color: "#999" }} />
                )}
                <span style={{ fontSize: "12px", color: "#bbb" }}>
                  {list.likes?.length || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* (Optional) Phone-specific layout tweaks */}
      <style>
        {`
          @media (max-width: 480px) {
            .lists-grid {
              grid-template-columns: repeat(1, 1fr);
            }
          }
        `}
      </style>
    </>
  );
}
