// src/components/profile/ProfileTabReviews.js
import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import useTranslate from "shared/utils/useTranslate";
import StarRating from "../StarRating";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

// ✅ Scene timestamp (never localized, date after 7d)
const formatTimestamp = (date) => {
  if (!date) return "";
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  const year = Math.floor(day / 365);

  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day <= 7) return `${day}d ago`;

  const d = new Date(date);
  if (year >= 1) return `${d.getUTCFullYear()}`;
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

// 🔎 helpers
const extractId = (val) => {
  if (!val) return null;
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object")
    return String(val.userId || val.user || val._id || val.id || val.ownerId || val.createdBy || "");
  return null;
};

const arrayHasMyId = (arr, myId) =>
  !!myId && Array.isArray(arr) && arr.some((x) => String(extractId(x)) === String(myId));

const toTmdbId = (log) =>
  log?.tmdbId ??
  log?.movie?.tmdbId ??
  log?.movie?.id ??
  log?.movieId ??
  (typeof log?.movie === "string" || typeof log?.movie === "number" ? log.movie : null);

export default function ProfileTabReviews({
  logs,
  filter,
  setFilter,
  navigation,
  handleLike,
  customPosters = {},
  currentUserId, // optional: pass in if you have it
}) {
  const t = useTranslate();

  // ✅ RN-friendly myId (AsyncStorage), fallback to globals if not found
  const [myId, setMyId] = useState(currentUserId ?? null);
  useEffect(() => {
    if (currentUserId) return; // already provided
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : null;
        const id =
          parsed?._id ||
          parsed?.id ||
          parsed?.user?._id ||
          parsed?.user?.id ||
          global?.auth?.user?._id ||
          global?.currentUser?._id ||
          global?.__USER?._id ||
          global?.me?._id ||
          global?.user?._id ||
          null;
        setMyId(id ? String(id) : null);
      } catch {
        setMyId(
          global?.auth?.user?._id ||
            global?.currentUser?._id ||
            global?.__USER?._id ||
            global?.me?._id ||
            global?.user?._id ||
            null
        );
      }
    })();
  }, [currentUserId]);

  // ✅ Only keep logs with text/gif/image review
  const filtered = useMemo(() => {
    const arr = Array.isArray(logs) ? logs : [];
    return arr
      .filter((log) => {
        const hasText =
          log.review &&
          log.review.trim() !== "" &&
          log.review.trim().toLowerCase() !== "__media__";
        return hasText || log.gif || log.image;
      })
      .sort((a, b) => {
        if (filter === "likes") {
          const aCount = Array.isArray(a.likes) ? a.likes.length : (a.likesCount || 0);
          const bCount = Array.isArray(b.likes) ? b.likes.length : (b.likesCount || 0);
          return bCount - aCount;
        }
        return new Date(b.watchedAt) - new Date(a.watchedAt);
      });
  }, [logs, filter]);

  const renderItem = ({ item: log }) => {
    const tmdbId = toTmdbId(log);
    const poster =
      log.posterOverride ||
      (tmdbId && customPosters[String(tmdbId)]) ||
      log.poster ||
      FALLBACK_POSTER;

    const likedByMe =
      log?.likedByMe === true ||
      log?.isLikedByMe === true ||
      arrayHasMyId(log?.likes, myId) ||
      arrayHasMyId(log?.likedBy, myId);

    const likesCount = Array.isArray(log?.likes) ? log.likes.length : (log?.likesCount || 0);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          const hasReview = log.review?.trim();
          if (hasReview) {
            navigation.navigate("ReviewPage", { id: log._id });
          } else if (tmdbId) {
            navigation.navigate("MoviePage", { id: tmdbId });
          }
        }}
      >
        {/* ⏰ Timestamp */}
        <Text style={styles.timestamp}>{formatTimestamp(log.watchedAt)}</Text>

        <View style={styles.row}>
          {/* 🎬 Poster */}
          <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />

          {/* Review Content */}
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {log.title}
            </Text>

            {/* ⭐ Rating */}
            <StarRating rating={Number(log.rating) || 0} size={14} />

            {/* 📝 Review Text */}
            {log.review &&
              !["[GIF ONLY]", "[IMAGE ONLY]", "__media__"].includes(
                log.review.trim()
              ) && (
                <Text style={styles.review} numberOfLines={4}>
                  {log.review}
                </Text>
              )}
          </View>
        </View>

        {/* 🎁 Media Preview */}
        {(log.image || log.gif) && (
          <Image source={{ uri: log.image || log.gif }} style={styles.media} resizeMode="cover" />
        )}

        {/* ❤️ Likes + 💬 Replies */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.likeRow}
            onPress={() => handleLike?.(log._id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name={likedByMe ? "favorite" : "favorite-border"}
              size={16}
              color={likedByMe ? "#B327F6" : "#999"}
            />
            <Text
              style={[
                styles.likeCount,
                { color: likedByMe ? "#B327F6" : "#999" },
              ]}
            >
              {likesCount}
            </Text>
          </TouchableOpacity>

          {log.replies?.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate("RepliesPage", { id: log._id })}
            >
              <Text style={styles.replies}>
                💬 {log.replies.length}{" "}
                {log.replies.length === 1 ? t("reply") : t("replies")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ensure re-render when myId loads and when likes change on items
  const extraKey =
    (myId || "none") +
    "|" +
    filtered
      .map((l) => {
        const liked =
          l?.likedByMe === true ||
          l?.isLikedByMe === true ||
          arrayHasMyId(l?.likes, myId) ||
          arrayHasMyId(l?.likedBy, myId);
        const count = Array.isArray(l?.likes) ? l.likes.length : (l?.likesCount || 0);
        return `${l._id}:${count}:${liked ? 1 : 0}`;
      })
      .join("|");

  return (
    <View style={{ flex: 1 }}>
      {/* 🔝 Header: Reviews count + filter */}
      <View style={styles.headerRow}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{filtered.length}</Text>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "recent" && styles.filterBtnActive]}
            onPress={() => setFilter("recent")}
          >
            <Text
              style={[styles.filterText, filter === "recent" && styles.filterTextActive]}
            >
              {t("Most Recent")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "likes" && styles.filterBtnActive]}
            onPress={() => setFilter("likes")}
          >
            <Text
              style={[styles.filterText, filter === "likes" && styles.filterTextActive]}
            >
              {t("Most Likes")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(log) => log._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        extraData={extraKey}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
  },
  bubble: {
    backgroundColor: "#181818",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  filterBtnActive: {
    backgroundColor: "#B327F6",
  },
  filterText: {
    fontSize: 12,
    color: "#ccc",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#181818",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    position: "relative",
    marginHorizontal: 0,
  },
  timestamp: {
    position: "absolute",
    top: 12,
    right: 12,
    fontSize: 11,
    color: "#888",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  poster: {
    width: 90,
    height: 135,
    borderRadius: 8,
    marginRight: 12,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  review: {
    color: "#ccc",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  media: {
    width: "100%",
    borderRadius: 10,
    height: 180,
    marginTop: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: {
    fontSize: 13,
    marginLeft: 4,
  },
  replies: {
    fontSize: 12,
    color: "#999",
  },
});
