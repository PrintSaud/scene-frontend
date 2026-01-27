// src/screens/ReviewPickerScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { likeLog } from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import StarRating from "../components/StarRating";
import { formatTimestamp } from "shared/utils/time";
import { MaterialIcons } from "@expo/vector-icons";
import api from "shared/api/api";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

export default function ReviewPickerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { movieId, userId } = route.params || {};

  const t = useTranslate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const user = JSON.parse(await AsyncStorage.getItem("user"));
      setMyUserId(user?._id);
    })();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/api/logs/user/${userId}/movie/${movieId}`);
        setLogs(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch reviews", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [movieId, userId]);

  const handleLike = async (logId) => {
    try {
      await likeLog(logId);
      setLogs((prev) =>
        prev.map((log) =>
          log._id === logId
            ? {
                ...log,
                likes: log.likes?.includes(myUserId)
                  ? log.likes.filter((id) => id !== myUserId)
                  : [...(log.likes || []), myUserId],
              }
            : log
        )
      );
    } catch (err) {
      console.error("❌ Failed to like/unlike log:", err);
    }
  };

  const renderLog = ({ item: log }) => {
    const poster =
      log.posterOverride ||
      (log.movie?.posterOverride
        ? log.movie.posterOverride
        : log.poster
        ? log.poster.startsWith("http")
          ? log.poster
          : `${TMDB_IMG}${log.poster}`
        : FALLBACK_POSTER);

    const isLikedByMe = log.likes?.includes(myUserId);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (log.review?.trim()) {
            navigation.navigate("ReviewPage", { reviewId: log._id });
          } else {
            navigation.navigate("Movie", { id: movieId });
          }
        }}
      >
        {/* Timestamp */}
        <Text style={styles.timestamp}>{formatTimestamp(log.watchedAt, t)}</Text>

        {/* Poster + Content */}
        <View style={styles.topRow}>
          <Image source={{ uri: poster }} style={styles.poster} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{log.title}</Text>

            {/* Rating */}
            {log.rating > 0 && (
              <View style={{ marginTop: 4 }}>
                <StarRating rating={log.rating} size={14} />
              </View>
            )}

            {/* Review */}
            {log.review ? (
              <Text numberOfLines={3} style={styles.reviewText}>
                {log.review}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Image or GIF */}
        {log.image && <Image source={{ uri: log.image }} style={styles.media} />}
        {log.gif && <Image source={{ uri: log.gif }} style={styles.media} />}

        {/* Likes + Replies */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              handleLike(log._id);
            }}
          >
            <MaterialIcons
              name={isLikedByMe ? "favorite" : "favorite-border"}
              size={16}
              color={isLikedByMe ? "#B327F6" : "#999"}
            />
            <Text style={styles.count}>{log.likes?.length || 0}</Text>
          </TouchableOpacity>

          {log.replies?.length > 0 && (
            <Text style={styles.replies}>
              💬 {log.replies.length}{" "}
              {log.replies.length === 1
                ? t("reviewPicker.reply")
                : t("reviewPicker.replies")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#B327F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
      </TouchableOpacity>

      <FlatList
        data={logs}
        keyExtractor={(log) => log._id}
        renderItem={renderLog}
        contentContainerStyle={{
          paddingTop: 100,
          paddingHorizontal: 12,
          gap: 12,
          paddingBottom: 40,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e0e", // ✅ Scene’s background
  },
  backBtn: {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: "#181818",
    padding: 12,
    borderRadius: 10,
    position: "relative",
  },
  timestamp: {
    position: "absolute",
    top: 12,
    right: 12,
    fontSize: 11,
    color: "#888",
  },
  topRow: { flexDirection: "row", gap: 12 },
  poster: {
    width: 90,
    height: 135,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  title: { color: "#fff", fontSize: 15, fontWeight: "600" },
  reviewText: { color: "#ccc", fontSize: 13, marginTop: 8 },
  media: {
    width: "100%",
    borderRadius: 10,
    maxHeight: 220,
    resizeMode: "cover",
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  count: { fontSize: 13, color: "#999" },
  replies: { fontSize: 12, color: "#999" },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0e0e0e",
    justifyContent: "center",
    alignItems: "center",
  },
});
