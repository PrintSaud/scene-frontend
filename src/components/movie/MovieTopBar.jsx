import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { toggleWatchlist } from "../../api/api";
import axios from "axios";
import { backend } from "../../config";
import useTranslate from "../../utils/useTranslate";

export default function MovieTopBar({
  navigate,
  movie,
  isInWatchlist,
  setIsInWatchlist,
  setShowPosterModal,
  setShowAddToListModal,
}) {
  const t = useTranslate();
  const [showOptions, setShowOptions] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [myLog, setMyLog] = useState(null);

  // ✅ Always use TMDB id
  const tmdbId = useMemo(() => Number(movie?.id ?? movie?.tmdbId), [movie]);
  const validTmdb = Number.isFinite(tmdbId);

  // ✅ Initialize favorite state from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      const favs = Array.isArray(stored?.favorites)
        ? stored.favorites.map(Number)
        : [];
      setIsFavorite(validTmdb ? favs.includes(tmdbId) : false);
    } catch {
      setIsFavorite(false);
    }
  }, [tmdbId, validTmdb]);

  // ✅ Fetch my log for this movie (to show Delete Log)
  useEffect(() => {
    const fetchMyLog = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem("user"));
        const token = stored?.token;
        if (!stored || !token || !validTmdb) return;

        const res = await axios.get(`${backend}/api/logs/user/${stored._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const log = (res.data || []).find(
          (l) => String(l.tmdbId || l.movie?.id || l.movie) === String(tmdbId)
        );
        setMyLog(log || null);
      } catch (err) {
        console.error("Failed to fetch user logs:", err);
      }
    };
    fetchMyLog();
  }, [tmdbId, validTmdb]);

  const handleToggleWatchlist = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      const token = stored?.token;
      if (!token) return toast.error(t("errors.not_logged_in"));
      if (!validTmdb) return toast.error(t("errors.invalid_movie_id"));

      await toggleWatchlist(tmdbId);
      setIsInWatchlist((prev) => !prev);
      toast.success(
        isInWatchlist ? t("watchlist.removed") : t("watchlist.added")
      );
    } catch (err) {
      console.error("❌ Watchlist error:", err.response?.data || err.message);
      toast.error(t("errors.watchlist_update_failed"));
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      const token = stored?.token;
      if (!token) return toast.error(t("errors.not_logged_in"));
      if (!validTmdb) return toast.error(t("errors.invalid_movie_id"));

      let data;
      if (isFavorite) {
        const res = await axios.delete(
          `${backend}/api/users/${stored._id}/favorites/${tmdbId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        data = res.data;
        toast.success(t("favorites.removed"));
      } else {
        const res = await axios.post(
          `${backend}/api/users/${stored._id}/favorites/${tmdbId}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        data = res.data;
        toast.success(t("favorites.added"));
      }

      // ✅ Trust server → sync local user + state
      const nextUser = { ...stored, favorites: data.favorites || [] };
      localStorage.setItem("user", JSON.stringify(nextUser));
      setIsFavorite((data.favorites || []).map(Number).includes(tmdbId));
    } catch (err) {
      console.error("❌ Favorite error:", err.response?.data || err.message);
      toast.error(t("errors.favorites_update_failed"));
    }
  };

  const handleDeleteLog = async () => {
    if (!myLog) return;
    if (!window.confirm(t("confirm.delete_log"))) return;

    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      const token = stored?.token;
      await axios.delete(`${backend}/api/logs/${myLog._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(t("logs.deleted_success"));
      setMyLog(null);
    } catch (err) {
      console.error("❌ Delete log error:", err);
      toast.error(t("errors.delete_log_failed"));
    }
  };

  const menuItems = [
    { label: `🖼 ${t("change_poster")}`, onClick: () => setShowPosterModal(true) },
    {
      label: isInWatchlist
        ? `❌ ${t("remove_from_watchlist")}`
        : `➕ ${t("add_to_watchlist")}`,
      onClick: handleToggleWatchlist,
    },
    {
      label: isFavorite
        ? `❤️ ${t("remove_from_favorites")}`
        : `❤️ ${t("add_to_favorites")}`,
      onClick: handleToggleFavorite,
    },
    { label: `🎞 ${t("add_to_list")}`, onClick: () => setShowAddToListModal(true) },
    { label: `📤 ${t("share_to_friend")}`, onClick: () => navigate(`/share/movie/${tmdbId}`) },
    myLog && { label: `🗑️ ${t("delete_log")}`, onClick: handleDeleteLog },
  ].filter(Boolean);
  
  

  return (
    <div
      style={{
        position: "absolute",
        top: "16px",
        left: "16px",
        right: "16px",
        zIndex: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        aria-label={t("a11y.back")}
        title={t("a11y.back")}
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ←
      </button>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowOptions((p) => !p)}
          aria-label={t("a11y.open_menu")}
          title={t("a11y.open_menu")}
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: "#fff",
            fontSize: "22px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⋯
        </button>

        {showOptions && (
          <div
            style={{
              position: "absolute",
              top: "38px",
              right: 0,
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              padding: "12px 0",
              width: "200px",
            }}
          >
            {menuItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  item.onClick();
                  setShowOptions(false);
                }}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "#fff",
                  fontFamily: "Inter",
                  transition: "0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
