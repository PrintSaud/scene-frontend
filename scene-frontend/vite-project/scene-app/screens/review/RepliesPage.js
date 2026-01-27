// src/screens/review/RepliesPage.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addLogReply, likeReply, deleteReply } from "shared/api/api";
import StarRating from "../../components/StarRating";
import GifSearchModal from "../../components/GifSearchModal"; // RN version
import useTranslate from "shared/utils/useTranslate";
import api from "shared/api/api";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

function getRelativeTime(date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}min ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day <= 7) return `${day}d ago`;
  const d = new Date(date);
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
}

export default function RepliesPage() {
  const t = useTranslate();
  const navigation = useNavigation();
  const route = useRoute();
  const { id, parentCommentId, parentUsername } = route.params || {};

  const [user, setUser] = useState(null);
  const userId = user?._id;

  const [replies, setReplies] = useState([]);
  const [input, setInput] = useState("");
  const [selectedGif, setSelectedGif] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [showGifModal, setShowGifModal] = useState(false);
  const [animatingLikes, setAnimatingLikes] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null); // which reply's 3-dot menu is open
  const [replyTargetId, setReplyTargetId] = useState(parentCommentId || null); // thread target

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // 🔑 load user from AsyncStorage (RN-safe; fixes owner detection)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  // 🔔 Scene toast (glassy)
  const sceneToast = (title, variant = "default") =>
    Toast.show({ type: "scene", text1: title, props: { title, variant } });

  // Fetch replies
  const fetchReplies = async () => {
    try {
      const safeId = encodeURIComponent(String(id));
      const res = await api.get(`/api/logs/${safeId}`);
      const data = res?.data;
      const list = data?.replies || data?.log?.replies || [];
      setReplies(list);
    } catch (err) {
      console.error("❌ Failed to load replies", err?.message);
      sceneToast(t("Failed to load replies. Please check your internet or API URL."), "error");
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [id]);

  // Pre-fill mention if navigated with a parent
  useEffect(() => {
    if (parentUsername) {
      setInput(`@${parentUsername} `);
      setReplyTargetId(parentCommentId || null);
      inputRef.current?.focus();
    }
  }, [parentUsername, parentCommentId]);

  

  // Helpers
  const getReplyUserId = (r) => r?.userId || r?.user?._id || null;
  const isOwnerOf = (r) => {
    const rid = getReplyUserId(r);
    return !!userId && !!rid && String(rid) === String(userId);
  };
  const goToProfile = (r) => {
    const rid = getReplyUserId(r);
    if (rid) navigation.navigate("Profile", { id: rid });
  };

  const { parents, childrenByParent } = useMemo(() => {
    const p = [];
    const map = {};
  
    (replies || []).forEach((r) => {
      const parentId = typeof r.parentComment === "string"
        ? r.parentComment
        : r.parentComment?._id;
  
      if (parentId) {
        if (!map[parentId]) map[parentId] = [];
        map[parentId].push(r);
      } else {
        p.push(r);
      }
    });
  
    // sort parents by likes desc, then time desc
    p.sort(
      (a, b) =>
        (b.likes?.length || 0) - (a.likes?.length || 0) ||
        new Date(b.createdAt) - new Date(a.createdAt)
    );
  
    // sort children by creation time asc
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    );
  
    return { parents: p, childrenByParent: map };
  }, [replies]);
  

  // Menu
  const openMenu = (replyId) => setMenuOpenId(replyId);
  const closeMenu = () => setMenuOpenId(null);

  const confirmDelete = (replyId) => {
    closeMenu();
    Alert.alert(t("Delete this reply?"), "", [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReply(id, replyId);
            await fetchReplies();
            sceneToast(t("Reply deleted"), "success");
          } catch {
            sceneToast(t("Failed to delete reply"), "error");
          }
        },
      },
    ]);
  };

  const handleReplyLike = async (replyId) => {
    // Optimistic update
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
    setAnimatingLikes((prev) => [...prev, replyId]);
    setTimeout(() => setAnimatingLikes((prev) => prev.filter((i) => i !== replyId)), 300);

    try {
      await likeReply(id, replyId);
    } catch {
      sceneToast(t("Failed to like reply"), "error");
    }
  };

  const startReplyTo = (reply) => {
    setReplyTargetId(reply._id);
    setInput(`@${reply.username} `);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedGif && !selectedImage) return;
  
    const formData = new FormData();
    formData.append("text", input || "");
    if (selectedGif) formData.append("gif", selectedGif);
    if (selectedImage) {
      formData.append("externalImage", {
        uri: selectedImage,
        type: "image/jpeg",
        name: "upload.jpg",
      });
    }
    if (replyTargetId) formData.append("parentComment", replyTargetId);
  
    try {
      // POST to API
      const res = await addLogReply(id, formData);
      const createdReply = res?.data; // assuming API returns the new reply
  
      // Optimistic update
      setReplies((prev) => [...prev, createdReply]);
  
      setInput("");
      setSelectedGif("");
      setSelectedImage("");
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      );
      sceneToast(t("Reply sent"), "success");
    } catch {
      sceneToast(t("Failed to send reply"), "error");
    }
  };
  
  
  

  const handlePickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled) setSelectedImage(res.assets[0].uri);
  };

  const renderReply = (reply, isChild = false) => {
    const children = childrenByParent[reply._id] || [];
    const replyProfileId = getReplyUserId(reply);
    const isOwner = isOwnerOf(reply); // ← define BEFORE JSX
    const isLikedByMe = (reply.likes || []).includes(userId);
  
    const replyUsername = reply.username || "user";
    const replyAvatar = reply.avatar || FALLBACK_AVATAR;
  
    const goToReview = () => {
      if (reply.reviewIdForThisMovie) {
        navigation.navigate("ReviewPage", { id: reply.reviewIdForThisMovie });
      }
    };
  
    return (
      <View
        key={reply._id}
        style={isChild ? [styles.childWrap, { marginLeft: 12 }] : styles.parentComment}
      >
        {/* 3-dot menu for owner */}
{isOwner && (
  <View>
    <TouchableOpacity
      style={styles.moreBtn}
      onPress={() => openMenu(reply._id)}
    >
      <Ionicons name="ellipsis-vertical" size={12} color="#aaa" />
    </TouchableOpacity>

    {/* Render the actual menu if this reply's menu is open */}
    {menuOpenId === reply._id && (
      <View style={styles.menuWrap}>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={() => confirmDelete(reply._id)}
        >
          <Text style={[styles.menuText, styles.menuTextDanger]}>
            {t("Delete")}
          </Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
)}

  
        {/* Reply content */}
        <View style={isChild ? styles.childRow : styles.row}>
          <TouchableOpacity
            onPress={() =>
              replyProfileId &&
              navigation.navigate("ProfileScreen", { id: replyProfileId })
            }
          >
            <Image
              source={{ uri: replyAvatar }}
              style={isChild ? styles.childAvatar : styles.avatar}
            />
          </TouchableOpacity>
  
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() =>
                  replyProfileId &&
                  navigation.navigate("ProfileScreen", { id: replyProfileId })
                }
              >
                <Text style={styles.username}>@{replyUsername}</Text>
              </TouchableOpacity>
  
              {reply.ratingForThisMovie && (
                <TouchableOpacity onPress={goToReview} activeOpacity={0.6}>
                  <StarRating rating={reply.ratingForThisMovie} size={12} />
                </TouchableOpacity>
              )}
  
              <Text style={styles.time}>{getRelativeTime(reply.createdAt)}</Text>
            </View>
  
            {reply.text && <Text style={styles.text}>{reply.text}</Text>}
            {reply.gif && (
              <Image
                source={{ uri: reply.gif }}
                style={[styles.media, { width: "100%", resizeMode: "contain" }]}
              />
            )}
            {reply.image && (
              <Image
                source={{ uri: reply.image }}
                style={[styles.media, { width: "100%", resizeMode: "contain" }]}
              />
            )}
  
            {/* Actions */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <TouchableOpacity onPress={() => startReplyTo(reply)}>
                <Text style={styles.replyAction}>{t("Reply")}</Text>
              </TouchableOpacity>
  
              <TouchableOpacity
                onPress={() => handleReplyLike(reply._id)}
                style={[styles.likeBtn, { marginLeft: 14, top: 4 }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isLikedByMe ? "heart" : "heart-outline"}
                  size={16}
                  color={isLikedByMe ? "#B327F6" : "#A6A6A6"}
                />
                <Text style={[styles.likeCount, isLikedByMe && styles.likeCountActive]}>
                  {reply.likes?.length || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
  
        {/* Children */}
        {children.map((child) => renderReply(child, true))}
      </View>
    );
  };
  
  


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Comments")}</Text>
      </View>

      <View style={styles.separator} />


      {/* Replies */}
<ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingTop: 20 }}>
  {parents.length === 0 ? (
    <Text style={styles.noComments}>
      {t("No comments yet. Be the first to reply!")}
    </Text>
  ) : (
    parents.map(renderReply)
  )}
</ScrollView>


      {/* Composer */}
      <View style={styles.composer}>
        {(selectedGif || selectedImage) && (
          <View style={styles.preview}>
            <Image source={{ uri: selectedGif || selectedImage }} style={styles.previewImg} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => {
                setSelectedGif("");
                setSelectedImage("");
              }}
            >
              <Text style={{ color: "#fff" }}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.row}>
          <TouchableOpacity onPress={handlePickImage}>
            <Text style={styles.attachBtn}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowGifModal(true)}>
            <Text style={styles.attachBtn}>GIF</Text>
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            placeholder={t("Write a comment...")}
            placeholderTextColor="#aaa"
            style={styles.input}
          />
          <TouchableOpacity onPress={handleSend}>
            <Text style={styles.sendBtn}>➤</Text>
          </TouchableOpacity>
        </View>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0e0e" },

  header: {
    position: "absolute",
    top: 62,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  backBtn: {
    position: "absolute",
    left: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "500", color: "#fff" },
  separator: { marginTop: 99, height: 1, backgroundColor: "#333", opacity: 0.6 },

  noComments: { textAlign: "center", marginTop: 40, color: "#888", fontSize: 14 },

  parentComment: { marginBottom: 16, position: "relative" },

  // Owner-only 3-dot trigger
  moreBtn: {
    position: "absolute",
    top: 10,
    right: 26,
    padding: 6,
    borderRadius: 16,
    zIndex: 10,
  },

  // Glassy single-option menu
  menuWrap: {
    position: "absolute",
    top: 28,
    right: 6,
    minWidth: 120,
    backgroundColor: "rgba(15,15,15,0.92)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    zIndex: 20,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuText: {
    color: "#eaeaea",
    fontSize: 14,
  },
  menuItemDanger: {
    backgroundColor: "rgba(179,39,246,0.08)",
  },
  menuTextDanger: {
    color: "#ff5a63",
    fontWeight: "600",
  },

  row: { flexDirection: "row", alignItems: "center",  },

  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  childAvatar: { width: 26, height: 26, borderRadius: 13, marginRight: 8 },

  username: { fontSize: 14, color: "#ddd", marginRight: 6 },
  time: { fontSize: 10, color: "#888", marginLeft: 4 },
  text: { fontSize: 14, color: "#ddd", marginTop: 2 },

  media: {
    width: "100%",
    height: undefined,
    aspectRatio: 1, // overwritten dynamically
    resizeMode: "cover",
    borderRadius: 8,
    marginTop: 6,
  },
  
  

  // Child thread styling
  childWrap: {
    marginLeft: 38,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#242424",
    marginTop: 12,
    position: "relative",
  },
  childRow: { flexDirection: "row",  },

  // Action row
  replyAction: {
    color: "#A0A0A0",
    fontSize: 13,
    marginTop: 6,
  },

  // ❤️ Like button styles (Scene)
  likeBtn: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  likeCount: { fontSize: 12, color: "#A6A6A6", marginLeft: 6 },
  likeCountActive: { color: "#B327F6", fontWeight: "600" },

  composer: {
    borderTopWidth: 1,
    borderTopColor: "#222",
    padding: 8,
    backgroundColor: "#0e0e0e",
  },
  preview: { position: "relative", marginBottom: 8 },
  previewImg: { width: "100%", height: 180, borderRadius: 8 },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  attachBtn: { fontSize: 18, color: "#888", marginHorizontal: 6 },
  input: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    marginHorizontal: 6,
    marginTop: 42,
    top: -22,
  },
  sendBtn: { fontSize: 30, color: "#fff", marginLeft: 8 },
});
