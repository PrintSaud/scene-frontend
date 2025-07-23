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
import toast from "react-hot-toast";
import { followUser } from "../api/api";

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

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

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const userRes = await getUserProfile(id);
        setUser(userRes.data);
      } catch (err) {
        console.error("❌ Failed to load profile", err);
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

  useEffect(() => {
    if (stored && user) {
      setIsFollowing(user.followers?.includes(stored._id));
    }
  }, [user, stored]);



  const handleFollow = async () => {
    try {
      await followUser(stored._id, user._id);
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("❌ Failed to follow/unfollow:", err);
    }
  };
  

  const handleCopyLink = () => {
    const link = `${window.location.origin}/profile/${user._id}`;
    navigator.clipboard.writeText(link);
    toast.success("Profile link copied!");
  };

  const handleRemoveFollower = async () => {
    if (!window.confirm("Remove this follower?")) return;
    try {
      await api.post(`/api/users/${stored._id}/remove-follower/${user._id}`);
      toast.success("Removed follower!");
      window.location.reload();
    } catch (err) {
      console.error("❌ Failed to remove follower", err);
      toast.error("Failed to remove follower.");
    }
  };

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

  useEffect(() => {
    const refresh = () => setListRefreshKey((prev) => prev + 1);
    window.addEventListener("refreshMyLists", refresh);
    return () => window.removeEventListener("refreshMyLists", refresh);
  }, []);

  if (!user) return <div style={{ color: "white", padding: "20px" }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: "#0e0e0e", color: "white", minHeight: "100vh", paddingBottom: "100px", position: "relative" }}>
      <ProfileHeader
  user={user}
  logs={logs}            // <-- pass logs here
  navigate={navigate}
  imgRef={imgRef}
  isOwner={isOwner}
  isFollowing={isFollowing}
  handleFollow={handleFollow}
/>


      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ padding: "0 16px" }}>

      {activeTab === "Profile" && (
  <ProfileTabProfile
    user={user}
    logs={logs}
    favoriteMovies={user.favoriteMovies ?? user.favorites ?? []}
    customPosters={user.customPosters || {}}
    navigate={navigate}
  />
)}

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
        {activeTab === "Films" && (
          <ProfileTabFilms
          logs={logs}
          favorites={user.favorites || []}  // ✅ Use correct schema field
          customPosters={user.customPosters || {}}
        />        
)}
      </div>
    </div>
  );
}
