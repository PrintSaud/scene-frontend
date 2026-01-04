import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import Toast from "react-native-toast-message";
import useTranslate from "shared/utils/useTranslate";
import api from "shared/api/api";
import StarRating from "../../components/StarRating";
import AntDesign from "@expo/vector-icons/AntDesign";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const SCENE_LOGO = "https://scenesa.com/scene-og.png";

export default function ShareReviewPage() {
  const t = useTranslate();
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const viewShotRef = useRef(null);

  useEffect(() => {
    if (id) {
      api.get(`/api/logs/${id}`)
        .then(({ data }) => setReview(data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const sceneToast = (msg, variant = "default") =>
    Toast.show({ type: "scene", text1: msg, props: { title: msg, variant } });

  const captureCard = async () => {
    try {
      return await viewShotRef.current.capture();
    } catch (err) {
      sceneToast(t("Failed to capture image"), "error");
      return null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const uri = await captureCard();
    if (!uri) return setSaving(false);

    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      sceneToast(t("Saved to Photos!"), "success");
    } catch {
      sceneToast(t("Failed to save"), "error");
    }
    setSaving(false);
  };

  const handleShare = async () => {
    const uri = await captureCard();
    if (!uri) return;
    try {
      await Sharing.shareAsync(uri);
    } catch {}
  };

  const handleInstagramStories = async () => {
    const uri = await captureCard();
    if (!uri) return;
  
    try {
      // 1️⃣ Save screenshot to Photos
      const asset = await MediaLibrary.createAssetAsync(uri);
  
      // 2️⃣ Redirect directly into Instagram Stories with local file URI
      await Linking.openURL(`instagram-stories://share?backgroundImage=${asset.uri}`);
    } catch (err) {
      sceneToast(t("Instagram Stories not available"), "error");
    }
  };
  

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={{ color: "#aaa", marginTop: 8 }}>{t("Loading review…")}</Text>
      </View>
    );
  }

  if (!review) return null;

  return (
    <View style={styles.container}>
      {/* Top buttons */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity style={styles.circleBtn} onPress={handleShare}>
            <AntDesign name="sharealt" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleInstagramStories}>
            <Text style={styles.shareBtnText}>{t("Instagram Stories")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card */}
      <ViewShot
        ref={viewShotRef}
        style={styles.cardWrapper}
        options={{ format: "png", quality: 1 }}
      >
        <View style={styles.card}>
          <Image
            source={{ uri: review.poster || FALLBACK_POSTER }}
            style={styles.poster}
          />

          <View style={{ marginTop: 26, alignItems: "center" }}>
            {/* User info */}
            <View style={styles.userRow}>
              <Image
                source={{ uri: review.user?.avatar || FALLBACK_AVATAR }}
                style={styles.avatar}
              />
              <Text style={styles.username}>@{review.user?.username}</Text>
            </View>

            <Text style={styles.rateText}>
              {t("I’ve rated")} <Text style={{ fontWeight: "700" }}>{review.movie?.title}</Text>
            </Text>

            {/* extra margin between rate text and stars */}
            <View style={{ marginTop: 12 }}>
              <StarRating rating={review.rating} size={22} />
            </View>

            <Text style={styles.onText}>{t("on")}</Text>
            <View style={styles.logoRow}>
              <View style={styles.line} />
              <Image source={{ uri: SCENE_LOGO }} style={styles.logo} />
              <View style={styles.line} />
            </View>
          </View>
        </View>
      </ViewShot>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loaderScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },

  topBar: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  circleBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },

  cardWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    width: 320,
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  poster: { width: "70%", height: 290, borderRadius: 8, resizeMode: "cover" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  username: { color: "#fff", fontWeight: "600" },
  rateText: { marginTop: 18, fontSize: 14, color: "#aaa" },
  onText: { marginTop: 10, fontSize: 14, color: "#aaa" },
  logoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: "#555" , },
  logo: { width: 90, height: 90, resizeMode: "contain", marginHorizontal: 8 },

  shareBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
