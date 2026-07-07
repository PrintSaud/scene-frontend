// /Users/saudceo/flick-frontend/vite-project/scene-app/screens/review/ShareReviewPage.js
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import Toast from "react-native-toast-message";
import api from "../../../../shared/api/api";
import useTranslate from "../../../../shared/utils/useTranslate";

import StarRating from "../../components/StarRating";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

// ✅ Local Scene logo
// From:
// /Users/saudceo/flick-frontend/vite-project/scene-app/screens/review/ShareReviewPage.js
// To:
// /Users/saudceo/flick-frontend/scene-frontend-b90e1eee6edc6db185489599f3de5ce42f46e61f/public/default-avatarccc.png
const SCENE_LOGO = require("../../../../scene-frontend-b90e1eee6edc6db185489599f3de5ce42f46e61f/public/default-avatarccc.png");

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
    let isMounted = true;

    const fetchReview = async () => {
      try {
        if (!id) {
          setLoading(false);
          return;
        }

        const { data } = await api.get(`/api/logs/${id}`);

        if (isMounted) {
          setReview(data);
        }
      } catch (err) {
        console.warn("❌ Failed to fetch share review:", err?.message || err);

        Toast.show({
          type: "scene",
          text1: "Failed to load review",
          props: { variant: "error" },
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReview();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const sceneToast = (msg, variant = "default") => {
    Toast.show({
      type: "scene",
      text1: msg,
      props: { title: msg, variant },
    });
  };

  const requestPhotosPermission = async () => {
    try {
      const current = await MediaLibrary.getPermissionsAsync();

      if (current.granted) return true;

      const requested = await MediaLibrary.requestPermissionsAsync();

      if (!requested.granted) {
        Alert.alert(
          "Photos Permission Needed",
          "Scene needs permission to save your story image to your Photos."
        );

        return false;
      }

      return true;
    } catch (err) {
      console.warn("❌ Permission error:", err?.message || err);
      return false;
    }
  };

  const captureCard = async () => {
    try {
      if (!viewShotRef.current?.capture) {
        sceneToast("Capture is not ready yet", "error");
        return null;
      }

      const uri = await viewShotRef.current.capture();

      if (!uri) {
        sceneToast("Failed to capture image", "error");
        return null;
      }

      return uri;
    } catch (err) {
      console.warn("❌ Capture failed:", err?.message || err);
      sceneToast("Failed to capture image", "error");
      return null;
    }
  };

  const saveImageToPhotos = async () => {
    const hasPermission = await requestPhotosPermission();

    if (!hasPermission) return null;

    const uri = await captureCard();

    if (!uri) return null;

    try {
      const asset = await MediaLibrary.createAssetAsync(uri);

      sceneToast("Saved to Photos!", "success");

      return asset;
    } catch (err) {
      console.warn("❌ Save failed:", err?.message || err);
      sceneToast("Failed to save", "error");
      return null;
    }
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);
      await saveImageToPhotos();
    } finally {
      setSaving(false);
    }
  };

  const handleInstagramStories = async () => {
    if (saving) return;

    try {
      setSaving(true);

      const asset = await saveImageToPhotos();

      if (!asset) return;

      sceneToast("Saved! Opening Instagram...", "success");

      setTimeout(async () => {
        try {
          const instagramUrl = "instagram://app";

          const canOpen = await Linking.canOpenURL(instagramUrl);

          if (canOpen) {
            await Linking.openURL(instagramUrl);
          } else {
            sceneToast("Instagram is not installed", "error");
          }
        } catch (err) {
          console.warn("❌ Instagram open failed:", err?.message || err);
          sceneToast("Could not open Instagram", "error");
        }
      }, 600);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={styles.loadingText}>{t("Loading review…")}</Text>
      </View>
    );
  }

  if (!review) {
    return (
      <View style={styles.loaderScreen}>
        <Text style={styles.loadingText}>Review not found.</Text>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
          <Text style={styles.retryTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const posterUri =
    review.poster ||
    review.movie?.poster ||
    review.movie?.posterUrl ||
    FALLBACK_POSTER;

  const avatarUri =
    review.user?.avatar ||
    FALLBACK_AVATAR;

  const username =
    review.user?.username ||
    "user";

  const movieTitle =
    review.movie?.title ||
    review.movieTitle ||
    review.title ||
    "this film";

  return (
    <View style={styles.container}>
      {/* Top buttons */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={styles.actionTxt}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.instagramBtn}
            onPress={handleInstagramStories}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={styles.instagramTxt}>
              Instagram Stories
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card */}
      <ViewShot
        ref={viewShotRef}
        style={styles.cardWrapper}
        options={{
          format: "png",
          quality: 1,
          result: "tmpfile",
        }}
      >
        <View style={styles.card}>
          <Image
            source={{ uri: posterUri }}
            style={styles.poster}
          />

          <View style={styles.content}>
            <View style={styles.userRow}>
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
              />

              <Text style={styles.username}>
                @{username}
              </Text>
            </View>

            <Text style={styles.rateText}>
              I’ve rated{" "}
              <Text style={styles.movieTitle}>
                {movieTitle}
              </Text>
            </Text>

            <View style={styles.starsWrap}>
              <StarRating rating={review.rating || 0} size={22} />
            </View>

            <Text style={styles.onText}>on</Text>

            <View style={styles.logoRow}>
              <View style={styles.line} />

              <Image
                source={SCENE_LOGO}
                style={styles.logo}
              />

              <View style={styles.line} />
            </View>
          </View>
        </View>
      </ViewShot>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  loaderScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },

  loadingText: {
    color: "#aaa",
    marginTop: 8,
  },

  retryBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },

  retryTxt: {
    color: "#fff",
    fontWeight: "700",
  },

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

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  backTxt: {
    color: "#fff",
    fontSize: 24,
    marginTop: -2,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  actionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  actionTxt: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  instagramBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#B327F6",
  },

  instagramTxt: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  cardWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },

  card: {
    width: 330,
    backgroundColor: "#000",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },

  poster: {
    width: "78%",
    height: 360,
    borderRadius: 12,
    resizeMode: "cover",
    backgroundColor: "#111",
  },

  content: {
    marginTop: 26,
    alignItems: "center",
    width: "100%",
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: "#111",
  },

  username: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },

  rateText: {
    marginTop: 24,
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },

  movieTitle: {
    color: "#ddd",
    fontWeight: "900",
  },

  starsWrap: {
    marginTop: 14,
  },

  onText: {
    marginTop: 18,
    fontSize: 15,
    color: "#aaa",
  },

  logoRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#555",
  },

  logo: {
    width: 82,
    height: 82,
    resizeMode: "contain",
    marginHorizontal: 12,
  },
});