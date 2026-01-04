// src/screens/EditProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import { getPlatformIcon } from "shared/utils/getPlatformIcon";
import AddMovieModal from "../components/AddMovieModal";
import BackdropSearchModal from "../components/BackdropSearchModal";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

function posterFor(m) {
  if (!m) return FALLBACK_POSTER;
  if (m.posterOverride) return m.posterOverride;
  if (m.poster_path) return `${TMDB_IMG}${m.poster_path}`;
  if (m.movie?.poster_path) return `${TMDB_IMG}${m.movie.poster_path}`;
  return FALLBACK_POSTER;
}

const pickId = (m) => m?.id ?? m?.tmdbId ?? m?._id ?? m?.movieId ?? m?.movie?.id;
const pickTitle = (m) =>
  m?.title ?? m?.name ?? m?.movie?.title ?? m?.movie?.name ?? "Untitled";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const t = useTranslate();

  const [user, setUser] = useState(null);
  const [showBackdropModal, setShowBackdropModal] = useState(false);

  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [favoriteFilms, setFavoriteFilms] = useState([]);
  const [socials, setSocials] = useState({
    X: "",
    youtube: "",
    instagram: "",
    tiktok: "",
    imdb: "",
    tmdb: "",
    website: "",
  });

  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔄 Load user
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (!stored) return;

        const parsed = JSON.parse(stored);
        setUser(parsed);

        setBio(parsed.bio || "");
        setAvatar(parsed.avatar || "");
        setBackdrop(parsed.profileBackdrop || "");
        setFavoriteFilms(parsed.favoriteFilms || []);
        setSocials({
            X: parsed.socials?.X || "",
            youtube: parsed.socials?.youtube || "",
            instagram: parsed.socials?.instagram || "",
            tiktok: parsed.socials?.tiktok || "",
            imdb: parsed.socials?.imdb || "",
            tmdb: parsed.socials?.tmdb || "",
            website: parsed.socials?.website || "",
          });
                                  
      } catch (err) {
        console.error("❌ Failed to load user", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 📸 Change photo
  const handleChangePhoto = async () => {
    try {
      // ✅ ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "scene", text1: "Permission denied" });
        return;
      }
  
      // ✅ pick image
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // square crop
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) return;
  
      const asset = res.assets[0];
  
      // ✅ load current user + token
      const stored = await AsyncStorage.getItem("user");
      const me = stored ? JSON.parse(stored) : null;
      if (!me?._id || !me?.token) {
        Toast.show({ type: "scene", text1: "Not logged in" });
        return;
      }
  
      // ✅ prepare form data
      const form = new FormData();
      form.append("avatar", {
        uri: asset.uri,
        name: asset.fileName || "avatar.jpg",
        type: asset.mimeType || "image/jpeg",
      });
  
      // ✅ call backend
      const { data } = await api.post(`/api/upload/avatar/${me._id}`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${me.token}`,
        },
      });
  
      // ✅ update local state + AsyncStorage
      setAvatar(data.avatar);
      await AsyncStorage.setItem("user", JSON.stringify({ ...me, avatar: data.avatar }));
  
      Toast.show({ type: "scene", text1: "✅ Avatar updated!" });
    } catch (err) {
      console.error("❌ Upload avatar failed", err);
      Toast.show({ type: "scene", text1: "❌ Upload failed" });
    }
  };
  

  const handleSave = async () => {
    if (!user) return;
    try {
      const updatedUser = {
        bio,
        avatar,
        profileBackdrop: backdrop,
        favoriteFilms,
        socials,
      };
  
      console.log("📤 Sending update payload:", updatedUser);
  
      const res = await api.patch(`/api/users/${user._id}`, updatedUser);
  
      console.log("✅ Response:", res.data);
  
      const merged = {
        ...user,
        ...res.data.user,
        socials: res.data.user.socials || {},
      };
      
      // https://www.instagram.com/hhhhiimmmm?igsh=MW5mY2VieXQ1bm13bg%3D%3D&utm_source=qr
  
      await AsyncStorage.setItem("user", JSON.stringify(merged));
      Toast.show({ type: "scene", text1: "✅ " + t("Profile updated!") });
      navigation.goBack();
    } catch (err) {
      console.error("❌ Failed to update profile", err.response?.data || err);
      Toast.show({ type: "scene", text1: "❌ " + t("Failed to update profile.") });
    }
  };
  
  

  const move = (index, dir) => {
    setFavoriteFilms((prev) => {
      const next = prev.slice();
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeAt = (index) =>
    setFavoriteFilms((prev) => prev.filter((_, i) => i !== index));

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={{ color: "#aaa", marginTop: 8 }}>{t("Loading profile...")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={{ fontWeight: "600" }}>{t("Save")}</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + Backdrop */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        {backdrop ? (
          <Image source={{ uri: backdrop }} style={styles.backdrop} resizeMode="cover" />
        ) : null}

        <Image source={{ uri: avatar || FALLBACK_AVATAR }} style={styles.avatar} resizeMode="cover" />
        <TouchableOpacity style={styles.changePhotoBtn} onPress={handleChangePhoto}>
          <Text style={{ color: "#aaa" }}>{t("Change Photo")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, { marginTop: -12, left: -117 }]}
          onPress={() => setShowBackdropModal(true)}
        >
          <Text style={{ color: "#aaa" }}>{t("Change Backdrop")}</Text>
        </TouchableOpacity>
      </View>

      {/* Bio */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.label}>{t("Bio")}</Text>
        <TextInput
          value={bio}
          onChangeText={(txt) => setBio(txt.slice(0, 180))}
          placeholder={t("Write a short bio (max 180 chars)")}
          placeholderTextColor="#666"
          style={styles.input}
          multiline
          maxLength={180}
        />
      </View>

      {/* Favorite Films */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.label}>{t("Favorite Films")}</Text>
        {/* same as before */}
        {favoriteFilms.length === 0 ? (
          <Text style={{ color: "#888", marginTop: 6 }}>{t("No favorite movies yet.")}</Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {favoriteFilms.map((m, i) => (
              <View key={(pickId(m) ?? i).toString()} style={styles.movieRow}>
                <Image source={{ uri: posterFor(m) }} style={styles.poster} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text numberOfLines={2} style={{ color: "#fff", fontWeight: "600" }}>
                    {i + 1}. {pickTitle(m)}
                  </Text>
                </View>
                {/* reorder/remove buttons */}
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
                    disabled={i === favoriteFilms.length - 1}
                    style={[styles.iconBtn, i === favoriteFilms.length - 1 && styles.iconBtnDisabled]}
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

        {favoriteFilms.length < 4 && (
          <TouchableOpacity
            style={[styles.filterBtn, { marginTop: 14, alignSelf: "flex-start" }]}
            onPress={() => setShowAddMovieModal(true)}
          >
            <Text style={{ color: "#aaa" }}>➕ {t("Add Movie")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Connections */}
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity
          style={styles.connectionsHeader}
          onPress={() => setConnectionsOpen((prev) => !prev)}
        >
          <Text style={styles.label}>{t("Connections")}</Text>
          <MaterialIcons
            name={connectionsOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
        {connectionsOpen && (
          <View style={{ marginTop: 12, gap: 10 }}>
            {["X", "youtube", "instagram", "tiktok", "imdb", "tmdb", "website"].map((platform) => (
              <View key={platform} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 24 }}>{getPlatformIcon(platform)}</View>
                <TextInput
  value={socials[platform]}
  onChangeText={(txt) => {
    console.log("✏️ Updating", platform, "to", txt);
    setSocials((prev) => ({ ...prev, [platform]: txt }));
  }}
  placeholder={t("Enter your " + platform + " username")}
  placeholderTextColor="#666"
  style={[styles.input, { flex: 1 }]}
/>

              </View>
            ))}
          </View>
        )}
      </View>

      {/* Import */}
      <TouchableOpacity style={styles.importBtn} onPress={() => navigation.navigate("ImportScreen")}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          📦 {t("Transfer Data from Letterboxd")}
        </Text>
      </TouchableOpacity>

      {/* Modals */}
      {showAddMovieModal && (
        <AddMovieModal
          visible={showAddMovieModal}
          onClose={() => setShowAddMovieModal(false)}
          existing={favoriteFilms}
          onSelect={(movie) =>
            setFavoriteFilms((prev) => {
              const mid = pickId(movie);
              return prev.some((x) => String(pickId(x)) === String(mid)) ? prev : [...prev, movie];
            })
          }
        />
      )}

      <BackdropSearchModal
        visible={showBackdropModal}
        onClose={() => setShowBackdropModal(false)}
        onSelect={(url) => {
          if (url) setBackdrop(url);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0e0e", paddingHorizontal: 16 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    right: 133,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
    marginTop: 10,
  },
  changePhotoBtn: {
    marginTop: 8,
    top: -53,
    right: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
  },
  backdrop: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    padding: 10,
    color: "#fff",
    fontSize: 14,
    marginTop: 6,
  },
  label: { color: "#fff", fontSize: 14, fontWeight: "600" },
  filterBtn: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  iconBtnDisabled: { opacity: 0.5 },
  iconBtnDanger: {
    backgroundColor: "#3a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#663",
  },
  iconTxt: { color: "#eee", fontWeight: "700" },
  connectionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  importBtn: {
    marginTop: 24,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0e0e0e" },
});
