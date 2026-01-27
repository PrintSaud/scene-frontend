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
import useTranslate from "shared/utils/useTranslate";
import StarRating from "../components/StarRating";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { backend as BACKEND_URL } from "shared/config";
import GifSearchModal from "../components/GifSearchModal";
import * as ImagePicker from "expo-image-picker";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

function AutoSizedImage({ uri }) {
    const [ratio, setRatio] = useState(1);
  
    useEffect(() => {
      if (uri) {
        Image.getSize(
          uri,
          (w, h) => setRatio(w / h),
          () => setRatio(1) // fallback if error
        );
      }
    }, [uri]);
  
    return (
      <Image
        source={{ uri }}
        style={{
          marginTop: 6,
          width: "100%",
          aspectRatio: ratio,   // ✅ full dynamic size
          borderRadius: 8,
          backgroundColor: "#111",
        }}
        resizeMode="contain"    // ✅ prevents cropping
      />
    );
  }
  

export default function MovieReviewsScreen() {
  const route = useRoute();
  const stackNav = useNavigation();
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
  const [replyingTo, setReplyingTo] = useState(null); // { id, username }
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [input, setInput] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const inputRef = useRef(null);

  // ✅ Local wrapper so we can call showSceneToast just like other screens
const showSceneToast = (message, type = "success") => {
    Toast.show({
      type: "scene", // uses your CustomToast config
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
    if (min < 60) return (t("time.minutes_ago", { min }) || `${min}m ago`);
    if (hr < 24) return (t("time.hours_ago", { hr }) || `${hr}h ago`);
    if (day <= 7) return (t("time.days_ago", { day }) || `${day}d ago`);
  
    const x = new Date(iso);
  
    if (year >= 1) {
      // ✅ More than a year ago → only year
      return `${x.getUTCFullYear()}`;
    } else {
      // ✅ Within the last year → Month short name + day number
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const m = monthNames[x.getUTCMonth()];
      const dd = x.getUTCDate();
      return `${m} ${dd}`;
    }
  };
  
  const handleLikeReply = async (reviewId, replyId) => {
    if (!userId) return;
  
    // optimistic UI update
    setReviews((prev) =>
      prev.map((r) =>
        r._id !== reviewId
          ? r
          : {
              ...r,
              replies: r.replies.map((rep) =>
                rep._id !== replyId
                  ? rep
                  : {
                      ...rep,
                      likes: Array.isArray(rep.likes) && rep.likes.includes(userId)
                        ? rep.likes.filter((x) => x !== userId)
                        : [...(rep.likes || []), userId],
                    }
              ),
            }
      )
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
  

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
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
        showSceneToast("❌ Failed to delete reply. Please try again.", "error");
        return;
      }
  
      // ✅ Remove from local state
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? { ...r, replies: r.replies.filter((rep) => rep._id !== replyId) }
            : r
        )
      );
  
      showSceneToast("🗑️ Reply deleted", "success");
    } catch (e) {
      console.warn("❌ delete reply failed", e);
      showSceneToast("⚠️ Delete failed. Please try again later.", "error");
    }
  };
  
  


  // who am I?
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const me = raw ? JSON.parse(raw) : null;
        setUserId(me?._id || null);
      } catch {}
    })();
  }, []);

  // initial reply (deep link)
  useEffect(() => {
    if (replyTo && parentUsername) {
      setReplyingTo({ id: replyTo, username: parentUsername });
      setActiveReviewId(replyTo);
      setInput(`@${parentUsername} `);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [replyTo, parentUsername]);

  // fetch reviews
  const fetchReviews = async () => {
    if (!id || !BACKEND_URL) return;
    try {
      const raw = await AsyncStorage.getItem("user");
      const me = raw ? JSON.parse(raw) : null;
      const headers = me?.token ? { Authorization: `Bearer ${me.token}` } : {};

      const endpoint =
        filter === "friends"
          ? `${BACKEND_URL}/api/logs/movie/${id}/friends`
          : `${BACKEND_URL}/api/logs/movie/${id}/popular?all=true`;

      const res = await fetch(endpoint, { headers, credentials: "include" });
      const txt = await res.text();

      const safeParse = (t) => {
        try {
          return JSON.parse(t);
        } catch {
          return null;
        }
      };
      const j = safeParse(txt);

      const asArray = (x) =>
        Array.isArray(x)
          ? x
          : Array.isArray(x?.reviews)
          ? x.reviews
          : Array.isArray(x?.logs)
          ? x.logs
          : Array.isArray(x?.data)
          ? x.data
          : [];

      const arr = asArray(j);

      if (!res.ok) {
        console.warn("Failed to fetch reviews", res.status, txt);
        setReviews([]);
        return;
      }

      setTotalCount(arr.length);

      const filtered = arr.filter((log) => {
        const rawText = String(log.review || "").trim();
        const hasText =
          rawText &&
          !["__media__", "[GIF ONLY]", "[IMAGE ONLY]"].includes(rawText);
        const hasMedia = !!log.gif || !!log.image;
        return hasText || hasMedia;
      });

      const sorted = [...filtered].sort(
        (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
      );
      setReviews(sorted);
      

      if (__DEV__) {
        console.log("MovieReviewsScreen:", {
          endpoint,
          status: res.status,
          total: arr.length,
          filtered: filtered.length,
        });
        if (!res.ok) console.warn("body:", txt);
      }
    } catch (e) {
      console.warn("❌ Failed to load reviews", e);
      setReviews([]);
      setTotalCount(0);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id, filter, BACKEND_URL]);

  const handleReply = (commentId, username, reviewId) => {
    setReplyingTo({ id: commentId, username });
    setActiveReviewId(reviewId);
    setInput(`@${username} `);
    setTimeout(() => inputRef.current?.focus(), 50);
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
        showSceneToast("❌ Failed to send reply", "error");
        return;
      }
  
      // clear input + reset state
      setInput("");
      setSelectedGif("");
      setSelectedImage("");
      setReplyingTo(null);
      setActiveReviewId(null);
  
      // 🎉 Scene toast
      showSceneToast("💬 Reply posted successfully!", "success");
  
      // 🔄 Auto refresh reviews from backend
      await fetchReviews();
  
    } catch (e) {
      console.warn("❌ Failed to send reply", e);
      showSceneToast("⚠️ Something went wrong", "error");
    }
  };
  
  
  

  const handleLike = async (reviewId) => {
    if (!userId) return;

    setReviews((prev) =>
      prev.map((r) => {
        if (r._id !== reviewId) return r;
        const liked = Array.isArray(r.likes) && r.likes.includes(userId);
        return {
          ...r,
          likes: liked ? r.likes.filter((x) => x !== userId) : [...(r.likes || []), userId],
        };
      })
    );

    setAnimatingLikes((prev) => [...prev, reviewId]);
    setTimeout(() => setAnimatingLikes((prev) => prev.filter((x) => x !== reviewId)), 400);

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

  const title =
    filter === "friends"
      ? String(t("friends_reviews") || "Friends’ Reviews")
      : String(t("all_reviews") || "All Reviews");

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => stackNav.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontSize: 20 }}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {title}
          {filter === "all" && totalCount ? ` (${totalCount})` : ""}
        </Text>

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
      </View>

