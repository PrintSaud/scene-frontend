// src/screens/MovieReviewsScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useTranslate from "../../../shared/utils/useTranslate";
import StarRating from "../components/StarRating";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { backend as BACKEND_CONFIG } from "../../../shared/config";
import GifSearchModal from "../components/GifSearchModal";
import * as ImagePicker from "expo-image-picker";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Toast from "react-native-toast-message";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  BACKEND_CONFIG ||
  "https://backend.scenesa.com";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const INPUT_H = 58;
const MEDIA_MARKERS = ["__media__", "[GIF ONLY]", "[IMAGE ONLY]"];

function AutoSizedImage({ uri }) {
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    if (!uri) return;

    Image.getSize(
      uri,
      (w, h) => {
        if (w && h) setRatio(w / h);
        else setRatio(1);
      },
      () => setRatio(1)
    );
  }, [uri]);

  if (!uri) return null;

  return (
    <Image
      source={{ uri }}
      style={styles.autoMedia}
      resizeMode="contain"
    />
  );
}

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reviews)) return payload.reviews;
  if (Array.isArray(payload?.logs)) return payload.logs;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getAvatarUri(avatar) {
  if (!avatar) return FALLBACK_AVATAR;

  if (
    typeof avatar === "string" &&
    (avatar.startsWith("http") || avatar.startsWith("data:"))
  ) {
    return avatar;
  }

  if (typeof avatar === "string" && BACKEND_URL) {
    return `${BACKEND_URL}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
  }

  return FALLBACK_AVATAR;
}

function normalizeReview(log) {
  const rawReview = typeof log?.review === "string" ? log.review.trim() : "";
  const mediaUrl = log?.mediaUrl || "";

  let gif = log?.gif || null;
  let image = log?.image || null;

  if (MEDIA_MARKERS.includes(rawReview)) {
    if (!gif && mediaUrl && mediaUrl.toLowerCase().includes(".gif")) {
      gif = mediaUrl;
    }

    if (!image && mediaUrl && !mediaUrl.toLowerCase().includes(".gif")) {
      image = mediaUrl;
    }

    return {
      ...log,
      review: "",
      gif,
      image,
    };
  }

  return {
    ...log,
    gif,
    image,
  };
}

function hasVisibleReview(log) {
  const raw = typeof log?.review === "string" ? log.review.trim() : "";
  const hasText = raw.length > 0 && !MEDIA_MARKERS.includes(raw);
  const hasGif = !!log?.gif;
  const hasImage = !!log?.image;
  const hasMediaUrl = !!log?.mediaUrl;

  return hasText || hasGif || hasImage || hasMediaUrl;
}

function hasLiked(likes, userId) {
  if (!userId || !Array.isArray(likes)) return false;
  return likes.some((x) => String(x) === String(userId));
}

export default function MovieReviewsScreen() {
  const route = useRoute();
  const stackNav = useNavigation();
  const insets = useSafeAreaInsets();

  const { id, initialFilter = "all", replyTo, parentUsername } = route.params || {};
  const { showActionSheetWithOptions } = useActionSheet();
  const t = useTranslate();

  const [selectedGif, setSelectedGif] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [showGifModal, setShowGifModal] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [refreshing, setRefreshing] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState(initialFilter === "friends" ? "friends" : "all");
  const [userId, setUserId] = useState(null);
  const [animatingLikes, setAnimatingLikes] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [input, setInput] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const inputRef = useRef(null);

  const showSceneToast = (message) => {
    Toast.show({
      type: "scene",
      text1: message,
      position: "bottom",
    });
  };

  const getRelativeTime = (iso) => {
    if (!iso) return "";

    const d = new Date(iso).getTime();
    const diff = Date.now() - d;

    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    const year = Math.floor(day / 365);

    if (min < 1) return t("time.just_now") || "Just now";
    if (min < 60) return t("time.minutes_ago", { min }) || `${min}m ago`;
    if (hr < 24) return t("time.hours_ago", { hr }) || `${hr}h ago`;
    if (day <= 7) return t("time.days_ago", { day }) || `${day}d ago`;

    const x = new Date(iso);

    if (year >= 1) return `${x.getUTCFullYear()}`;

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    return `${monthNames[x.getUTCMonth()]} ${x.getUTCDate()}`;
  };

  const fetchReviews = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const raw = await AsyncStorage.getItem("user");
      const me = raw ? JSON.parse(raw) : null;

      const headers = me?.token ? { Authorization: `Bearer ${me.token}` } : {};

      const baseEndpoint =
        filter === "friends"
          ? `${BACKEND_URL}/api/logs/movie/${id}/friends`
          : `${BACKEND_URL}/api/logs/movie/${id}/popular`;

      const primaryEndpoint =
        filter === "friends" ? baseEndpoint : `${baseEndpoint}?all=true`;

      const res = await fetch(primaryEndpoint, {
        headers,
        credentials: "include",
      });

      const text = await res.text();

      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (!res.ok) {
        console.warn("❌ Failed to fetch reviews", res.status, text);
        setReviews([]);
        setTotalCount(0);
        return;
      }

      let arr = asArray(json);

      // Extra fallback: same behavior as MovieScreen.
      if (filter === "all" && arr.length === 0) {
        const fallbackRes = await fetch(baseEndpoint, {
          headers,
          credentials: "include",
        });

        const fallbackText = await fallbackRes.text();

        let fallbackJson = null;
        try {
          fallbackJson = JSON.parse(fallbackText);
        } catch {
          fallbackJson = null;
        }

        if (fallbackRes.ok) {
          arr = asArray(fallbackJson);
        }
      }

      const normalized = arr.map(normalizeReview);
      const visible = normalized.filter(hasVisibleReview);

      setTotalCount(visible.length);
      setReviews(visible);

      if (__DEV__) {
        console.log("✅ MovieReviewsScreen loaded", {
          id,
          filter,
          endpoint: primaryEndpoint,
          rawTotal: arr.length,
          visible: visible.length,
          sample: visible[0],
        });
      }
    } catch (e) {
      console.warn("❌ Failed to load reviews", e);
      setReviews([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const me = raw ? JSON.parse(raw) : null;
        setUserId(me?._id || null);
      } catch {
        setUserId(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (replyTo && parentUsername) {
      setReplyingTo({ id: replyTo, username: parentUsername });
      setActiveReviewId(replyTo);
      setInput(`@${parentUsername} `);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [replyTo, parentUsername]);

  useEffect(() => {
    fetchReviews();
  }, [id, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleReply = (commentId, username, reviewId) => {
    setReplyingTo({ id: commentId, username: username || "user" });
    setActiveReviewId(reviewId);
    setInput(`@${username || "user"} `);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setActiveReviewId(null);
    setInput("");
    setSelectedGif("");
    setSelectedImage("");
  };

  const handleSend = async () => {
    if (!activeReviewId) return;
    if (!input.trim() && !selectedGif && !selectedImage) return;

    try {
      const raw = await AsyncStorage.getItem("user");
      const me = raw ? JSON.parse(raw) : null;
      if (!me?.token) return;

      const fd = new FormData();
      fd.append("text", input.trim());

      if (replyingTo?.id) fd.append("parentComment", replyingTo.id);
      if (selectedGif) fd.append("gif", selectedGif);

      if (selectedImage) {
        const filename = selectedImage.split("/").pop() || "upload.jpg";

        fd.append("image", {
          uri: selectedImage,
          type: "image/jpeg",
          name: filename,
        });
      }

      const res = await fetch(`${BACKEND_URL}/api/logs/${activeReviewId}/reply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${me.token}` },
        body: fd,
      });

      if (!res.ok) {
        const errTxt = await res.text();
        console.warn("❌ Failed reply:", res.status, errTxt);
        showSceneToast("❌ Failed to send reply");
        return;
      }

      setInput("");
      setSelectedGif("");
      setSelectedImage("");
      setReplyingTo(null);
      setActiveReviewId(null);

      showSceneToast("💬 Reply posted successfully!");
      await fetchReviews();
    } catch (e) {
      console.warn("❌ Failed to send reply", e);
      showSceneToast("⚠️ Something went wrong");
    }
  };

  const handleLike = async (reviewId) => {
    if (!userId) return;

    setReviews((prev) =>
      prev.map((r) => {
        if (r._id !== reviewId) return r;

        const liked = hasLiked(r.likes, userId);

        return {
          ...r,
          likes: liked
            ? (r.likes || []).filter((x) => String(x) !== String(userId))
            : [...(r.likes || []), userId],
        };
      })
    );

    setAnimatingLikes((prev) => [...prev, reviewId]);

    setTimeout(() => {
      setAnimatingLikes((prev) => prev.filter((x) => x !== reviewId));
    }, 400);

    try {
      const raw = await AsyncStorage.getItem("user");
      const me = raw ? JSON.parse(raw) : null;
      if (!me?.token) return;

      await fetch(`${BACKEND_URL}/api/logs/${reviewId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${me.token}` },
      });
    } catch (e) {
      console.warn("❌ like failed", e);
    }
  };

  const handleLikeReply = async (reviewId, replyId) => {
    if (!userId) return;

    setReviews((prev) =>
      prev.map((r) => {
        if (r._id !== reviewId) return r;

        return {
          ...r,
          replies: Array.isArray(r.replies)
            ? r.replies.map((rep) => {
                if (rep._id !== replyId) return rep;

                const liked = hasLiked(rep.likes, userId);

                return {
                  ...rep,
                  likes: liked
                    ? (rep.likes || []).filter((x) => String(x) !== String(userId))
                    : [...(rep.likes || []), userId],
                };
              })
            : [],
        };
      })
    );

    try {
      const raw = await AsyncStorage.getItem("user");
      const me = raw ? JSON.parse(raw) : null;
      if (!me?.token) return;

      await fetch(`${BACKEND_URL}/api/logs/${reviewId}/replies/${replyId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${me.token}` },
      });
    } catch (e) {
      console.warn("❌ like reply failed", e);
    }
  };

  const handleReplyMenu = (reply, reviewId) => {
    const options = ["Delete", "Cancel"];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: "Reply options",
      },
      async (buttonIndex) => {
        if (buttonIndex === destructiveButtonIndex) {
          await deleteReply(reply._id, reviewId);
        }
      }
    );
  };

  const deleteReply = async (replyId, reviewId) => {
    try {
      const raw = await AsyncStorage.getItem("user");
      const me = raw ? JSON.parse(raw) : null;
      if (!me?.token) return;

      const res = await fetch(`${BACKEND_URL}/api/logs/${reviewId}/replies/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${me.token}` },
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn("❌ Failed to delete reply", res.status, err);
        showSceneToast("❌ Failed to delete reply");
        return;
      }

      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                replies: Array.isArray(r.replies)
                  ? r.replies.filter((rep) => rep._id !== replyId)
                  : [],
              }
            : r
        )
      );

      showSceneToast("🗑️ Reply deleted");
    } catch (e) {
      console.warn("❌ delete reply failed", e);
      showSceneToast("⚠️ Delete failed");
    }
  };

  const title =
    filter === "friends"
      ? String(t("friends_reviews") || "Friends’ Reviews")
      : String(t("all_reviews") || "All Reviews");

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => stackNav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
            {filter === "all" && totalCount ? ` (${totalCount})` : ""}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <View style={styles.pillRow}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={[styles.pill, filter === "all" && styles.pillActive]}
        >
          <Text style={[styles.pillTxt, filter === "all" && styles.pillTxtActive]}>
            {String(t("all") || "All")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter("friends")}
          style={[styles.pill, filter === "friends" && styles.pillActive]}
        >
          <Text style={[styles.pillTxt, filter === "friends" && styles.pillTxtActive]}>
            {String(t("friends") || "Friends")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: replyingTo ? 160 + insets.bottom : 44,
          paddingTop: 8,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {!loading && reviews.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>
              {String(t("no_reviews_found") || "No reviews found.")}
            </Text>
            <Text style={styles.emptySub}>
              {String(t("pull_to_refresh") || "Pull to refresh or check again later.")}
            </Text>
          </View>
        )}

        {reviews.map((r) => {
          const meLiked = hasLiked(r.likes, userId);

          const rawReview = typeof r.review === "string" ? r.review.trim() : "";
          const reviewText =
            rawReview && !MEDIA_MARKERS.includes(rawReview) ? rawReview : "";

          const rewatchNum =
            typeof r.rewatchCount === "number"
              ? r.rewatchCount
              : typeof r.rewatch === "number"
              ? r.rewatch
              : 0;

          return (
            <View key={String(r._id)} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <TouchableOpacity
                  onPress={() =>
                    r.user?._id && stackNav.navigate("ProfileScreen", { id: r.user._id })
                  }
                >
                  <Image
                    source={{ uri: getAvatarUri(r.user?.avatar) }}
                    style={styles.avatar}
                  />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <View style={styles.userRow}>
                    <TouchableOpacity
                      onPress={() =>
                        r.user?._id &&
                        stackNav.navigate("ProfileScreen", { id: r.user._id })
                      }
                    >
                      <Text style={styles.username} numberOfLines={1}>
                        @{String(r.user?.username || "user")}
                      </Text>
                    </TouchableOpacity>

                    {typeof r.rating === "number" && (
                      <StarRating rating={Number(r.rating) || 0} size={12} />
                    )}

                    {rewatchNum > 0 && (
                      <View style={styles.rewatchWrap}>
                        <MaterialIcons name="refresh" size={12} color="#aaa" />
                        <Text style={styles.rewatchText}>{rewatchNum}x</Text>
                      </View>
                    )}

                    <Text style={styles.timeText}>{getRelativeTime(r.createdAt)}</Text>
                  </View>

                  {!!reviewText && <Text style={styles.bodyText}>{reviewText}</Text>}

                  {!!r.gif && <AutoSizedImage uri={r.gif} />}
                  {!!r.image && <AutoSizedImage uri={r.image} />}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => handleReply(r._id, r.user?.username, r._id)}
                    >
                      <Text style={styles.replyTxt}>
                        {String(t("reply") || "Reply")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleLike(r._id)}
                      style={styles.likeButton}
                    >
                      <View
                        style={{
                          transform: [
                            { scale: animatingLikes.includes(r._id) ? 1.35 : 1 },
                          ],
                        }}
                      >
                        <Ionicons
                          name={meLiked ? "heart" : "heart-outline"}
                          size={17}
                          color={meLiked ? "#B327F6" : "#888"}
                        />
                      </View>

                      <Text
                        style={[
                          styles.likeCount,
                          meLiked && { color: "#B327F6" },
                        ]}
                      >
                        {String(r.likes?.length || 0)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {Array.isArray(r.replies) && r.replies.length > 0 && (
                    <View style={styles.repliesWrap}>
                      {r.replies.map((rep) => {
                        const replyUser = rep.user || {};
                        const replyAvatar = getAvatarUri(replyUser.avatar);
                        const replyUsername = replyUser.username || "user";
                        const replyLiked = hasLiked(rep.likes, userId);

                        return (
                          <View key={String(rep._id)} style={styles.replyItem}>
                            <View style={styles.replyTop}>
                              <TouchableOpacity
                                onPress={() =>
                                  replyUser._id &&
                                  stackNav.navigate("ProfileScreen", {
                                    id: replyUser._id,
                                  })
                                }
                              >
                                <Image source={{ uri: replyAvatar }} style={styles.replyAvatar} />
                              </TouchableOpacity>

                              <View style={{ flex: 1 }}>
                                <View style={styles.replyNameRow}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      replyUser._id &&
                                      stackNav.navigate("ProfileScreen", {
                                        id: replyUser._id,
                                      })
                                    }
                                  >
                                    <Text style={styles.replyUsername}>
                                      @{replyUsername}
                                    </Text>
                                  </TouchableOpacity>

                                  {userId && String(replyUser._id) === String(userId) && (
                                    <TouchableOpacity
                                      onPress={() => handleReplyMenu(rep, r._id)}
                                    >
                                      <MaterialIcons
                                        name="more-vert"
                                        size={18}
                                        color="#a8a8a8"
                                      />
                                    </TouchableOpacity>
                                  )}
                                </View>

                                {!!rep.text && (
                                  <Text style={styles.replyBody}>{rep.text}</Text>
                                )}

                                {!!rep.gif && <AutoSizedImage uri={rep.gif} />}
                                {!!rep.image && <AutoSizedImage uri={rep.image} />}

                                <Text style={styles.replyTime}>
                                  {getRelativeTime(rep.createdAt)}
                                </Text>

                                <View style={styles.replyActions}>
                                  <TouchableOpacity
                                    onPress={() => handleReply(rep._id, replyUsername, r._id)}
                                  >
                                    <Text style={styles.replyActionText}>
                                      {String(t("reply") || "Reply")}
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => handleLikeReply(r._id, rep._id)}
                                    style={styles.replyLikeButton}
                                  >
                                    <Ionicons
                                      name={replyLiked ? "heart" : "heart-outline"}
                                      size={14}
                                      color={replyLiked ? "#B327F6" : "#888"}
                                    />
                                    <Text
                                      style={[
                                        styles.replyLikeCount,
                                        replyLiked && { color: "#B327F6" },
                                      ]}
                                    >
                                      {String(rep.likes?.length || 0)}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {replyingTo?.id && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          style={[
            styles.composerWrap,
            {
              paddingBottom: Math.max(insets.bottom + 6, 12),
            },
          ]}
        >
          <View style={styles.replyingBar}>
            <Text style={styles.replyingText} numberOfLines={1}>
              Replying to @{replyingTo.username}
            </Text>

            <TouchableOpacity onPress={handleCancelReply}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.72)" />
            </TouchableOpacity>
          </View>

          {(selectedGif || selectedImage) && (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: selectedGif || selectedImage }}
                style={styles.previewImage}
              />

              <TouchableOpacity
                onPress={() => {
                  setSelectedGif("");
                  setSelectedImage("");
                }}
                style={styles.previewCloseBtn}
              >
                <Ionicons name="close" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

<View style={styles.glassInputWrap}>
  <TouchableOpacity
    onPress={pickImage}
    style={styles.iconBtn}
    activeOpacity={0.75}
  >
    <Ionicons name="image-outline" size={22} color="rgba(255,255,255,0.68)" />
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => setShowGifModal(true)}
    style={styles.gifBtn}
    activeOpacity={0.75}
  >
    <Text style={styles.gifText}>GIF</Text>
  </TouchableOpacity>

  <TextInput
    ref={inputRef}
    value={input}
    onChangeText={setInput}
    placeholder={String(t("Write a reply…") || "Write a reply…")}
    placeholderTextColor="rgba(255,255,255,0.34)"
    style={styles.input}
    multiline={false}
    returnKeyType="send"
    onSubmitEditing={handleSend}
  />

  <TouchableOpacity
    onPress={handleSend}
    disabled={!input.trim() && !selectedGif && !selectedImage}
    style={[
      styles.sendCircle,
      !input.trim() && !selectedGif && !selectedImage
        ? styles.sendCircleDisabled
        : null,
    ]}
    activeOpacity={0.8}
  >
    <Ionicons name="arrow-up" size={20} color="#fff" />
  </TouchableOpacity>
</View>

          {showGifModal && (
            <GifSearchModal
              onSelect={(gif) => {
                setSelectedGif(gif);
                setShowGifModal(false);
              }}
              onClose={() => setShowGifModal(false)}
            />
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#000000",
  },

  header: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#000000",
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    zIndex: 2,
  },

  headerCenter: {
    position: "absolute",
    left: 76,
    right: 76,
    bottom: 20,
    alignItems: "center",
  },

  headerRight: {
    width: 42,
    height: 42,
    marginLeft: "auto",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  pillRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#000000",
  },


  pill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  pillActive: {
    backgroundColor: "#B327F6",
    borderColor: "#B327F6",
  },

  pillTxt: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "700",
  },

  pillTxtActive: {
    color: "#fff",
    fontWeight: "900",
  },

  emptyWrap: {
    paddingTop: 70,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptySub: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },

  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  reviewTop: {
    flexDirection: "row",
    gap: 10,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#222",
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
    flexWrap: "wrap",
  },

  username: {
    fontSize: 14,
    color: "#f2f2f2",
    fontWeight: "800",
  },

  rewatchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  rewatchText: {
    fontSize: 10,
    color: "#aaa",
  },

  timeText: {
    fontSize: 10,
    color: "#888",
  },

  bodyText: {
    fontSize: 13.5,
    color: "#ddd",
    marginTop: 4,
    lineHeight: 20,
  },

  autoMedia: {
    marginTop: 8,
    width: "100%",
    minHeight: 180,
    maxHeight: 320,
    borderRadius: 12,
    backgroundColor: "#111",
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 9,
  },

  replyTxt: {
    color: "#888",
    fontSize: 13,
    fontWeight: "700",
  },

  likeButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  likeCount: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
    fontWeight: "700",
  },

  repliesWrap: {
    marginTop: 16,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.09)",
  },

  replyItem: {
    marginBottom: 14,
  },

  replyTop: {
    flexDirection: "row",
    gap: 8,
  },

  replyAvatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#222",
  },

  replyNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  replyUsername: {
    color: "#ddd",
    fontSize: 13,
    fontWeight: "800",
  },

  replyBody: {
    color: "#ddd",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },

  replyTime: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },

  replyActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 16,
  },

  replyActionText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "700",
  },

  replyLikeButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  replyLikeCount: {
    fontSize: 11,
    color: "#888",
    marginLeft: 4,
  },
  
  //

  composerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: "#000000",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  
  glassInputWrap: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.18)",
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 10,
    height: 42,
  },
  
  iconBtn: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  
  gifBtn: {
    height: 42,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  
  gifText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "900",
  },
  
  sendCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(124,58,237,0.96)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  
  sendCircleDisabled: {
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  //


  replyingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  replyingText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },

  previewWrap: {
    marginBottom: 8,
    position: "relative",
    alignSelf: "flex-start",
  },

  previewImage: {
    width: 170,
    height: 170,
    borderRadius: 12,
    resizeMode: "cover",
    backgroundColor: "#111",
  },

  previewCloseBtn: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 14,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },


});

