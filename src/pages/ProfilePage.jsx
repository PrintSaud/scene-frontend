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
import { getCustomPostersBatch } from "../api/api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [activeTab, setActiveTab] = useState("Profile");
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [customPosters, setCustomPosters] = useState({});
  const [reviewFilter, setReviewFilter] = useState("recent");
  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [stored, setStored] = useState(null);
  const imgRef = useRef();
  const [isFollowing, setIsFollowing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [resolvedPosters, setResolvedPosters] = useState({});


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
    if (!Array.isArray(logs) || !user) return;
  
    const fetchCustomPosters = async () => {
      const userId = user._id;
  
      // helper: robust tmdb id extraction
      const getId = (obj) => {
        if (!obj) return null;
        // if it's a number already
        if (typeof obj === "number") return obj;
        // if it's a string number
        if (typeof obj === "string" && /^\d+$/.test(obj)) return Number(obj);
        // object fields (use optional chaining)
        return Number(obj?.tmdbId ?? obj?.id ?? obj?._id) || null;
      };
  
      const logIds = (logs || [])
        .filter(Boolean)
        .map((log) => getId(log?.tmdbId ?? log))
        .filter((v) => Number.isFinite(v));
  
      const favIds = (user?.favoriteFilms || [])
        .filter(Boolean) // <-- avoids nulls
        .map((m) => getId(m))
        .filter((v) => Number.isFinite(v));
  
      const movieIds = [...new Set([...logIds, ...favIds])];
  
      if (!userId || movieIds.length === 0) {
        console.warn("⚠️ Missing userId or valid movieIds for custom posters", { userId, movieIds });
        return;
      }
  
      try {
        const data = await getCustomPostersBatch(userId, movieIds);
        setCustomPosters(data);
      } catch (err) {
        console.error("❌ Failed to fetch custom posters", err);
      }
    };
  
    fetchCustomPosters();
  }, [logs, user]); // keep as you had it
  
  
  useEffect(() => {
    if (!logs.length || !user) return;
  
    const finalPosters = {};
    logs.forEach((log) => {
      const tmdbId = log.tmdbId;
      const custom = customPosters[tmdbId];
      const tmdb = log.poster_path ? `https://image.tmdb.org/t/p/w500${log.poster_path}` : null;
      finalPosters[tmdbId] = custom || tmdb || "/fallback.jpg"; // or your default image
    });
  
    setResolvedPosters(finalPosters); // ✅ new state
  }, [logs, customPosters]);
  
    

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
  
  useEffect(() => {
    const handleNavigateToFilms = () => setActiveTab("Films"); // Capital "F" 
    window.addEventListener("navigateToFilms", handleNavigateToFilms);
    return () => window.removeEventListener("navigateToFilms", handleNavigateToFilms);
  }, []);

  const handleLike = async (logId) => {
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      await api.post(
        `/api/logs/${logId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // ✅ Optional: update log likes in real-time
      setLogs((prevLogs) =>
        prevLogs.map((log) =>
          log._id === logId
            ? {
                ...log,
                likes: log.likes.includes(stored._id)
                  ? log.likes.filter((id) => id !== stored._id)
                  : [...log.likes, stored._id],
              }
            : log
        )
      );
    } catch (err) {
      console.error("❌ Failed to like log", err);
    }
  };
  
  
  
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
{activeTab === "Profile" && user && (
  <ProfileTabProfile
    user={user}
    logs={logs}
    favoriteMovies={user?.favoriteFilms} 
    profileUserId={user._id}
    customPosters={customPosters}
  />
)}

{activeTab === "Reviews" && (
  <ProfileTabReviews
    logs={logs}
    filter={reviewFilter}
    setFilter={setReviewFilter}
    navigate={navigate}
    handleLike={handleLike} // ✅ now passed
    customPosters={customPosters}
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
  favorites={user?.favorites}
  profileUserId={user?._id}
  customPosters={customPosters}
/>
)}

</div>


    </div>
  );
}
