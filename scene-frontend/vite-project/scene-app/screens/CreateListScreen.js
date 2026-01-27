// src/screens/CreateListScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import AddMovieModal from "../components/AddMovieModal"; // ✅ correct path
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

/* ---------------- helpers ---------------- */
const pickId = (m) =>
  m?.id ?? m?.tmdbId ?? m?._id ?? m?.movieId ?? m?.movie?.id;

const pickTitle = (m, t) =>
  m?.title ?? m?.name ?? m?.movie?.title ?? m?.movie?.name ?? t("Untitled");

/** Poster precedence: viewer custom → item.posterOverride → absolute → TMDB path → fallback */
const posterFor = (m, externalCustomPosters) => {
  const id = String(pickId(m) ?? "");
  if (id && externalCustomPosters?.[id]) return externalCustomPosters[id];
  if (typeof m?.posterOverride === "string" && m.posterOverride) return m.posterOverride;

  if (typeof m?.poster === "string" && /^https?:\/\//.test(m.poster)) return m.poster;

  const path =
    (typeof m?.poster === "string" && !/^https?:\/\//.test(m.poster) && m.poster) ||
    (typeof m?.poster_path === "string" && m.poster_path) ||
    (typeof m?.movie?.poster === "string" && !/^https?:\/\//.test(m.movie.poster) && m.movie.poster) ||
    (typeof m?.movie?.poster_path === "string" && m.movie.poster_path) ||
    "";

  return path ? `${TMDB_IMG}${path}` : FALLBACK_POSTER;
};

/** Payload: send absolute URL if you have it; otherwise send raw TMDB path */
const toPayloadMovie = (m, t) => {
  const id = pickId(m);
  const title = pickTitle(m, t);
  const path =
    (typeof m?.poster_path === "string" && m.poster_path) ||
    (typeof m?.poster === "string" && !m.poster.startsWith("http") && m.poster) ||
    (typeof m?.movie?.poster_path === "string" && m.movie.poster_path) ||
    "";
  const absolute =
    typeof m?.poster === "string" && m.poster.startsWith("http")
      ? m.poster
      : "";

  return {
    id,
    title,
    poster: absolute || path || "",
    ...(m?.posterOverride ? { posterOverride: m.posterOverride } : {}),
  };
};

export default function CreateListScreen() {
  const t = useTranslate();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [movies, setMovies] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 💜 custom posters for current viewer
  const [myId, setMyId] = useState(null);
  const [externalCustomPosters, setExternalCustomPosters] = useState({});

  // load myId from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : null;
        const id =
          parsed?._id || parsed?.id || parsed?.user?._id || parsed?.user?.id || null;
        setMyId(id ? String(id) : null);
      } catch {
        setMyId(null);
      }
    })();
  }, []);

  // fetch viewer’s custom posters
  useEffect(() => {
    if (!myId) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/posters/user/${myId}`);
        const map = {};
        (data || []).forEach((p) => {
          if (p?.movieId && p?.url) map[String(p.movieId)] = p.url;
        });
        setExternalCustomPosters(map);
      } catch {
        // non-fatal
      }
    })();
  }, [myId]);

  // ← If AddToListScreen navigates back with { pickedMovie }, capture it here
  useEffect(() => {
    const picked = route.params?.pickedMovie;
    if (picked) {
      const id = pickId(picked);
      setMovies((prev) =>
        prev.some((m) => String(pickId(m)) === String(id)) ? prev : [...prev, picked]
      );
      navigation.setParams({ pickedMovie: undefined });
    }
  }, [route.params?.pickedMovie]);

  const canSave = useMemo(
    () => title.trim().length > 0 && movies.length > 0 && !saving,
    [title, movies.length, saving]
  );

  const handleUploadCover = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "scene", text1: t("Permission denied") });
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) return;

      const asset = res.assets[0];
      setUploading(true);

      const form = new FormData();
      form.append("image", {
        uri: asset.uri,
        name: asset.fileName || "cover.jpg",
        type: asset.mimeType || "image/jpeg",
      });

      const { data } = await api.post("/api/upload/list-cover", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCoverImage(data.url);
      Toast.show({ type: "scene", text1: t("Cover uploaded!") });
    } catch (e) {
      console.error("❌ Upload failed", e);
      Toast.show({ type: "scene", text1: t("Upload failed.") });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      const payload = {
        title,
        description,
        coverImage, // "" if none
        isPrivate,
        isRanked,
        movies: movies.map((m) => toPayloadMovie(m, t)),
      };
      await api.post("/api/lists", payload);

      Toast.show({ type: "scene", text1: "✅ " + t("List created!") });
      navigation.goBack();
    } catch (e) {
      console.error("❌ Failed to create list", e);
      Toast.show({ type: "scene", text1: t("Failed to create list.") });
      setSaving(false);
    }
  };

  const move = (index, dir) => {
    setMovies((prev) => {
      const next = prev.slice();
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeAt = (index) =>
    setMovies((prev) => prev.filter((_, i) => i !== index));

  const screenW = Dimensions.get("window").width;
  const coverH = Math.round(screenW * 0.45);

  const displayPoster = (m) => posterFor(m, externalCustomPosters);

  return (
    <View style={{ flex: 1, backgroundColor: "#0e0e0e" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
          <Text style={styles.btnText}>← {t("Back")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.btn, { opacity: canSave ? 1 : 0.5 }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>✅ {t("Save")}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <TextInput
          placeholder={t("List title")}
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        {/* Description */}
        <TextInput
          placeholder={t("Description (optional)")}
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 96, textAlignVertical: "top" }]}
          multiline
        />

        {/* Cover */}
        {!coverImage ? (
          <TouchableOpacity
            onPress={handleUploadCover}
            style={styles.uploadBox}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#bbb" }}>
                ⬆️ {t("Upload a cover image (optional)")}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ marginTop: 12 }}>
            <Image
              source={{ uri: coverImage }}
              style={{
                width: "100%",
                height: coverH,
                borderRadius: 10,
                backgroundColor: "#222",
              }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => setCoverImage("")}
              style={[styles.smallBtn, { alignSelf: "flex-start" }]}
            >
              <Text style={styles.smallBtnText}>❌ {t("Remove")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <Switch value={isPrivate} onValueChange={() => setIsPrivate((v) => !v)} />
          <Text style={styles.toggleText}>{t("Private")}</Text>
        </View>

        <View style={styles.toggleRow}>
          <Switch value={isRanked} onValueChange={() => setIsRanked((v) => !v)} />
          <Text style={styles.toggleText}>{t("Ranked")}</Text>
        </View>

        {/* Movies */}
        <Text style={styles.sectionTitle}>🎬 {t("Movies in this list:")}</Text>

        {movies.length === 0 ? (
          <Text style={{ color: "#888", marginTop: 6 }}>
            {t("No movies added yet.")}
          </Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {movies.map((m, i) => (
              <View
                key={(pickId(m) ?? i).toString()}
                style={styles.movieRow}
              >
                <Image source={{ uri: displayPoster(m) }} style={styles.poster} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text numberOfLines={2} style={{ color: "#fff", fontWeight: "600" }}>
                    {isRanked ? `${i + 1}. ` : ""}
                    {pickTitle(m, t)}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8, marginLeft: 8 }}>
                  <TouchableOpacity
                    onPress={() => move(i, -1)}
                    disabled={i === 0}
                    style={[styles.iconBtn, i === 0 && styles.iconBtnDisabled]}
                  >
                    <Text style={styles.iconTxt}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => move(i, +1)}
                    disabled={i === movies.length - 1}
                    style={[
                      styles.iconBtn,
                      i === movies.length - 1 && styles.iconBtnDisabled,
                    ]}
                  >
                    <Text style={styles.iconTxt}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeAt(i)} style={styles.iconBtnDanger}>
                    <Text style={styles.iconTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.btn, { marginTop: 14, alignSelf: "flex-start" }]}
        >
          <Text style={styles.btnText}>➕ {t("Add Movie")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Movie Modal */}
      <AddMovieModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        existing={movies}
        onSelect={(movie) =>
          setMovies((prev) => {
            const id = pickId(movie);
            return prev.some((x) => String(pickId(x)) === String(id))
              ? prev
              : [...prev, movie];
          })
        }
      />
    </View>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  smallBtn: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#333",
  },
  smallBtnText: { color: "#eee", fontSize: 12 },

  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontSize: 14,
    marginTop: 12,
  },

  uploadBox: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#555",
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  toggleText: { color: "#fff", fontSize: 14 },

  sectionTitle: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 4,
  },

  movieRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#222",
  },

  iconBtn: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  iconBtnDisabled: {
    opacity: 0.5,
  },
  iconBtnDanger: {
    backgroundColor: "#3a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#663",
  },
  iconTxt: { color: "#eee", fontWeight: "700" },
});
