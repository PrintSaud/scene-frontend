// src/screens/review/ReviewHeader.js
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons"; // ⬅️ NEW
import AsyncStorage from "@react-native-async-storage/async-storage";
import StarRating from "../../components/StarRating";
import useTranslate from "shared/utils/useTranslate";
import { Ionicons } from '@expo/vector-icons';

const TMDB_IMG = "https://image.tmdb.org/t/p/original";
const FALLBACK_BACKDROP = "https://scenesa.com/scene-og-review-fallback.png";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

const CONTENT_SIDE_PADDING = 16;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_WIDTH = SCREEN_WIDTH - CONTENT_SIDE_PADDING * 2;

// --- Auto-sizing media that NEVER crops (contain), keeps full aspect ratio
function MediaAuto({ uri }) {
  const [aspect, setAspect] = useState(null); // width / height
  const [firstLoadTried, setFirstLoadTried] = useState(false);

  useEffect(() => {
    setAspect(null);
    setFirstLoadTried(false);
  }, [uri]);

  // Fallback attempt to prefetch size for most http(s)/file URIs
  useEffect(() => {
    let mounted = true;
    if (!uri || uri.startsWith("data:")) return; // Image.getSize can't parse data URIs reliably
    Image.getSize(
      uri,
      (w, h) => {
        if (mounted && w && h) setAspect(w / h);
      },
      () => {} // ignore; we'll read from onLoad below
    );
    return () => {
      mounted = false;
    };
  }, [uri]);

  const onLoad = (e) => {
    // RN exposes intrinsic size on nativeEvent.source sometimes
    const wh = e?.nativeEvent?.source;
    if (wh?.width && wh?.height) {
      setAspect(wh.width / wh.height);
    }
    setFirstLoadTried(true);
  };

  // While we don't know the aspect ratio yet, show a gentle loader in a placeholder box
  if (!aspect) {
    return (
      <View style={styles.mediaShell}>
        <Image
          source={{ uri }}
          onLoad={onLoad}
          style={{ width: "100%", height: 260, resizeMode: "contain" }}
        />
        {!firstLoadTried && (
          <View style={styles.mediaOverlayLoader}>
            <ActivityIndicator color="#B327F6" />{/* ⬅️ purple */}
          </View>
        )}
      </View>
    );
  }

  // When we know the aspect, let RN compute height from width via aspectRatio (no crop)
  return (
    <View style={styles.mediaShell}>
      <Image
        source={{ uri }}
        style={{
          width: "100%",
          aspectRatio: aspect, // height = width / aspect
          resizeMode: "contain",
        }}
      />
    </View>
  );
}

