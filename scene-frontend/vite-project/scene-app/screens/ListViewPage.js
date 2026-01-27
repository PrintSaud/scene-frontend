// src/screens/ListViewPage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
 import {
       View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator,
       Dimensions, FlatList, Modal, Pressable, Animated,Platform,
     } from "react-native";
     import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import { MaterialIcons } from "@expo/vector-icons";




const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

const extractId = (val) => {
  if (!val) return null;
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object")
    return String(
      val.userId || val.user || val._id || val.id || val.ownerId || val.createdBy || ""
    );
  return null;
};

const getOwnerIdFromList = (list) => {
  const u = list?.user;
  const candidate =
    extractId(u) ||
    extractId(list?.owner) ||
    extractId(list?.ownerId) ||
    extractId(list?.userId) ||
    extractId(list?.createdBy);
  return candidate ? String(candidate) : "";
};

const arrayHasMyId = (arr, mine) =>
  !!mine && Array.isArray(arr) && arr.some((x) => String(extractId(x)) === String(mine));

export default function ListViewPage({ customPosters = {} }) {
  const t = useTranslate();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const listId = route?.params?.id;

  const [myId, setMyId] = useState(null);
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // viewer’s own custom posters (map movieId -> url)
  const [externalCustomPosters, setExternalCustomPosters] = useState({});

  // 💜 tiny pulse when liking
  const likeScale = useRef(new Animated.Value(1)).current;
  const pulse = () => {
    likeScale.setValue(1);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.05, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 5.0, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  // Load myId (RN)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : null;
        const id =
          parsed?._id ||
          parsed?.id ||
          parsed?.user?._id ||
          parsed?.user?.id ||
          null;
        setMyId(id ? String(id) : null);
      } catch {
        setMyId(null);
      }
    })();
  }, []);

  // Fetch list + initial like/save + custom posters
  useEffect(() => {
    const run = async () => {
      if (!listId) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/api/lists/${listId}`);
        setList(data);

        if (myId) {
          const likedInitial =
            data?.likedByMe === true ||
            data?.isLikedByMe === true ||
            arrayHasMyId(data?.likes, myId) ||
            arrayHasMyId(data?.likedBy, myId);
          setIsLiked(!!likedInitial);

          const savedInitial =
            data?.savedByMe === true || arrayHasMyId(data?.savedBy, myId);
          setIsSaved(!!savedInitial);

          try {
            const posterRes = await api.get(`/api/posters/user/${myId}`);
            const map = {};
            (posterRes.data || []).forEach((p) => {
              map[String(p.movieId)] = p.url;
            });
            setExternalCustomPosters(map);
          } catch {}
        }
      } catch (e) {
        console.error("Failed to fetch list:", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [listId, myId]);

  const ownerId = useMemo(() => getOwnerIdFromList(list || {}), [list]);
  const isOwner = useMemo(
    () => !!(myId && ownerId && String(myId) === String(ownerId)),
    [myId, ownerId]
  );

  const likeCount = Array.isArray(list?.likes)
    ? list.likes.length
    : list?.likesCount || 0;

  const handleLike = async () => {
    if (!myId) return;
    try {
      await api.post(`/api/lists/${listId}/like`);
      pulse();
      setIsLiked((prev) => {
        const next = !prev;
        setList((prevList) => {
          if (!prevList) return prevList;
          const likes = Array.isArray(prevList.likes) ? prevList.likes.slice() : [];
          if (next) {
            if (!arrayHasMyId(likes, myId)) likes.push(myId);
          } else {
            const idx = likes.findIndex((x) => String(extractId(x)) === String(myId));
            if (idx >= 0) likes.splice(idx, 1);
          }
          return { ...prevList, likes };
        });
        return next;
      });
    } catch (e) {
      console.error("like list failed", e);
    }
  };

  const handleSave = async () => {
    if (!myId) return;
    try {
      await api.post(`/api/lists/${listId}/save`);
      setIsSaved((prev) => {
        const next = !prev;
        if (next) {
          // saved
           Toast.show({ type: "scene", text1: t("Saved to your lists") });
        } else {
          // unsaved
           Toast.show({ type: "scene", text1: t("Removed from Saved") });
        }
        return next;
      });
    } catch (e) {
         Toast.show({ type: "scene", text1: t("Couldn't save list") });
      console.error("save list failed", e);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/lists/${listId}`);
       Toast.show({ type: "scene", text1: t("List deleted") });
      navigation.goBack();
    } catch (e) {
         Toast.show({ type: "scene", text1: t("Couldn't delete list") });
      console.error("delete list failed", e);
    }
  };

  const screenW = Dimensions.get("window").width;
  const numColumns = screenW >= 768 ? 5 : screenW >= 480 ? 4 : 3;

  const pickId = (m) => m?.id ?? m?.tmdbId ?? m?._id ?? m?.movieId ?? extractId(m?.movie);
  const pickTitle = (m) => m?.title || m?.name || m?.movie?.title || m?.movie?.name;
  const pickPoster = (m) =>
    m?.poster || m?.poster_path || m?.movie?.poster || m?.movie?.poster_path;

  const posterFor = (movie) => {
    const idStr = String(pickId(movie) || "");
    if (externalCustomPosters[idStr]) return externalCustomPosters[idStr];
    if (movie.posterOverride) return movie.posterOverride;
    const p = typeof pickPoster(movie) === "string" ? pickPoster(movie) : null;
    if (p && /^https?:\/\//.test(p)) return p;
    if (p) return `${TMDB_IMG}${p}`;
    if (customPosters[idStr]) return customPosters[idStr];
    return FALLBACK_POSTER;
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: 90, backgroundColor: "#0e0e0e", flex: 1 }]}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={{ color: "#aaa", marginTop: 8 }}>{t("Loading...")}</Text>
      </View>
    );
  }
  if (!list) {
    return (
      <View style={[styles.center, { paddingTop: 40, backgroundColor: "#0e0e0e", flex: 1 }]}>
        <Text style={{ color: "#fff" }}>{t("Not found")}</Text>
      </View>
    );
  }

  const Header = () => {
    const userObj = typeof list.user === "object" && list.user ? list.user : null;
    const username = userObj?.username || t("Unknown");
    const avatar = userObj?.avatar || FALLBACK_AVATAR;

    return (
      <View>
        {/* Cover */}
        {list.coverImage ? (
          <View
            style={{
              // full-bleed: escape FlatList's paddingHorizontal: 16
              marginHorizontal: -16,
              height: 220, // or Math.round(Dimensions.get('window').width * 0.45)
              overflow: "hidden",
            }}
          >
            {/* Pin the image to the container */}
            <Image
              source={{ uri: list.coverImage }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />

            <LinearGradient
              colors={["rgba(0,0,0,0)", "#0e0e0e"]}
              style={StyleSheet.absoluteFill}
            />

            {/* Overlay header (non-sticky, safe area) */}
            <View style={[styles.overlayHeader, { top: insets.top + 6, paddingHorizontal: 16 }]}>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => navigation.goBack()}
                accessibilityLabel={t("Back")}
              >
                <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => setShowOptions((s) => !s)}
                accessibilityLabel={t("More options")}
              >
                <Text style={{ color: "#fff", fontSize: 22 }}>⋯</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Simple top row when no cover
          <View
            style={{
              paddingTop: insets.top + 6,
              paddingHorizontal: 0, // keep this 0 since FlatList already adds 16
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel={t("Back")}>
              <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowOptions((s) => !s)} accessibilityLabel={t("More options")}>
              <Text style={{ color: "#fff", fontSize: 22 }}>⋯</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Title / Meta */}
        <View
          style={{
            marginHorizontal: -16, // escape FlatList's content padding
            paddingHorizontal: 16, // keep comfortable inner padding
            paddingTop: list.coverImage ? 0 : 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 4 }}>
            {list.title}
          </Text>

          {!!list.description && (
            <Text style={{ color: "#bbb", fontSize: 14, lineHeight: 20, marginBottom: 10 }}>
              {list.description}
            </Text>
          )}

          <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
  onPress={() => navigation.push("ProfileScreen", { id: ownerId })} // ✅ push keeps history
  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
>
  <Image
    source={{ uri: avatar }}
    style={{ width: 28, height: 28, borderRadius: 14 }}
  />
  <Text style={{ color: "#ddd" }}>@{username}</Text>
</TouchableOpacity>


            <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <TouchableOpacity onPress={handleLike} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons
                    name={isLiked ? "favorite" : "favorite-border"}
                    size={22}
                    color={isLiked ? "#B327F6" : "#888"}
                  />
                </TouchableOpacity>
              </Animated.View>
              <Text style={{ color: "#ddd", fontSize: 14 }}>{likeCount}</Text>
            </View>
          </View>

          <Text style={{ color: "#fff", fontWeight: "600", marginTop: 14, marginBottom: 10 }}>
            {list.isRanked ? t("Ranked Movies") : t("Movies")}:
          </Text>
        </View>
      </View>
    );
  };

  const menuItems = isOwner
    ? [
        { label: `✏️ ${t("Edit List")}`, onPress: () => navigation.navigate("EditListScreen", { id: listId }) },
        { label: `📤 ${t("Share to Friends")}`, onPress: () => navigation.navigate("ShareToFriends", { type: "list", id: listId }) },
        { label: `🗑️ ${t("Delete List")}`, onPress: handleDelete },
      ]
    : [
        { label: `📤 ${t("Share to Friends")}`, onPress: () => navigation.navigate("ShareToFriends", { type: "list", id: listId }) },
        { label: isSaved ? `✅ ${t("Saved")}` : `💾 ${t("Save List")}`, onPress: handleSave },
      ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0e0e0e" }}>
      <FlatList
        data={list.movies || []}
        keyExtractor={(m, idx) => String(pickId(m) ?? idx)}
        numColumns={numColumns}
        ListHeaderComponent={<Header />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item, index }) => {
          const posterUrl = posterFor(item);
          const displayTitle = pickTitle(item) || t("Untitled");
          const id = pickId(item);
          return (
            <TouchableOpacity
              onPress={() => id && navigation.navigate("Movie", { id })}
              style={{ flex: 1 / numColumns, marginBottom: 12 }}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: posterUrl }}
                style={{ width: "100%", aspectRatio: 2 / 3, borderRadius: 8, marginBottom: 4 }}
                resizeMode="cover"
              />
              <Text numberOfLines={1} style={{ color: "#fff", fontSize: 12 }}>
                {list.isRanked ? `${index + 1}. ` : ""}
                {displayTitle}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 24 }}>
            <Text style={{ color: "#aaa" }}>{t("No movies yet.")}</Text>
          </View>
        }
      />

      {/* Options modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
          <View style={styles.menu}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => {
                  setShowOptions(false);
                  item.onPress?.();
                }}
              >
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
  overlayHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { alignItems: "center", justifyContent: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 8,
    bottom: 302,
    left: 75,
    width: 220,
    borderWidth: 1,
    borderColor: "#333",
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 16 },
  menuText: { color: "#fff", fontSize: 14, fontWeight: "500" },
});
