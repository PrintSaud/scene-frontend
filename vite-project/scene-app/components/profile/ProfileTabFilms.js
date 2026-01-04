// src/components/profile/ProfileTabFilms.js
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import getPosterUrl from "shared/utils/getPosterUrl";
import StarRating from "../StarRating";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

function toTmdbIdAny(x) {
  const id =
    x?.tmdbId ??
    x?.movie?.tmdbId ??
    x?.movie?.id ??
    x?.movieId ??
    x?.id ??
    (typeof x === "number" || (typeof x === "string" && /^\d+$/.test(x)) ? x : null);
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

export default function ProfileTabFilms({
  logs = [],
  favorites = [], // ⬅️ array of tmdbIds
  profileUserId,
  customPosters = {},
}) {
  const t = useTranslate();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [sortType, setSortType] = useState("added"); // added | rating | favorites
  const [order, setOrder] = useState("desc");
  const [customPostersState, setCustomPostersState] = useState({});
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Responsive columns
  const numColumns = width < 500 ? 3 : width < 800 ? 4 : 6;

  // Build favIds
  const favIds = useMemo(
    () => (favorites || []).map((f) => Number(f)).filter(Number.isFinite),
    [favorites]
  );
  const isFav = useCallback((tmdbId) => favIds.includes(Number(tmdbId)), [favIds]);

  // Simulate loading for big lists
  useEffect(() => {
    if ((logs?.length || 0) > 100) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(t);
    }
    setIsLoading(false);
  }, [logs]);

  // Fetch custom posters
  useEffect(() => {
    const fetchCustomPosters = async () => {
      try {
        const movieIds = (logs || []).map(toTmdbIdAny).filter(Boolean);
        const uniqueIds = [...new Set(movieIds)];
        if (uniqueIds.length === 0 || !profileUserId) return;
        const { data } = await api.post("/api/posters/batch", {
          userId: profileUserId,
          movieIds: uniqueIds,
        });
        if (data && typeof data === "object") setCustomPostersState(data);
      } catch (err) {
        console.error("❌ Failed to load custom posters", err);
      }
    };
    fetchCustomPosters();
  }, [logs, profileUserId]);

  // Sorting & filtering
// inside ProfileTabFilms component

// Sorting & filtering
const sortedLogs = useMemo(() => {
    let base = Array.isArray(logs) ? [...logs] : [];
  
    if (sortType === "favorites") {
      base = base.filter((lg) => {
        const id = toTmdbIdAny(lg);
        return id && isFav(id);
      });
    }
  
    // ✅ Deduplicate by tmdbId so only one entry per movie appears
    const seen = new Set();
    base = base.filter((log) => {
      const id = toTmdbIdAny(log);
      if (!id) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  
    const dir = order === "asc" ? 1 : -1;
  
    base.sort((a, b) => {
      let valA = 0,
        valB = 0;
  
      switch (sortType) {
        case "rating":
          valA = Number(a.rating || a.movie?.vote_average || 0);
          valB = Number(b.rating || b.movie?.vote_average || 0);
          break;
        case "added":
        case "favorites":
        default:
          valA = new Date(a.createdAt || a.watchedAt || 0).getTime();
          valB = new Date(b.createdAt || b.watchedAt || 0).getTime();
      }
  
      return (valA - valB) * dir;
    });
  
    return base;
  }, [logs, sortType, order, isFav]);
  
  const renderPoster = ({ item: lg }) => {
    const movieId = toTmdbIdAny(lg);
    const posterUrl = getPosterUrl({
      tmdbId: movieId,
      posterPath: lg.movie?.poster_path,
      override:
        customPostersState[movieId] ||
        customPosters?.[movieId] ||
        lg.posterOverride ||
        lg.movie?.posterOverride,
    });
  
    const rating = lg.rating || lg.myRating || 0;
    const hasReview =
      !!(lg.review && lg.review.trim().length > 0 && lg.review.trim().toLowerCase() !== "__media__");
    const favorite = isFav(movieId);
  
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
            // ✅ normalize userId
            const movieLogs = logs.filter((log) => {
              const logUserId =
                typeof log.user === "string"
                  ? log.user
                  : log.user?._id || log.user?.id || null;
              return toTmdbIdAny(log) === movieId && String(logUserId) === String(profileUserId);
            });
          
            if (movieLogs.length === 0) {
              navigation.navigate("Movie", { id: movieId });
            } else if (movieLogs.length === 1) {
              const onlyLog = movieLogs[0];
              const hasReview =
                !!(onlyLog.review &&
                  onlyLog.review.trim().length > 0 &&
                  onlyLog.review.trim().toLowerCase() !== "__media__");
          
              if (hasReview) {
                navigation.navigate("ReviewPage", { reviewId: onlyLog._id });
              } else {
                navigation.navigate("Movie", { id: movieId });
              }
            } else {
              navigation.navigate("ReviewPickerScreen", {
                movieId,
                userId: profileUserId,
              });
            }
          }}
          
      >
        <Image source={{ uri: posterUrl || FALLBACK_POSTER }} style={styles.poster} />
        <View style={styles.metaBar}>
          {rating > 0 && <StarRating rating={rating} size={12} />}
          {hasReview && <MaterialCommunityIcons name="chat-outline" size={12} color="#bbb" />}
          {favorite && <MaterialIcons name="favorite" size={13} color="#B327F6" />}
        </View>
      </TouchableOpacity>
    );
  };
  
  
  

  return (
    <View style={{ flex: 1 }}>
      {/* Controls row */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.filterText}>
            {t("Sort")}:{" "}
            {sortType === "added"
              ? t("Recently Added")
              : sortType === "rating"
              ? t("Rating")
              : t("Favorites")}{" "}
            {order === "asc" ? "⬆" : "⬇"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <View style={styles.modalBox}>
            {[
              ["added", t("Recently Added")],
              ["rating", t("Rating")],
              ["favorites", t("Favorites")],
            ].map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={styles.modalItem}
                onPress={() => {
                  setSortType(val);
                  setSortModalVisible(false);
                }}
              >
                <Text style={styles.modalText}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.modalItem,
                { borderTopWidth: 1, borderColor: "#333" },
                sortType === "favorites" && { opacity: 0.5 },
              ]}
              disabled={sortType === "favorites"}
              onPress={() => {
                setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                setSortModalVisible(false);
              }}
            >
              <Text style={styles.modalText}>
                {order === "asc" ? t("⬆ Ascending") : t("⬇ Descending")}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#B327F6" />
          <Text style={{ color: "#aaa", marginTop: 8 }}>{t("Loading films...")}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedLogs}
          renderItem={renderPoster}
          keyExtractor={(lg, idx) => lg._id || String(toTmdbIdAny(lg) ?? idx)}
          numColumns={numColumns}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ gap: 8, paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  filterBtn: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: { color: "white", fontSize: 13, fontWeight: "500" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 8,
    width: 220,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalItem: { paddingVertical: 10, paddingHorizontal: 16 },
  modalText: { color: "#fff", fontSize: 14 },

  card: { flex: 1 },
  poster: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "#111",
  },
  metaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  loading: { marginTop: 40, alignItems: "center" },
});