export default function ReviewHeader({
  review,
  userId, // may be undefined → we’ll fallback to AsyncStorage
  onLike,
  onProfile,
  onChangeBackdrop,
  rewatchCount,
  onEdit,
  onDelete,
}) {
  const t = useTranslate();
  const navigation = useNavigation();

  const [showOptions, setShowOptions] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;

  // ---- Scene toast wrapper (swap the type to your custom one if you have it registered)
  const showSceneToast = (msg, kind = "success") =>
    Toast.show({ type: kind === "success" ? "success" : "error", text1: msg });

  const baseBackdrop =
    review.customBackdrop ||
    (review.reviewBackdrop ? `${TMDB_IMG}${review.reviewBackdrop}` : "") ||
    (review.movie?.backdrop_path ? `${TMDB_IMG}${review.movie.backdrop_path}` : "") ||
    FALLBACK_BACKDROP;

  // fix RN onError fallback
  const [backdropSrc, setBackdropSrc] = useState(baseBackdrop);
  useEffect(() => setBackdropSrc(baseBackdrop), [baseBackdrop]);

  // 🕒 Timestamp rules
  const MONTHS = useMemo(
    () => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    []
  );
  const formatTimestamp = (iso) => {
    if (!iso) return "";
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = now - then;

    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    const year = Math.floor(day / 365);

    if (min < 1) return t("Just now");
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day <= 7) return `${day}d ago`;

    const d = new Date(iso);
    const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    return year >= 1 ? `${label}, ${d.getFullYear()}` : label;
  };
  const timestamp = review.createdAt ? formatTimestamp(review.createdAt) : "";

  // ---- Fallback: read logged-in user from AsyncStorage if prop userId missing
  const [fallbackUserId, setFallbackUserId] = useState(null);
  useEffect(() => {
    if (userId) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          setFallbackUserId(parsed?._id || parsed?.id || null);
        }
      } catch {}
    })();
  }, [userId]);

  const effectiveUserId = userId ?? fallbackUserId;

  // 🔐 robust owner detection (handles user._id | userId | user.id; string/oid)
  const ownerId =
    review?.user?._id ??
    review?.userId ??
    review?.user?.id ??
    null;
  const isOwner = String(ownerId ?? "") === String(effectiveUserId ?? "");

  const handleCopyLink = () => {
    const link = `https://scenesa.com/review/${review._id}`;
    Clipboard.setStringAsync(link);
  
    const backdrop =
      review.customBackdrop ||
      (review.reviewBackdrop ? `${TMDB_IMG}${review.reviewBackdrop}` : "") ||
      (review.movie?.backdrop_path ? `${TMDB_IMG}${review.movie.backdrop_path}` : "") ||
      FALLBACK_BACKDROP;
  
    Toast.show({
      type: "scene",
      text1: "Link copied (Previews are cooming soon!) ",
      props: {
        preview: {
          backdrop,
          title: review.movie?.title || "Untitled",
          rating: review.rating || 0,
          username: `@${review.user?.username || "user"}`,
        },
      },
    });
  
    setShowOptions(false);
  };
  
  
  

  const menuItems = isOwner
    ? [
        { label: t("🎨 Change Backdrop"), onPress: onChangeBackdrop },
        { label: t("✏️ Edit Review/Log"), onPress: onEdit },
        { label: t("🗑️ Delete Review/Log"), onPress: onDelete },
        { label: t("📤 Share to Friends"), onPress: () => navigation.navigate("ShareToFriends", { type: "log", id: review._id }) },
        { label: t("💾 Save Photo"), onPress: () => navigation.navigate("ShareReviewPage", { id: review._id }) },
        { label: t("🔗 Copy Link"), onPress: handleCopyLink },
      ]
    : [
        { label: t("📤 Share to Friends"), onPress: () => navigation.navigate("ShareToFriends", { type: "log", id: review._id }) },
        { label: t("🔗 Copy Link"), onPress: handleCopyLink },
      ];

  const pulseHeart = () => {
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.18, duration: 120, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  // 👍 liked state — coerce ids to strings so it matches even if types differ
  const liked = (review.likes || [])
    .map((x) => String(x ?? ""))
    .includes(String(effectiveUserId ?? ""));

    
const handleBack = () => {
    // 1) normal case
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
  
    // 2) if we know the movie, jump there
    const movieId = review?.movie?.id || review?.movie;
    if (movieId) {
      navigation.replace("Movie", { id: movieId });
      return;
    }
  
    // 3) last resort: land on your root/home tab (⚠️ change "Home" if different)
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };
  

  return (
    <View>
      {/* Backdrop */}
      <View style={styles.backdropWrapper}>
        <Image
          source={{ uri: backdropSrc }}
          style={styles.backdrop}
          onError={() => setBackdropSrc(FALLBACK_BACKDROP)}
        />

        {/* REAL gradient fade into content */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(14,14,14,0)", "rgba(14,14,14,0.45)", "rgba(14,14,14,0.85)", "rgba(14,14,14,1)"]}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.gradient}
        />

        {/* Top buttons */}
        <View style={styles.topButtons}>
          <TouchableOpacity style={styles.circleButton} onPress={() => navigation.goBack()}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>

          <View>
            <TouchableOpacity style={styles.circleButton} onPress={() => setShowOptions((p) => !p)}>
              <Text style={styles.iconText}>⋯</Text>
            </TouchableOpacity>

            <Modal visible={showOptions} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
                <View style={styles.menu}>
                  {menuItems.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.menuItem}
                      onPress={() => {
                        item.onPress?.();
                        setShowOptions(false);
                      }}
                    >
                      <Text style={styles.menuText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>

        {/* Go to Movie */}
        {review.movie && (
          <TouchableOpacity
            style={styles.goMovieBtn}
            onPress={() =>
              navigation.navigate("Movie", { id: review.movie?.id || review.movie })
            }
          >
            <Text style={styles.goMovieText}>{t("Go to Movie")}</Text>
          </TouchableOpacity>
        )}
      </View>

{/* Content */}
{/* Content */}
<View style={styles.content}>
  {review.user && (
    <>
      <View style={styles.userRow}>
        {/* Avatar → Profile */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ProfileScreen", { id: review.user._id })
          }
        >
          <Image
            source={{ uri: review.user?.avatar || FALLBACK_AVATAR }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        {/* Username → Profile */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ProfileScreen", { id: review.user._id })
          }
        >
          <Text style={styles.username}>@{review.user.username}</Text>
        </TouchableOpacity>
      </View>








            <View style={styles.rowBetween}>
              <View style={[styles.row, { gap: 6 }]}>
                <StarRating rating={review.rating} />
                {rewatchCount > 0 && (
                  <View style={styles.rewatchWrap}>
                    <MaterialIcons name="refresh" size={12} color="#aaa" />
                    <Text style={styles.rewatchText}>{rewatchCount}x</Text>
                  </View>
                )}
              </View>
              {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
            </View>
          </>
        )}

        {review.review && review.review !== "__media__" && (
          <Text style={styles.reviewText}>{review.review}</Text>
        )}

        {/* FULL media, never cropped */}
        {review.image ? <MediaAuto uri={review.image} /> : null}
        {review.gif ? <MediaAuto uri={review.gif} /> : null}

        <View style={styles.rowEnd}>
          {/* Purple animated heart (Scene-style, smaller) */}


{/* Purple animated heart (Scene-style, smaller) */}
<TouchableOpacity
  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
  activeOpacity={0.7}
  onPress={() => {
    if (!effectiveUserId) {
      showSceneToast(t("You must be logged in to like."), "error");
      return;
    }
    onLike?.();
    pulseHeart();
  }}
  accessibilityRole="button"
  accessibilityLabel={liked ? t("Unlike") : t("Like")}
>
<Animated.View style={{ transform: [{ scale: likeScale }] }}>
  <Ionicons
    name={liked ? "heart" : "heart-outline"}
    size={18}
    color={liked ? "#B327F6" : "#9BA1A6"}
  />
</Animated.View>
</TouchableOpacity>

<Text style={[styles.likeCount, liked && { color: "#B327F6" }]}>
  {Array.isArray(review?.likes) ? review.likes.length : 0}
</Text>


          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => navigation.navigate("RepliesPage", { id: review._id })}
          >
            <Text style={styles.replyText}>{t("Reply")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdropWrapper: { height: 240, marginBottom: -48 },
  backdrop: { width: "100%", height: "100%" },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "82%",
  },
  topButtons: {
    position: "absolute",
    top: 52,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#fff", fontSize: 18 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 56,
    paddingRight: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menu: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 8,
    width: 220,
    top: 32,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 14 },
  menuText: { color: "#fff", fontSize: 14.5 },
  goMovieBtn: {
    position: "absolute",
    bottom: 40,
    right: 14,
    backgroundColor: "rgba(100,100,100,0.6)",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  goMovieText: { color: "#fff", fontSize: 12 },

  content: { padding: CONTENT_SIDE_PADDING },

  userRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  username: { fontSize: 13, color: "#fff", opacity: 0.9 },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },

  // ⬇️ rewatch bits
  rewatchWrap: { flexDirection: "row", alignItems: "center" },
  rewatchText: { fontSize: 10, color: "#aaa", marginLeft: 2 },

  timestamp: { fontSize: 11, color: "#aaa" },

  reviewText: { marginTop: 8, fontSize: 14, color: "#ddd", lineHeight: 20 },

  // media wrapper with rounded corners; image itself uses contain+aspect
  mediaShell: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  mediaOverlayLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  rowEnd: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  likeCount: { fontSize: 13, color: "#fff", marginLeft: 4, marginRight: 12 },
  replyBtn: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replyText: { fontSize: 12, color: "#fff" },
});
