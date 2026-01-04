// src/components/movie/MovieTopBar.js
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import api, { toggleWatchlist } from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";


export default function MovieTopBar({ movie, setShowPosterModal }) {
  const navigation = useNavigation();
  const t = useTranslate();

  const [showOptions, setShowOptions] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [myLog, setMyLog] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ✅ Always use TMDB id
  const tmdbId = useMemo(() => Number(movie?.id ?? movie?.tmdbId), [movie]);
  const validTmdb = Number.isFinite(tmdbId);



  // 🔎 Fetch current user + log for this movie
  useEffect(() => {
    (async () => {
      try {
        const storedRaw = await AsyncStorage.getItem("user");
        const stored = storedRaw ? JSON.parse(storedRaw) : null;
        if (!stored?._id || !validTmdb) return;

        setCurrentUserId(stored._id);

        const res = await api.get(`/api/logs/user/${stored._id}?movieId=${tmdbId}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          const match = res.data.find(
            (log) =>
              Number(log.tmdbId) === tmdbId ||
              Number(log.movie?.tmdbId) === tmdbId
          );
          setMyLog(match || null);
        } else {
          setMyLog(null);
        }
      } catch (err) {
        console.error("❌ Failed to fetch my log:", err.response?.data || err.message);
        setMyLog(null);
      }
    })();
  }, [tmdbId, validTmdb]);

  // ✅ Fetch initial watchlist + favorites status
  useEffect(() => {
    (async () => {
      try {
        const storedRaw = await AsyncStorage.getItem("user");
        const stored = storedRaw ? JSON.parse(storedRaw) : null;
        if (!stored?._id || !validTmdb) return;

        const res = await api.get(`/api/users/${stored._id}`);

        // Check Watchlist
        // Watchlist check
const inWatchlist = res.data.watchlist?.some(
    (m) => Number(m.tmdbId) === tmdbId
  );
  setIsInWatchlist(!!inWatchlist);
  
  // Favorites check
  const inFavorites = (res.data.favorites || [])
    .map(Number)
    .includes(tmdbId);
  setIsFavorite(inFavorites);
  
      } catch (err) {
        console.error("❌ Failed to fetch user data:", err.response?.data || err.message);
      }
    })();
  }, [tmdbId, validTmdb]);

  // ✅ Toggle Watchlist
  const handleToggleWatchlist = async () => {
    try {
      console.log("🔹 Sending toggle request:", { movieId: tmdbId });
      const res = await toggleWatchlist(tmdbId);
      console.log("🔹 Toggle response:", res.data);
  
      setIsInWatchlist(res.data.inWatchlist);
      Toast.show({
        type: "scene",
        text1: res.data.inWatchlist
          ? t("watchlist.added")
          : t("watchlist.removed"),
      });
    } catch (err) {
      console.error("❌ Toggle Watchlist Error:", err.response?.data || err.message);
    }
  };
  

  // ✅ Toggle Favorites
  const handleToggleFavorite = async () => {
    try {
      const storedRaw = await AsyncStorage.getItem("user");
      const stored = storedRaw ? JSON.parse(storedRaw) : null;
      const token = stored?.token;

      if (!token) {
        return Toast.show({ type: "scene", text1: t("errors.not_logged_in") });
      }
      if (!validTmdb) {
        return Toast.show({
          type: "scene",
          text1: t("errors.invalid_movie_id"),
        });
      }

      let data;
      if (isFavorite) {
        const res = await api.delete(`/api/users/${stored._id}/favorites/${tmdbId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = res.data;
        Toast.show({ type: "scene", text1: t("favorites.removed") });
      } else {
        const res = await api.post(`/api/users/${stored._id}/favorites/${tmdbId}`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = res.data;
        Toast.show({ type: "scene", text1: t("favorites.added") });
      }

      // Update AsyncStorage
      const nextUser = { ...stored, favorites: data.favorites || [] };
      await AsyncStorage.setItem("user", JSON.stringify(nextUser));

      // Update local state
      const inFavorites = (data.favorites || [])
        .map(Number)
        .includes(tmdbId);
      setIsFavorite(inFavorites);
    } catch (err) {
      console.error("❌ Favorite error:", err.response?.data || err.message);
      Toast.show({
        type: "scene",
        text1: t("errors.favorites_update_failed"),
      });
    }
  };

  // ✅ Delete Log
  const handleDeleteLog = () => {
    if (!myLog?._id) return;

    Alert.alert(
      t("confirm_delete_log_title") || "Delete Log?",
      t("confirm_delete_log_message") ||
        "Are you sure you want to delete this log? This action cannot be undone.",
      [
        { text: t("Cancel") || "Cancel", style: "cancel" },
        {
          text: t("delete") || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/logs/${myLog._id}`);
              Toast.show({ type: "scene", text1: t("log_deleted") });
              setMyLog(null);
            } catch (err) {
              console.error("❌ Delete log failed:", err.response?.data || err.message);
              Toast.show({ type: "scene", text1: t("log_delete_failed") });
            }
          },
        },
      ]
    );
  };

  // ✅ Menu Items
  const menuItems = [
    { label: `🖼 ${t("change_poster")}`, onPress: () => setShowPosterModal(true) },
    {
      label: isInWatchlist
        ? `❌ ${t("remove_from_watchlist")}`
        : `➕ ${t("add_to_watchlist")}`,
      onPress: handleToggleWatchlist,
    },
    {
      label: isFavorite
        ? `❤️ ${t("remove_from_favorites")}`
        : `❤️ ${t("add_to_favorites")}`,
      onPress: handleToggleFavorite,
    },
    {
      label: `🎞 ${t("add_to_list")}`,
      onPress: () =>
        navigation.navigate("AddToList", {
          movieId: tmdbId,
          movie: {
            id: tmdbId,
            title: movie?.title || movie?.original_title,
            poster: movie?.poster,
          },
        }),
    },
    {
      label: `📤 ${t("share_to_friend")}`,
      onPress: () =>
        navigation.navigate("ShareToFriends", { type: "movie", id: tmdbId }),
    },
  ];

  // ✅ Only show delete log if user owns a log for THIS movie
  if (myLog && String(myLog.user?._id || myLog.user) === String(currentUserId)) {
    menuItems.push({
      label: `🗑️ ${t("delete_log")}`,
      onPress: handleDeleteLog,
    });
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundBtn}>
        <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
      </TouchableOpacity>

      {/* Options Button */}
      <TouchableOpacity onPress={() => setShowOptions(true)} style={styles.roundBtn}>
        <Text style={{ color: "#fff", fontSize: 22 }}>⋯</Text>
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal
        transparent
        visible={showOptions}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
          <View style={styles.menu}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  item.onPress();
                  setShowOptions(false);
                }}
                style={styles.menuItem}
              >
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    width: 220,
    paddingVertical: 8,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
});
