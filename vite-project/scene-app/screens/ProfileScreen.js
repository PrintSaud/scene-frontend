// src/screens/ProfilePage.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import ProfileTabProfile from "../components/profile/ProfileTabProfile";
import ProfileTabReviews from "../components/profile/ProfileTabReviews";
import ProfileTabWatchlist from "../components/profile/ProfileTabWatchlist";
import ProfileTabLists from "../components/profile/ProfileTabLists";
import ProfileTabFilms from "../components/profile/ProfileTabFilms";

import api, { getUserProfile, getCustomPostersBatch } from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";

export default function ProfilePage() {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { id: paramId, initialTab } = route.params || {};

  // 👇 default tab comes from route params (like Films stat navigation)
  const [activeTab, setActiveTab] = useState(initialTab || "Profile");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [customPosters, setCustomPosters] = useState({});
  const [reviewFilter, setReviewFilter] = useState("recent");
  const [sortType, setSortType] = useState("added");
  const [order, setOrder] = useState("desc");
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [stored, setStored] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [resolvedPosters, setResolvedPosters] = useState({});
  const [loading, setLoading] = useState(true);

  const imgRef = useRef();
  const t = useTranslate();

  // Load stored user
  useEffect(() => {
    const loadStored = async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed?._id) throw new Error("Missing _id");
        setStored(parsed);
      } catch (err) {
        console.warn("❌ Invalid local user — redirecting to login");
        navigation.navigate("Login");
      }
    };
    loadStored();
  }, [navigation]);

  const id = paramId || stored?._id;
  const isOwner = stored?._id === String(id);

  // 🔄 Auto-refresh on focus
  useEffect(() => {
    if (!id || !isFocused) return;

    const fetchUser = async () => {
      try {
        const userRes = await getUserProfile(id);
        setUser(userRes.data);
      } catch (err) {
        console.error("❌ Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await api.get(`/api/logs/user/${id}`);
        setLogs(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch logs:", err);
      }
    };

    fetchUser();
    fetchLogs();
  }, [id, isFocused]);

  const removeFollower = async (targetUserId) => {
    try {
      const storedUser = JSON.parse(await AsyncStorage.getItem("user"));
      if (!storedUser?.token) return;

      await api.post(
        `/api/users/${storedUser._id}/remove-follower/${targetUserId}`,
        {},
        { headers: { Authorization: `Bearer ${storedUser.token}` } }
      );

      // ✅ update local state
      setUser((prev) =>
        prev
          ? {
              ...prev,
              followers: prev.followers.filter(
                (fid) => String(fid) !== String(targetUserId)
              ),
            }
          : prev
      );

      // ✅ auto-refresh by refetching profile
      const refreshed = await getUserProfile(id);
      setUser(refreshed.data);

      Toast.show({ type: "scene", text1: t("Follower removed.") });
    } catch (err) {
      console.error("❌ remove follower failed:", err);
      Toast.show({ type: "scene", text1: t("Failed to remove follower.") });
    }
  };

  // Custom posters fetch
  useEffect(() => {
    if (!Array.isArray(logs) || !user) return;

    const fetchCustomPosters = async () => {
      const userId = user._id;

      const getId = (obj) => {
        if (!obj) return null;
        if (typeof obj === "number") return obj;
        if (typeof obj === "string" && /^\d+$/.test(obj)) return Number(obj);
        return Number(obj?.tmdbId ?? obj?.id ?? obj?._id) || null;
      };

      const logIds = (logs || [])
        .filter(Boolean)
        .map((log) => getId(log?.tmdbId ?? log))
        .filter((v) => Number.isFinite(v));

      const favIds = (user?.favoriteFilms || [])
        .filter(Boolean)
        .map((m) => getId(m))
        .filter((v) => Number.isFinite(v));

      const movieIds = [...new Set([...logIds, ...favIds])];
      if (!userId || movieIds.length === 0) return;

      try {
        const data = await getCustomPostersBatch(userId, movieIds);
        setCustomPosters(data);
      } catch (err) {
        console.error("❌ Failed to fetch custom posters", err);
      }
    };

    fetchCustomPosters();
  }, [logs, user]);

  // Resolved posters mapping
  useEffect(() => {
    if (!logs.length || !user) return;

    const finalPosters = {};
    logs.forEach((log) => {
      const tmdbId = log.tmdbId;
      const custom = customPosters[tmdbId];
      const tmdb = log.poster_path
        ? `https://image.tmdb.org/t/p/w500${log.poster_path}`
        : null;
      finalPosters[tmdbId] =
        custom || tmdb || "https://scenesa.com/default-poster.jpg";
    });

    setResolvedPosters(finalPosters);
  }, [logs, customPosters]);

  // Follow status
  useEffect(() => {
    if (stored && user) {
      setIsFollowing(user.followers?.includes(stored._id));
    }
  }, [user, stored]);

  const handleFollow = async (targetId) => {
    try {
      const user = JSON.parse(await AsyncStorage.getItem("user"));
      const token = user?.token;
  
      const res = await api.post(
        `/api/users/${user._id}/follow/${targetId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setIsFollowing(res.data.following);
  
      // ✅ Use Scene-style toast
      Toast.show({
        type: "scene",
        text1: res.data.message || (res.data.following ? t("Following") : t("Unfollowed")),
      });
    } catch (err) {
      console.error("❌ Follow toggle failed:", err);
      Toast.show({
        type: "scene",
        text1: t("Something went wrong. Try again."),
      });
    }
  };
  

  if (loading || !user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={styles.loadingText}>{t("Loading...")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <ProfileHeader
        user={user}
        logs={logs}
        navigation={navigation}
        imgRef={imgRef}
        isOwner={isOwner}
        isFollowing={isFollowing}
        handleFollow={handleFollow}
        handleRemoveFollower={removeFollower}
      />

      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <View style={{ paddingHorizontal: 16 }}>
        {activeTab === "Profile" && (
          <ProfileTabProfile
            user={user}
            logs={logs}
            favoriteMovies={user?.favoriteFilms}
            profileUserId={user._id}
            customPosters={customPosters}
            handleRemoveFollower={removeFollower}
          />
        )}

        {activeTab === "Reviews" && (
          <ProfileTabReviews
            logs={logs}
            filter={reviewFilter}
            setFilter={setReviewFilter}
            navigation={navigation}
            customPosters={customPosters}
          />
        )}

        {activeTab === "Watchlist" && (
          <ProfileTabWatchlist
            user={user}
            sortType={sortType}
            setSortType={setSortType}
            order={order}
            setOrder={setOrder}
            watchList={watchlist}
            setWatchList={setWatchlist}
            profileUserId={id}
          />
        )}

        {activeTab === "Lists" && (
          <ProfileTabLists
            user={stored}
            profileUserId={id}
            refreshTrigger={listRefreshKey}
            triggerRefresh={() => setListRefreshKey((prev) => prev + 1)}
          />
        )}

        {activeTab === "Films" && (
          <ProfileTabFilms
            logs={logs}
            favorites={user?.favorites}
            profileUserId={user?._id}
            customPosters={customPosters}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0e0e0e",
  },
  loadingText: {
    marginTop: 12,
    color: "white",
    fontSize: 16,
  },
});
