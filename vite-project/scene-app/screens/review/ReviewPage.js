// src/screens/review/ReviewPage.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { likeLog, likeReply } from "shared/api/api";
import ReviewHeader from "./ReviewHeader";
import MoreReviewsList from "./MoreReviewsList";
import StarRating from "../../components/StarRating";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../components/BottomNav"; // ✅ navbar

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

// ✅ Full-width media helper
function FullWidthMedia({ uri, style }) {
  const [ratio, setRatio] = useState(null);

  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => setRatio(h ? w / h : 16 / 9),
      () => setRatio(16 / 9)
    );
  }, [uri]);

  if (!uri) return null;

  return (
    <View style={styles.mediaWrap}>
      <Image
        source={{ uri }}
        resizeMode="contain"
        style={[
          styles.mediaFull,
          ratio ? { aspectRatio: ratio } : { aspectRatio: 16 / 9 },
          style,
        ]}
      />
    </View>
  );
}

export default function ReviewPage() {
  const t = useTranslate();
  const navigation = useNavigation();
  const route = useRoute();
  const { reviewId, id: paramId } = route.params || {};
const id = reviewId || paramId;


  const [animatingLikeId, setAnimatingLikeId] = useState(null);
  const [review, setReview] = useState(null);
  const [replies, setReplies] = useState([]);
  const [moreReviews, setMoreReviews] = useState([]);

  const [user, setUser] = useState(null);
  const userId = user?._id;

  const [loading, setLoading] = useState(true);

  const showSceneToast = (message, variant = "success") => {
    Toast.show({ type: "scene", text1: message, props: { title: message, variant } });
  };

  // --- Date formatting helpers ---
  const MONTHS_EN = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    []
  );
  const englishOrdinal = (n) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}`;
    switch (n % 10) {
      case 1:
      case 2:
      case 3:
        return `${n}`;
      default:
        return `${n}`;
    }
  };
  function formatRelative(iso) {
    if (!iso) return "";
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return t("Just now");
    if (diffMs < hour) return t("{{n}}m ago", { n: Math.floor(diffMs / minute) });
    if (diffMs < day) return t("{{n}}h ago", { n: Math.floor(diffMs / hour) });
    if (diffMs <= 7 * day) return t("{{n}}d ago", { n: Math.floor(diffMs / day) });

    const d = new Date(iso);
    const dayNum = d.getDate();
    const monthName = MONTHS_EN[d.getMonth()];
    return `${englishOrdinal(dayNum)} ${monthName}`;
  }

  // 🔑 Load user
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/logs/${id}`);
      setReview(data);
      setReplies(data.replies || []);

      if (data.user?._id) {
        const res = await api.get(`/api/logs/user/${data.user._id}`);
        const filtered = res.data.filter((r) => r._id !== id);
        setMoreReviews(filtered.slice(0, 3));
      } else {
        setMoreReviews([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch review:", err);
      showSceneToast(t("Failed to load review."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [route.params?.refreshAfterBackdropChange])
  );

  const handleLike = async () => {
    if (!userId) return showSceneToast(t("You must be logged in to like."), "error");
    try {
      await likeLog(id);
      setReview((prev) => ({
        ...prev,
        likes: (prev.likes || []).includes(userId)
          ? prev.likes.filter((uid) => uid !== userId)
          : [...(prev.likes || []), userId],
      }));
      setAnimatingLikeId(review?._id);
      setTimeout(() => setAnimatingLikeId(null), 300);
    } catch {
      showSceneToast(t("Failed to like."), "error");
    }
  };

  const handleReplyLike = async (replyId) => {
    if (!userId) return showSceneToast(t("You must be logged in to like."), "error");
    try {
      await likeReply(id, replyId);
      setReplies((prev) =>
        prev.map((r) =>
          r._id === replyId
            ? {
                ...r,
                likes: (r.likes || []).includes(userId)
                  ? r.likes.filter((uid) => uid !== userId)
                  : [...(r.likes || []), userId],
              }
            : r
        )
      );
      setAnimatingLikeId(replyId);
      setTimeout(() => setAnimatingLikeId(null), 300);
    } catch {
      showSceneToast(t("Failed to like reply."), "error");
    }
  };

  const handleDelete = async () => {
    Alert.alert(t("Delete this review?"), "", [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/logs/${review._id}`);
            showSceneToast(t("Review deleted!"), "success");
            navigation.navigate("Profile");
          } catch (err) {
            showSceneToast(t("Failed to delete review."), "error");
          }
        },
      },
    ]);
  };

  if (loading || !review) {
    return (
      <View style={styles.loaderScreen}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#B327F6" />
          <Text style={styles.loaderText}>{t("Loading review…")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ReviewHeader
          review={review}
          userId={userId}
          rewatchCount={review.rewatchCount}
          onLike={handleLike}
          onDelete={handleDelete}
          onEdit={() =>
            navigation.navigate("LogScreen", {
              editLogId: review._id,
              movieId: review.movie?.id || review.movie,
            })
          }
          onChangeBackdrop={() =>
            navigation.navigate("ChangeReviewBackdrop", { reviewId: review._id })
          }
        />

        {/* Comments */}
        <View style={styles.commentsHeader}>
          <Text style={styles.sectionTitle}>{t("Comments")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("RepliesPage", { id })}>
            <Text style={styles.moreText}>{t("More →")}</Text>
          </TouchableOpacity>
        </View>

        {replies.length === 0 ? (
          <Text style={styles.noComments}>{t("No comments yet.")}</Text>
        ) : (
          replies
            .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
            .slice(0, 3)
            .map((r) => {
              const isLikedByMe = r.likes?.includes(userId);
              return (
                <View key={r._id} style={styles.reply}>
                    <TouchableOpacity
  onPress={() => navigation.navigate("ProfileScreen", { id: r.userId })}
>
  <Image
    source={{ uri: r.avatar || FALLBACK_AVATAR }}
    style={styles.avatar}
  />
</TouchableOpacity>


                  <View style={{ flex: 1 }}>
                    <View style={styles.replyHeader}>
                      <Text style={styles.username}>@{r.username}</Text>
                      {r.ratingForThisMovie ? (
                        <StarRating rating={r.ratingForThisMovie} size={12} />
                      ) : null}
                      {review.rewatchCount > 1 && (
                        <View style={styles.rewatch}>
                          <Text style={styles.rewatchText}>{review.rewatchCount}x</Text>
                        </View>
                      )}
                      <Text style={styles.time}>{formatRelative(r.createdAt)}</Text>
                    </View>

                    {r.text ? <Text style={styles.replyText}>{r.text}</Text> : null}

                    {r.gif ? <FullWidthMedia uri={r.gif} /> : null}
                    {r.image ? <FullWidthMedia uri={r.image} /> : null}

                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("RepliesPage", {
                          id,
                          parentCommentId: r._id,
                          parentUsername: r.username,
                        })
                      }
                    >
                      <Text style={styles.replyButton}>{t("Reply")}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.likeBtn}
                    onPress={() => handleReplyLike(r._id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                     <Ionicons
   name={isLikedByMe ? "heart" : "heart-outline"}
   size={16}
   color={isLikedByMe ? "#B327F6" : "#A6A6A6"}
 />
                    <Text
                      style={[styles.likeCount, isLikedByMe && styles.likeCountActive]}
                    >
                      {r.likes?.length || 0}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
        )}

        <MoreReviewsList
          reviews={moreReviews}
          onClick={(rid) => navigation.navigate("ReviewPage", { id: rid })}
        />
      </ScrollView>

      {/* ✅ Bottom navigation bar */}
      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0e0e" },
  loaderScreen: {
    flex: 1,
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: { color: "#aaa", marginTop: 6 },

  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, color: "#fff" },
  moreText: { color: "#888", fontSize: 13 },
  noComments: { color: "#888", fontSize: 14, marginLeft: 20 },

  reply: { flexDirection: "row", alignItems: "flex-start", padding: 12 },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  replyHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  username: { fontSize: 14, color: "#ddd" },
  time: { fontSize: 10, color: "#888", marginLeft: 6 },
  replyText: { fontSize: 14, color: "#ddd", marginTop: 2 },

  mediaWrap: {
    marginTop: 6,
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaFull: { width: "100%" },

  replyButton: { color: "#888", fontSize: 13, marginTop: 4 },

  likeBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 8 },
  likeCount: { fontSize: 12, color: "#A6A6A6" },
  likeCountActive: { color: "#B327F6", fontWeight: "600" },

  rewatch: { flexDirection: "row", alignItems: "center", marginLeft: 6 },
  rewatchText: { fontSize: 10, color: "#aaa" },
});
