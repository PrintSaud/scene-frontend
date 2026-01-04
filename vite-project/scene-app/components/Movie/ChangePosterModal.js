// src/components/Movie/ChangePosterModal.js
import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import useTranslate from "shared/utils/useTranslate";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

export default function ChangePosterModal({ movieId, onClose, onSave }) {
  const [posters, setPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslate();

  useEffect(() => {
    console.log("Backend URL:", process.env.EXPO_PUBLIC_BACKEND_URL);  // 🔹 debug
    const fetchPosters = async () => {
      try {
        console.log("Fetching posters for movieId:", movieId); // LOG
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/logs/proxy/tmdb/images/${movieId}`
        );
        console.log("TMDB fetch response status:", res.status); // LOG
  
        const data = await res.json();
        console.log("Fetched data:", data); // LOG
        const sorted = (data.posters || []).sort(
          (a, b) => (b.vote_count || 0) - (a.vote_count || 0)
        );
        setPosters(sorted);
        console.log("Sorted posters:", sorted.map(p => p.file_path)); // LOG
      } catch (err) {
        console.error("❌ Failed to fetch posters", err); // LOG
      }
    };
    fetchPosters();
  }, [movieId]);
  

  const handleSave = async () => {
    if (!selectedPoster) {
      console.log("No poster selected, cannot save."); // LOG
      return;
    }
    try {
      setLoading(true);
      const posterUrl = `${TMDB_IMG}${selectedPoster}`;
      console.log("Saving poster for movieId:", movieId, "URL:", posterUrl); // LOG
  
      const result = await onSave(movieId, posterUrl);
      console.log("onSave result:", result); // LOG
  
      onClose();
    } catch (err) {
      console.error("❌ Failed to save poster", err); // LOG
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Modal transparent={true} animationType="fade" visible={true}>
      <View style={styles.overlay}>
        {/* Back button */}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>🖼 {t("poster.choose_new")}</Text>

          {/* Posters grid */}
          {posters.length === 0 ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={posters}
              keyExtractor={(item) => item.file_path}
              numColumns={3}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => {
                const isSelected = selectedPoster === item.file_path;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedPoster(item.file_path)}
                    style={[
                      styles.posterWrapper,
                      isSelected && { borderColor: "#fff", borderWidth: 2 },
                    ]}
                  >
                    <Image
                      source={{ uri: `${TMDB_IMG}${item.file_path}` }}
                      style={styles.poster}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Confirm button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!selectedPoster || loading}
            style={[
              styles.confirmBtn,
              (!selectedPoster || loading) && styles.confirmBtnDisabled,
            ]}
          >
            <Text style={styles.confirmText}>
              {loading ? t("poster.saving") : t("poster.confirm")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  closeBtn: {
    position: "absolute",
    top: 45,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeIcon: { color: "#fff", fontSize: 20 },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 18, marginBottom: 12 },
  grid: { gap: 10 },
  posterWrapper: {
    margin: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  poster: { width: 110, height: 165, borderRadius: 6, backgroundColor: "#222" },
  confirmBtn: {
    marginTop: 10,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 8,
    minWidth: 360,
    alignItems: "center",
    marginBottom: 20,
  },
  confirmBtnDisabled: {
    backgroundColor: "#444",
  },
  confirmText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
});
