// src/components/profile/ProfileHeader.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ import
import useTranslate from "shared/utils/useTranslate";
import * as Clipboard from "expo-clipboard";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const FALLBACK_BACKDROP = "https://scenesa.com/default-backdrop.jpg";

const AVATAR = 70;
const SIDE = 16;
const screenWidth = Dimensions.get("window").width;
const backdropHeight = screenWidth <= 390 ? 180 : 260;

export default function ProfileHeader({
  user,
  imgRef,
  logs = [],
  isOwner,
  isFollowing,
  handleFollow,
  handleRemoveFollower,
}) {
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState(null);
  const t = useTranslate();

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        setMe(stored ? JSON.parse(stored) : null);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  const idEq = (a, b) => String(a) === String(b);

  // ✅ This viewed user follows me if my id is inside their following[]
  const canRemoveFollower = (user?.following || []).some((id) => idEq(id, me?._id));

  const onShare = async () => {
    try {
      // Build the canonical profile URL — change to whatever route you use publicly
      const profilePath = user?.username ? `u/${user.username}` : `user/${user._id}`;
      const url = `https://scenesa.com/${profilePath}`;
  
      // Copy to clipboard
      await Clipboard.setStringAsync(url);
  
      // Feedback
      Toast.show({ type: "scene", text1: t("🔗 Profile link copied!"), text2: url });
    } catch (err) {
      console.warn("Copy to clipboard failed", err);
      Toast.show({ type: "error", text1: t("Could not copy link") });
    } finally {
      setMenuOpen(false);
    }
  };
  

  const onRemoveFollower = () => {
    if (!handleRemoveFollower) {
      Toast.show({ type: "scene", text1: t("Remove follower isn’t wired yet") });
      return;
    }
    handleRemoveFollower(user._id);
    setMenuOpen(false);
  };

  const menuItems = isOwner
    ? [
        {
          label: `✏️ ${t("Edit Profile")}`,
          onPress: () => {
            setMenuOpen(false);
            navigation.navigate("EditProfileScreen");
          },
        },
        { label: `📤 ${t("Share")}`, onPress: onShare },
        {
          label: `⚙️ ${t("Settings")}`,
          onPress: () => {
            setMenuOpen(false);
            navigation.navigate("SettingsScreen");
          },
        },
      ]
    : [
        { label: `📤 ${t("Share")}`, onPress: onShare },
        ...(canRemoveFollower
          ? [{ label: `❌ ${t("Remove Follower")}`, onPress: onRemoveFollower }]
          : []),
      ];

  return (
    <View>
      {/* Backdrop */}
      <View style={[styles.backdropWrapper, { height: backdropHeight }]}>
        <Image
          ref={imgRef}
          source={{ uri: user?.profileBackdrop || FALLBACK_BACKDROP }}
          style={styles.backdrop}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(10,10,10,0.35)", "#0e0e0e"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Back button */}
        {!isOwner && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={{ color: "white", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
        )}

        {/* ⋯ Options */}
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
          <Text style={{ color: "white", fontSize: 22 }}>⋯</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <View style={[styles.avatarWrapper, { bottom: -AVATAR / 2 }]}>
          <Image source={{ uri: user?.avatar || FALLBACK_AVATAR }} style={styles.avatar} />
        </View>
      </View>

      {/* Spacer to account for avatar overlap */}
      <View style={{ height: AVATAR / 2 + 8 }} />

      {/* Name + Username + Follow */}
      <View style={[styles.nameRow, { paddingHorizontal: SIDE }]}>
        <View>
          {!!user?.name && <Text style={styles.name}>{user.name}</Text>}
          <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
            @{user?.username || ""}
          </Text>
        </View>

        {!isOwner && (
          <TouchableOpacity
            onPress={() => handleFollow?.(user._id)}
            style={[styles.followBtn, { backgroundColor: isFollowing ? "#333" : "#1a1a1a" }]}
          >
            <Text style={styles.followBtnText}>
              {isFollowing ? t("Following") : t("Follow")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bio */}
      {!!user?.bio && (
        <Text style={[styles.bio, { paddingHorizontal: SIDE }]} numberOfLines={4}>
          {user.bio}
        </Text>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        {/* Following */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("FollowersFollowingScreen", {
              id: user._id,
              initialTab: "following",
            })
          }
        >
          <Text style={styles.statNumber}>{user?.following?.length || 0}</Text>
          <Text style={styles.statLabel}>{t("Following")}</Text>
        </TouchableOpacity>

        {/* Followers */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("FollowersFollowingScreen", {
              id: user._id,
              initialTab: "followers",
            })
          }
        >
          <Text style={styles.statNumber}>{user?.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>{t("Followers")}</Text>
        </TouchableOpacity>

        {/* Films */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Profile", {
              id: user._id,
              initialTab: "Films", // ✅ match tab key used in ProfileScreen
            })
          }
        >
            <TouchableOpacity
  onPress={() =>
    navigation.navigate("Profile", {
      id: user._id,
      initialTab: "Films",
    })
  }
>
  <Text style={styles.statNumber}>
    {new Set(
      (logs || [])
        .map(
          (l) =>
            l.tmdbId ||
            l.movie?.tmdbId ||
            l.movie?.id ||
            l.movieId
        )
        .filter(Boolean)
    ).size}
  </Text>
  <Text style={styles.statLabel}>{t("Films")}</Text>
</TouchableOpacity>

        </TouchableOpacity>
      </View>

      {/* Menu modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            {menuItems.map((item, i) => (
              <TouchableOpacity key={i} onPress={item.onPress} style={styles.menuItem}>
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdropWrapper: { width: "100%", backgroundColor: "#000" },
  backdrop: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    top: 56,
    left: SIDE,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtn: {
    position: "absolute",
    top: 56,
    right: SIDE,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    position: "absolute",
    left: SIDE,
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 2,
    borderColor: "#0e0e0e",
    overflow: "hidden",
    zIndex: 2,
  },
  avatar: { width: "100%", height: "100%", borderRadius: AVATAR / 2 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  name: { color: "#fff", fontSize: 14, fontWeight: "600" },
  username: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  followBtn: {
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 28,
    borderWidth: 1,
    borderColor: "#555",
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnText: { color: "white", fontSize: 12, fontWeight: "600" },
  bio: { color: "#aaa", fontSize: 13, lineHeight: 18, marginTop: 6 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    marginTop: 12,
    right: 12,
    marginBottom: 12,
  },
  statNumber: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center" },
  statLabel: { color: "#bbb", fontSize: 12, textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menu: {
    marginTop: 100,
    marginRight: SIDE,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 8,
    width: 200,
    borderWidth: 1,
    borderColor: "#333",
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 16 },
  menuText: { color: "#fff", fontSize: 14, fontWeight: "500" },
});
