import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ColorThief from "colorthief";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import ProfileTabProfile from "../components/profile/ProfileTabProfile";
import ProfileTabReviews from "../components/profile/ProfileTabReviews";
import ProfileTabWatchlist from "../components/profile/ProfileTabWatchlist";
import ProfileTabLists from "../components/profile/ProfileTabLists";
import ProfileTabFilms from "../components/profile/ProfileTabFilms";
import { backend } from "../config";

export default function ProfilePage() {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token"); // ✅ pulled directly
  const { id: paramId } = useParams();
  const id = paramId || stored._id;
  const isOwner = stored._id === id;

  const [activeTab, setActiveTab] = useState("Profile");
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("recent");
  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const imgRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${backend}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    const fetchLogs = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const res = await fetch(`${backend}/api/logs/user/${id}`);
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };

    if (id) {
      fetchUser();
      fetchLogs();
    }
  }, [id, token]);

  useEffect(() => {
    if (user && imgRef.current) {
      const colorThief = new ColorThief();
      imgRef.current.crossOrigin = "anonymous";
      imgRef.current.onload = () => {
        try {
          const color = colorThief.getColor(imgRef.current);
          document.documentElement.style.setProperty("--scene-theme", `rgb(${color.join(",")})`);
        } catch (err) {
          console.error("ColorThief failed:", err);
        }
      };
    }
  }, [user]);

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ backgroundColor: "#0e0e0e", color: "white", minHeight: "100vh", paddingBottom: "100px" }}>
      <ProfileHeader user={user} navigate={navigate} imgRef={imgRef} />
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ padding: "0 16px" }}>
        {activeTab === "Profile" && <ProfileTabProfile logs={logs} />}
        {activeTab === "Reviews" && (
          <ProfileTabReviews
            logs={logs}
            filter={reviewFilter}
            setFilter={setReviewFilter}
            navigate={navigate}
          />
        )}
        {activeTab === "Watchlist" && (
          <ProfileTabWatchlist
            user={user}
            sortType={sortType}
            setSortType={setSortType}
            order={order}
            setOrder={setOrder}
            watchlist={watchlist}
            setWatchlist={setWatchlist}
          />
        )}
        {activeTab === "Lists" && (
          <ProfileTabLists
            user={stored}
            profileUserId={id}
            refreshTrigger={listRefreshKey}
            triggerRefresh={() => setListRefreshKey((prev) => prev + 1)}
          />
        )}
        {activeTab === "Films" && <ProfileTabFilms logs={logs} />}
      </div>
    </div>
  );
}
