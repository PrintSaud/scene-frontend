// src/screens/review/ChangeReviewBackdrop.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import api from "../../../../shared/api/api";
import useTranslate from "../../../../shared/utils/useTranslate";

const TMDB_IMG = "https://image.tmdb.org/t/p/original";
const SCENE_PURPLE = "#B327F6";

export default function ChangeReviewBackdrop() {
  const t = useTranslate();
  const navigation = useNavigation();
  const route = useRoute();

  const reviewId = route.params?.reviewId ?? route.params?.id;

  const [backdrops, setBackdrops] = useState([]);
  const [selectedBackdrop, setSelectedBackdrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef(null);

  const showSceneToast = (message, variant = "success") => {
    Toast.show({
      type: "scene",
      text1: message,
      props: { title: message, variant },
    });
  };

  useEffect(() => {
    let mounted = true;

    const fetchReviewedMovieBackdrops = async () => {
      try {
        const { data: log } = await api.get(`/api/logs/${reviewId}`);
        const movieId = log?.movie?.id || log?.movie;

        if (!movieId) {
          if (mounted) {
            setLoading(false);
            showSceneToast(t("No movie found for this review."), "error");
          }
          return;
        }

        const res = await api.get(`/api/movies/${movieId}`);
        const urls = (res.data?.backdrops || []).map((p) => `${TMDB_IMG}${p}`);

        if (mounted) {
          setBackdrops(urls);
        }
      } catch (err) {
        console.error("Failed to load reviewed movie backdrops:", err);
        showSceneToast(t("Failed to load backdrops."), "error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (reviewId) {
      fetchReviewedMovieBackdrops();
    } else {
      setLoading(false);
      showSceneToast(t("Review not found."), "error");
    }

    return () => {
      mounted = false;
    };
  }, [reviewId, t]);

  const handleBackdropSelect = (url) => {
    setSelectedBackdrop(url);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleSave = async () => {
    if (!selectedBackdrop || saving) return;

    try {
      setSaving(true);

      await api.patch(`/api/logs/${reviewId}/backdrop`, {
        backdrop: selectedBackdrop,
      });

      showSceneToast(t("Backdrop updated successfully!"), "success");

      // ✅ IMPORTANT:
      // Do NOT reset/navigate to ReviewPage.
      // Just go back to the existing ReviewPage so its back button still works.
      navigation.goBack();
    } catch (err) {
      console.error("Failed to update backdrop:", err);
      showSceneToast(t("Failed to update backdrop. Please try again."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t("Change Backdrop")}</Text>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={SCENE_PURPLE} />
            <Text style={styles.loadingText}>{t("Loading backdrops...")}</Text>
          </View>
        ) : backdrops.length > 0 ? (
          backdrops.map((url, idx) => (
            <TouchableOpacity
              key={`${url}-${idx}`}
              activeOpacity={0.8}
              onPress={() => handleBackdropSelect(url)}
              disabled={saving}
            >
              <Image
                source={{ uri: url }}
                style={[
                  styles.backdropImg,
                  selectedBackdrop === url ? styles.selected : styles.unselected,
                ]}
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t("No backdrops found.")}</Text>
          </View>
        )}

        {/* Done button */}
        {selectedBackdrop ? (
          <View style={styles.doneWrap}>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.doneBtn, saving && styles.doneBtnDisabled]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.doneText}>✅ {t("Done")}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 10,
  },

  backBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backIcon: {
    color: "#fff",
    fontSize: 18,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginRight: 44,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },

  loadingWrap: {
    alignItems: "center",
    marginTop: 24,
  },

  loadingText: {
    color: "#888",
    marginTop: 8,
  },

  emptyWrap: {
    alignItems: "center",
    marginTop: 40,
  },

  emptyText: {
    color: "#888",
    fontSize: 14,
  },

  backdropImg: {
    width: "100%",
    height: Math.round(width * 0.5),
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: "cover",
  },

  selected: {
    borderWidth: 3,
    borderColor: SCENE_PURPLE,
    shadowColor: SCENE_PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  unselected: {
    borderWidth: 1,
    borderColor: "#333",
  },

  doneWrap: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
  },

  doneBtn: {
    backgroundColor: SCENE_PURPLE,
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 11,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },

  doneBtnDisabled: {
    opacity: 0.65,
  },

  doneText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});

