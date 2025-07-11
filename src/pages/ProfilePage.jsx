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
import api, { getUserProfile } from "../api/api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [activeTab, setActiveTab] = useState("Profile");
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("recent");
  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [stored, setStored] = useState(null);
  const imgRef = useRef();

  // ✅ Load user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed?._id) throw new Error("Missing _id");
      setStored(parsed);
    } catch (err) {
      console.warn("❌ Invalid local user — redirecting to login");
      navigate("/login");
    }
  }, [navigate]);

  const id = paramId || stored?._id;
  const isOwner = stored?._id === String(id);

  // 🚀 Fetch profile + logs
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const res = await getUserProfile(id);
        setUser(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch profile:", err);
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await api.get(`/api/logs/user/${id}`);
        setLogs(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch logs:", err);
      }
    };

    fetchUser();
    fetchLogs();
  }, [id]);

  // 🎨 Dominant color from backdrop
  useEffect(() => {
    if (user && imgRef.current) {
      const colorThief = new ColorThief();
      imgRef.current.crossOrigin = "anonymous";
      imgRef.current.onload = () => {
        try {
          const color = colorThief.getColor(imgRef.current);
          document.documentElement.style.setProperty("--scene-theme", `rgb(${color.join(",")})`);
        } catch (err) {
          console.error("🎨 ColorThief failed:", err);
        }
      };
    }
  }, [user]);

  // 🔄 Global listener for refreshing lists
  useEffect(() => {
    const refresh = () => setListRefreshKey((prev) => prev + 1);
    window.addEventListener("refreshMyLists", refresh);
    return () => window.removeEventListener("refreshMyLists", refresh);
  }, []);

  if (!user) return <div style={{ color: "white", padding: "20px" }}>Loading...</div>;

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
            watchList={watchlist}
            setWatchList={setWatchlist}
            profileUserId={id}
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
