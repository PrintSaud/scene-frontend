// SCENE_STABILIZE_V4_POSTERS
import "../styles/scene-profile-desktop-stats-v6.css";
import "../styles/scene-profile-final-v5.css";
import "../styles/scene-profile-refresh.css";
// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useRef } from "react";
import "../styles/scene-profile-stabilize-v4.css";
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
import { getPublicProfilePosters } from "../api/api";
import useTranslate from "../utils/useTranslate"; // ✅

export default function ProfilePage() {
  const navigate = useNavigate();
  // SCENE_PUBLIC_PROFILE_V2
  const { id: paramId, username } = useParams();
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("Profile");
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsError, setLogsError] = useState("");
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
  const t = useTranslate(); // ✅

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem("user") || "null");
      setStored(value?._id && value?.token ? value : null);
    } catch { setStored(null); }
  }, []);

  useEffect(() => {
    if (!username) { setResolvedUserId(null); return; }
    let alive = true;
    setUser(null);
    setLoadError("");
    setResolvedUserId(null);
    api.get(`/api/users/username/${encodeURIComponent(username)}`)
      .then(({ data }) => { if (alive) { if (data?._id) setResolvedUserId(data._id); else setLoadError("Profile not found"); } })
      .catch(() => { if (alive) setLoadError("Profile not found"); });
    return () => { alive = false; };
  }, [username]);

  const id = username ? resolvedUserId : (paramId || stored?._id);
  const isGuest = !stored?.token;
  const isOwner = Boolean(stored?._id && id && String(stored._id) === String(id));
  const requireLogin = () => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  // Guests can switch tabs and use sorting/filtering; opening media requires login.
  const handleGuestContentClick = (event) => {
    if (!isGuest) return;
    if (event.target.closest('img')) {
      event.preventDefault();
      event.stopPropagation();
      requireLogin();
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const userRes = await getUserProfile(id);
        setUser(userRes.data);
      } catch (err) {
        console.error("❌ Failed to load profile", err);
        setLoadError("Unable to load profile");
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await api.get(`/api/logs/user/${id}?page=1&limit=1000`);
        // SCENE_PROFILE_REPAIR_V3: normalize paginated and legacy API responses.
        const payload = res.data;
        const nextLogs = Array.isArray(payload) ? payload :
          Array.isArray(payload?.results) ? payload.results :
          Array.isArray(payload?.logs) ? payload.logs :
          Array.isArray(payload?.items) ? payload.items : [];
        setLogs(nextLogs);
        setLogsError("");
      } catch (err) {
        console.error("❌ Failed to fetch logs:", err);
        setLogs([]);
        setLogsError(err?.response?.status === 401
          ? "Movie activity requires a public read endpoint on the deployed backend (401)."
          : err?.response?.status === 403
            ? "Movie activity is not available to guests yet (403)."
            : "Unable to load movie activity. Check the browser Network tab.");
      }
    };

    fetchUser();
    fetchLogs();
  }, [id]);

  useEffect(() => {
    if (!Array.isArray(logs) || !user) return;

    const fetchCustomPosters = async () => {
      const userId = user._id;

      const getId = (obj) => {
        if (!obj) return null;
        if (typeof obj === "number") return obj;
        if (typeof obj === "string" && /^\d+$/.test(obj)) return Number(obj);
        return Number(obj?.tmdbId ?? obj?.id ?? obj?._id) || null;
      };

      const logIds = (logs || [])
        .filter(Boolean)
        .map((log) => getId(log?.tmdbId ?? log))
        .filter((v) => Number.isFinite(v));

      const favIds = (user?.favoriteFilms || [])
        .filter(Boolean)
        .map((m) => getId(m))
        .filter((v) => Number.isFinite(v));

      const movieIds = [...new Set([...logIds, ...favIds])];

      if (!userId || movieIds.length === 0) {
        console.warn("⚠️ Missing userId or valid movieIds for custom posters", { userId, movieIds });
        return;
      }

      try {
        const data = await getPublicProfilePosters(userId);
        setCustomPosters(data);
      } catch (err) {
        console.error("❌ Failed to fetch custom posters", err);
      }
    };

    fetchCustomPosters();
  }, [logs, user]);

  useEffect(() => {
    if (!logs.length || !user) return;

    const finalPosters = {};
    logs.forEach((log) => {
      const tmdbId = log.tmdbId;
      const custom = customPosters[tmdbId];
      const tmdb = log.poster_path ? `https://image.tmdb.org/t/p/w500${log.poster_path}` : null;
      finalPosters[tmdbId] = custom || tmdb || "/fallback.jpg";
    });

    setResolvedPosters(finalPosters);
  }, [logs, customPosters]);

  useEffect(() => {
    if (stored && user) {
      setIsFollowing(user.followers?.includes(stored._id));
    }
  }, [user, stored]);

  async function handleFollow(targetId) {
    if (isGuest) return requireLogin();
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const res = await api.post(
        `/api/users/${user._id}/follow/${targetId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsFollowing(res.data.following);
      toast.success(res.data.message || t("Follow status updated"));
    } catch (err) {
      console.error("❌ Follow toggle failed:", err);

      if (err.response?.status === 403) {
        toast.error(t("احبها حقتي"));

        
        setIsFollowing(false);
      } else {
        toast.error(t("Failed to update follow status"));
      }
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/profile/${user._id}`;
    navigator.clipboard.writeText(link);
    toast.success(t("Profile link copied!"));
  };

  const handleRemoveFollower = async () => {
    if (!window.confirm(t("Remove this follower?"))) return;
    try {
      await api.post(`/api/users/${stored._id}/remove-follower/${user._id}`);
      toast.success(t("Removed follower!"));
      window.location.reload();
    } catch (err) {
      console.error("❌ Failed to remove follower", err);
      toast.error(t("Failed to remove follower."));
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
    const handleNavigateToFilms = () => setActiveTab("Films");
    window.addEventListener("navigateToFilms", handleNavigateToFilms);
    return () => window.removeEventListener("navigateToFilms", handleNavigateToFilms);
  }, []);

  const handleLike = async (logId) => {
    if (isGuest) return requireLogin();
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

  if (!user)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",       // full screen height
          backgroundColor: "#0e0e0e",
          color: "white",
          fontSize: "18px",
        }}
      >
        {loadError || t("Loading...")}
      </div>
    );
  

  return (
    <div className="scene-public-profile" style={{ backgroundColor: "#0e0e0e", color: "white", minHeight: "100vh", paddingBottom: "100px", position: "relative" }}>
      <div className="scene-profile-header">
      <ProfileHeader
        user={user}
        logs={logs}
        navigate={navigate}
        imgRef={imgRef}
        isOwner={isOwner}
        isFollowing={isFollowing}
        handleFollow={handleFollow}
        handleRemoveFollower={handleRemoveFollower}
      />

      </div>
      <div className="scene-profile-tabs-wrap">
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      </div>

      <div className="scene-profile-content" onClickCapture={handleGuestContentClick} style={{ padding: "0 16px" }}>
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
            handleLike={handleLike}
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
            isGuest={isGuest}
            onGuestAction={requireLogin}
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