{/* Reviews + Replies */}
<ScrollView
  contentContainerStyle={{ paddingBottom: replyingTo ? 140 : 40 }}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#fff"
    />
  }
>
  {reviews.map((r) => {
    const meLiked = userId
      ? Array.isArray(r.likes) && r.likes.includes(userId)
      : false;

    const reviewText =
      typeof r.review === "string" &&
      r.review.trim() !== "" &&
      !["__media__", "[GIF ONLY]", "[IMAGE ONLY]"].includes(r.review.trim())
        ? r.review
        : "";

    const rewatchNum =
      typeof r.rewatchCount === "number"
        ? r.rewatchCount
        : typeof r.rewatch === "number"
        ? r.rewatch
        : 0;

    return (
      <View key={String(r._id)} style={styles.reviewCard}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* Avatar → Profile */}
          <TouchableOpacity
            onPress={() => stackNav.navigate("ProfileScreen", { id: r.user?._id })}
          >
            <Image
              source={{ uri: r.user?.avatar || FALLBACK_AVATAR }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            {/* username + stars + rewatch + time */}
            <View style={styles.userRow}>
              <TouchableOpacity
                onPress={() => stackNav.navigate("ProfileScreen", { id: r.user?._id })}
              >
                <Text style={styles.username}>
                  @{String(r.user?.username || "user")}
                </Text>
              </TouchableOpacity>

              {typeof r.rating === "number" ? (
                <StarRating rating={r.rating} size={12} />
              ) : null}

              {rewatchNum > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MaterialIcons name="refresh" size={12} color="#aaa" />
                  <Text style={{ fontSize: 10, color: "#aaa" }}>{rewatchNum}x</Text>
                </View>
              )}

              <Text style={{ fontSize: 10, color: "#888" }}>
                {getRelativeTime(r.createdAt)}
              </Text>
            </View>

            {!!reviewText && (
              <Text style={styles.bodyText}>{reviewText}</Text>
            )}

{!!r.gif && (
  <AutoSizedImage uri={r.gif} />
)}
{!!r.image && (
  <AutoSizedImage uri={r.image} />
)}


{/* actions */}
<View style={styles.actionsRow}>
  <TouchableOpacity onPress={() => handleReply(r._id, r.user?.username, r._id)}>
    <Text style={styles.replyTxt}>{String(t("reply") || "Reply")}</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => handleLike(r._id)}
    style={{ flexDirection: "row", alignItems: "center" }}
  >
    <View
      style={{
        transform: [{ scale: animatingLikes.includes(r._id) ? 1.4 : 1 }],
      }}
    >
      {meLiked ? (
        <Ionicons name="heart" size={16} color="#B327F6" />
      ) : (
        <Ionicons name="heart-outline" size={16} color="#888" />
      )}
    </View>
    <Text style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
      {String((r.likes?.length || 0).toString())}
    </Text>
  </TouchableOpacity>
</View>


{/* replies */}
{Array.isArray(r.replies) && r.replies.length > 0 && (
  <View style={{ marginTop: 18, marginLeft: 10 }}>
    {r.replies.map((rep) => {
      const replyUser = rep.user || {}; // fallback if user is missing
      const replyAvatar = replyUser.avatar || FALLBACK_AVATAR;
      const replyUsername = replyUser.username || "user";

      return (
        <View key={String(rep._id)} style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* Reply avatar → Profile */}
            <TouchableOpacity
              onPress={() =>
                replyUser._id &&
                stackNav.navigate("ProfileScreen", { id: replyUser._id })
              }
            >
              <Image
                source={{ uri: replyAvatar }}
                style={[
                  styles.avatar,
                  { width: 24, height: 24, borderRadius: 12, backgroundColor: "#222" },
                ]}
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {/* Username → Profile */}
                <TouchableOpacity
                  onPress={() =>
                    replyUser._id &&
                    stackNav.navigate("ProfileScreen", { id: replyUser._id })
                  }
                >
                  <Text style={{ color: "#ddd", fontSize: 13, fontWeight: "600" }}>
                    @{replyUsername}
                  </Text>
                </TouchableOpacity>

                {/* 3-dot menu if I own the reply */}
                {userId && replyUser._id === userId && (
                  <TouchableOpacity onPress={() => handleReplyMenu(rep, r._id)}>
                    <MaterialIcons name="more-vert" size={18} color="#a8a8a8" />
                  </TouchableOpacity>
                )}
              </View>

              {!!rep.text && (
                <Text style={{ color: "#ddd", fontSize: 13 }}>{rep.text}</Text>
              )}

              {!!rep.gif && (
                <Image
                  source={{ uri: rep.gif }}
                  style={[styles.media, { height: 180 }]}
                />
              )}
              {!!rep.image && (
                <Image
                  source={{ uri: rep.image }}
                  style={[styles.media, { height: 180 }]}
                />
              )}

              <Text style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                {getRelativeTime(rep.createdAt)}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              gap: 12,
            }}
          >
            {/* 💬 Reply button */}
            <TouchableOpacity
              onPress={() => handleReply(rep._id, replyUsername, r._id)}
            >
              <Text style={{ fontSize: 11, color: "#888", marginLeft: 224,  }}>
                {String(t("reply") || "Reply")}
              </Text>
            </TouchableOpacity>

            {/* ❤️ Like button */}
            <TouchableOpacity
              onPress={() => handleLikeReply(r._id, rep._id)}
              style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}
            >
              {rep.likes?.includes(userId) ? (
                <Ionicons name="heart" size={14} color="#B327F6" />
              ) : (
                <Ionicons name="heart-outline" size={14} color="#888" />
              )}
              <Text style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>
                {String(rep.likes?.length || 0)}
              </Text>
            </TouchableOpacity>
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


{/* Reply composer */}
{replyingTo?.id && (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
    style={styles.composerWrap}
  >
    {(selectedGif || selectedImage) ? (
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
          <Text style={{ color: "#fff", fontSize: 16 }}>×</Text>
        </TouchableOpacity>
      </View>
    ) : null}

    <View style={styles.composerInner}>
      <TouchableOpacity onPress={pickImage} style={{ padding: 6 }}>
        <Text style={styles.attachBtn}>Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowGifModal(true)} style={{ padding: 6 }}>
        <Text style={styles.attachBtn}>GIF</Text>
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={input}
        onChangeText={setInput}
        placeholder={String(t("write_reply") || "Write a reply…")}
        placeholderTextColor="#aaa"
        style={[styles.input, { height: Math.min(inputHeight, 120) }]}
        multiline
        onContentSizeChange={(e) =>
          setInputHeight(e.nativeEvent.contentSize.height)
        }
        returnKeyType="default"
      />

      <TouchableOpacity
        onPress={handleSend}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <Text style={styles.sendBtn}>➤</Text>
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
  wrap: { flex: 1, backgroundColor: "#0e0e0e" },
  header: {
    paddingHorizontal: 12,
    paddingTop: 52,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", right: 40 },
  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillActive: { backgroundColor: "#B327F6", borderColor: "#B327F6" },
  pillTxt: { color: "#fff", fontSize: 13 },
  pillTxtActive: { fontWeight: "700" },

  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#222" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  username: { fontSize: 14, color: "#ddd", fontWeight: "600" },
  bodyText: { fontSize: 12.5, color: "#ddd", marginTop: 2 },
  media: {
    marginTop: 6,
    width: "100%",
    aspectRatio: 1,       // 🔑 placeholder, will be overridden dynamically
    borderRadius: 8,
    backgroundColor: "#111",
  },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  replyTxt: { color: "#888", fontSize: 13 },

  composerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    backgroundColor: "#0e0e0e",
    borderTopWidth: 10,
    borderBottomWidth:20,
    borderBottomColor: "#0e0e0e",
    borderTopColor: "#0e0e0e",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  composerInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    borderRadius: 20,
    fontSize: 15,
    textAlignVertical: "top",
  },
  previewWrap: {
    marginBottom: 8,
    position: "relative",
    alignSelf: "flex-start",
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
    backgroundColor: "#111",
  },
  previewCloseBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  attachBtn: { fontSize: 18, color: "#888" },
  sendBtn: { fontSize: 28, color: "#fff" },
  
});
