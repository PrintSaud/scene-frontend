// src/components/profile/ProfileTabLists.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  DeviceEventEmitter
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getMyLists,
  getUserLists,
  getSavedLists,
  getPopularLists,
  getFriendsLists,
} from "shared/api/api";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import { MaterialIcons } from "@expo/vector-icons";

export default function ProfileTabLists({
  user,
  profileUserId,
  refreshTrigger,
  currentUserId,
}) {
  const navigation = useNavigation();
  const t = useTranslate();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [myLists, setMyLists] = useState([]);
  const [savedLists, setSavedLists] = useState([]);
  const [popularLists, setPopularLists] = useState([]);
  const [friendsLists, setFriendsLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [myId, setMyId] = useState(currentUserId ?? null);
  useEffect(() => {
    if (currentUserId) {
      setMyId(String(currentUserId));
      return;
    }
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
  }, [currentUserId]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("listsUpdated", fetchLists);
    return () => sub.remove();
  }, [profileUserId, isOwner]);

  const isOwner = user?._id === profileUserId;
  const availableTabs = isOwner
    ? ["my", "saved", "popular", "friends"]
    : ["my", "saved", "popular"];
  const [activeSubTab, setActiveSubTab] = useState(availableTabs[0]);

  const TAB_LABELS = useMemo(
    () => ({
      my: t("My lists"),
      saved: t("Saved"),
      popular: t("Popular"),
      friends: t("Friends"),
    }),
    [t]
  );

  

  // ✅ Extracted fetch function so it can be reused
  const fetchLists = async () => {
    try {
      if (!refreshing) setLoading(true);
      const [myRes, savedRes, popularRes, friendsRes] = await Promise.all([
        isOwner ? getMyLists() : getUserLists(profileUserId),
        isOwner ? getSavedLists() : Promise.resolve({ data: [] }),
        getPopularLists(),
        isOwner ? getFriendsLists() : Promise.resolve({ data: [] }),
      ]);

      const filteredMy = isOwner
        ? myRes.data
        : (myRes.data || []).filter((list) => !list.isPrivate);

      setMyLists(filteredMy || []);
      setSavedLists(savedRes.data || []);
      setPopularLists(popularRes.data || []);
      setFriendsLists(friendsRes.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch lists", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [profileUserId, isOwner, refreshTrigger]);

  // ✅ Auto refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchLists, 30000);
    return () => clearInterval(interval);
  }, [profileUserId, isOwner]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLists();
  };

  const displayedLists = useMemo(() => {
    switch (activeSubTab) {
      case "my":
        return myLists;
      case "saved":
        return savedLists;
      case "popular":
        return popularLists;
      case "friends":
        return friendsLists;
      default:
        return [];
    }
  }, [activeSubTab, myLists, savedLists, popularLists, friendsLists]);

  const listIdOf = (l) => l?._id || l?.id;
  const extractId = (val) => {
    if (!val) return null;
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object")
      return String(val.userId || val.user || val._id || val.id || val.ownerId || "");
    return null;
  };
  const arrayHasMyId = (arr, mine) =>
    !!mine && Array.isArray(arr) && arr.some((x) => String(extractId(x)) === String(mine));

  const getLikeCount = (list) =>
    (Array.isArray(list.likes) && list.likes.length) ||
    list.likesCount ||
    list.heartsCount ||
    list.favoritesCount ||
    list?.stats?.likes ||
    0;

  const getIsLikedByMe = (list) => {
    if (list?.likedByMe === true || list?.isLikedByMe === true || list?.isLiked === true)
      return true;
    if (!myId) return false;
    return (
      arrayHasMyId(list.likes, myId) ||
      arrayHasMyId(list.likedBy, myId) ||
      arrayHasMyId(list.hearts, myId) ||
      arrayHasMyId(list.favorites, myId)
    );
  };

  const handleLikeList = async (id) => {
    const idStr = String(id);
    const toggleIn = (arr) =>
      (arr || []).map((L) => {
        if (String(listIdOf(L)) !== idStr) return L;
        const currentlyLiked = getIsLikedByMe(L);
        const nextLiked = !currentlyLiked;
        const currentCount = getLikeCount(L);
        const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

        let nextLikes = Array.isArray(L.likes) ? [...L.likes] : L.likes;
        if (Array.isArray(nextLikes) && myId) {
          if (nextLiked) {
            if (!arrayHasMyId(nextLikes, myId)) nextLikes.push(myId);
          } else {
            nextLikes = nextLikes.filter((x) => String(extractId(x)) !== String(myId));
          }
        }

        return {
          ...L,
          likedByMe: nextLiked,
          likes: nextLikes,
          likesCount: !Array.isArray(nextLikes) ? nextCount : nextLikes.length,
          _uiLikesCount: nextCount,
        };
      });

    setMyLists((prev) => toggleIn(prev));
    setSavedLists((prev) => toggleIn(prev));
    setPopularLists((prev) => toggleIn(prev));
    setFriendsLists((prev) => toggleIn(prev));

    try {
      await api.post(`/api/lists/${idStr}/like`);
    } catch (e) {
      console.error("like list failed", e);
    }
  };

  const renderListCard = ({ item: list }) => {
    const isLikedByMe = getIsLikedByMe(list);
    const likeCount = getLikeCount(list);

    return (
      <TouchableOpacity
        style={[styles.card, { flex: 1 }]}
        onPress={() => navigation.navigate("ListViewPage", { id: list._id })}
        activeOpacity={0.85}
      >
        {list.coverImage && (
          <Image source={{ uri: list.coverImage }} style={styles.cover} />
        )}
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>
            {list.title}
          </Text>
          <Text style={styles.username}>
            @{list.user?.username || t("Unknown")}
          </Text>
          <View style={styles.likeRow}>
            <TouchableOpacity
              onPress={() => handleLikeList(list._id || list.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <MaterialIcons
                name={isLikedByMe ? "favorite" : "favorite-border"}
                size={16}
                color={isLikedByMe ? "#B327F6" : "#999"}
              />
              <Text style={[styles.likeCount, { color: isLikedByMe ? "#B327F6" : "#999" }]}>
                {likeCount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const extraKey =
    (myId || "none") +
    "|" +
    displayedLists
      .map((L) => `${listIdOf(L)}:${getLikeCount(L)}:${getIsLikedByMe(L) ? 1 : 0}`)
      .join("|");

  const numColumns = isTablet ? 3 : 1;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabsRow}>
        {availableTabs.map((tabId) => {
          const isActive = activeSubTab === tabId;
          return (
            <TouchableOpacity
              key={tabId}
              style={[styles.tabBtn, isActive && styles.activeTabBtn]}
              onPress={() => setActiveSubTab(tabId)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {TAB_LABELS[tabId]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeSubTab === "my" && isOwner && (
        <View style={{ alignItems: "flex-end", paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("CreateListScreen")}
          >
            <Text style={styles.addBtnText}>➕ {t("Add List")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#B327F6" />
          <Text style={{ color: "#aaa", marginTop: 8 }}>{t("Loading lists...")}</Text>
        </View>
      ) : displayedLists.length > 0 ? (
        <FlatList
          data={displayedLists}
          renderItem={renderListCard}
          keyExtractor={(list) => String(list._id || list.id)}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          columnWrapperStyle={numColumns > 1 ? { gap: 16 } : null}
          extraData={extraKey}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        />
      ) : (
        <Text style={styles.empty}>{t("No lists to show.")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  tabBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  activeTabBtn: { backgroundColor: "#222" },
  tabText: { color: "#eee", fontSize: 13 },
  activeTabText: { fontWeight: "bold" },
  addBtn: {
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 16,
  },
  addBtnText: { color: "#fff", fontSize: 13 },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    flex: 1,
  },
  cover: { width: "100%", height: 160, resizeMode: "cover" },
  cardContent: { padding: 12 },
  title: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  username: { color: "#aaa", fontSize: 12, marginTop: 4 },
  likeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  likeCount: { fontSize: 13, marginLeft: 4 },
  loading: { marginTop: 40, alignItems: "center" },
  empty: { textAlign: "center", marginTop: 40, color: "#aaa" },
});
