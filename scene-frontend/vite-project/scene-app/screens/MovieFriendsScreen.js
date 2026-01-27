// src/screens/MovieFriendsScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useTranslate from "shared/utils/useTranslate";
import StarRating from "../components/StarRating";
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0e0e0e", paddingHorizontal: 16, paddingTop: 62 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: { flexDirection: "row", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: "#B327F6", borderColor: "#B327F6" },
  chipText: { color: "#fff", fontSize: 13 },
  emptyText: { color: "#888", fontSize: 14, paddingVertical: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 14, backgroundColor: "#222" },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  username: { color: "#fff", fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  subtle: { color: "#aaa" },
});

// 🧠 pick a representative log per user
function pickDisplayLog(logsForUser) {
  if (!Array.isArray(logsForUser) || !logsForUser.length) return null;
  const withRating = logsForUser.find((l) => typeof l.rating === "number");
  if (withRating) return withRating;
  const withReview = logsForUser.find((l) => l.review && String(l.review).trim() !== "");
  if (withReview) return withReview;
  const withRewatch = logsForUser.find(
    (l) =>
      (typeof l.rewatchCount === "number" && l.rewatchCount > 0) ||
      (typeof l.rewatch === "number" && l.rewatch > 0)
  );
  if (withRewatch) return withRewatch;
  return logsForUser[0];
}

export default function MovieFriendsScreen() {
  const t = useTranslate();
  const nav = useNavigation();
  const route = useRoute();
  const id = route.params?.id; // TMDB id

  const [filter, setFilter] = useState("friends"); // "friends" | "all"
  const [logs, setLogs] = useState(null);
  const [token, setToken] = useState(null);

  const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    (async () => {
      try {
        const u = await AsyncStorage.getItem("user");
        const me = u ? JSON.parse(u) : null;
        setToken(me?.token || null);
      } catch {}
    })();
  }, []);

  const loadLogs = useCallback(async () => {
    if (!id) return;
    try {
      setLogs(null);
      const endpoint =
        filter === "friends"
          ? `${BACKEND}/api/logs/movie/${id}/friends`
          : `${BACKEND}/api/logs/movie/${id}/all`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      const json = await res.json();
      const raw = Array.isArray(json?.logs) ? json.logs : Array.isArray(json) ? json : [];
      setLogs(raw);
    } catch (e) {
      console.warn("❌ Failed to load logs", e);
      setLogs([]);
    }
  }, [id, filter, BACKEND, token]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Group unique by user
  const uniqueByUser = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    const seen = new Set();
    const arr = [];
    for (const log of logs) {
      const uid =
        log?.user?._id ??
        log?.userId ??
        log?.user_id ??
        (typeof log?.user === "string" ? log.user : null);
      if (!uid) continue;
      if (seen.has(uid)) continue;
      seen.add(uid);
      arr.push(log);
    }
    return arr;
  }, [logs]);

  const renderItem = ({ item }) => {
    const uid =
      item?.user?._id ??
      item?.userId ??
      item?.user_id ??
      (typeof item?.user === "string" ? item.user : null);
  
    const sameUserLogs = (logs || []).filter((l) => {
      const luid =
        l?.user?._id ??
        l?.userId ??
        l?.user_id ??
        (typeof l?.user === "string" ? l.user : null);
      return luid === uid;
    });
  
    const displayLog = pickDisplayLog(sameUserLogs);
    const reviews = sameUserLogs.filter(
      (l) => l.review && String(l.review).trim() !== ""
    );
    const hasMultipleReviews = reviews.length > 1;
  
    const hasRating = typeof displayLog?.rating === "number";
    const hasReview =
      !!(displayLog?.review && String(displayLog.review).trim() !== "");
    const rewatchCount = Number(displayLog?.rewatchCount || displayLog?.rewatch || 0);
  
    const avatar =
      (displayLog?.user?.avatar && displayLog.user.avatar.startsWith?.("http"))
        ? displayLog.user.avatar
        : FALLBACK_AVATAR;
  
    const go = () => {
      if (hasMultipleReviews) {
        nav.navigate("ReviewPickerScreen", { movieId: id, userId: uid });
      } else if (reviews.length === 1) {
        nav.navigate("ReviewPage", { id: reviews[0]._id });
      } else {
        nav.navigate("ProfileScreen", { id: uid }); // ✅ fixed navigation
      }
    };
  
    return (
      <TouchableOpacity onPress={go} style={S.itemRow}>
        <Image source={{ uri: avatar }} style={S.avatar} />
        <View style={{ flex: 1 }}>
          <View style={S.usernameRow}>
            <Text style={S.username}>
              @{String(displayLog?.user?.username || "user")}
            </Text>
          </View>
  
          <View style={S.metaRow}>
            {hasRating ? (
              <StarRating rating={Number(displayLog.rating)} size={12} />
            ) : null}
            {hasReview ? (
              <MaterialCommunityIcons name="chat-outline" size={14} color="#aaa" />
            ) : null}
            {rewatchCount > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <MaterialIcons name="refresh" size={14} color="#aaa" />
                <Text style={S.subtle}>{rewatchCount}x</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  
  

  return (
    <View style={S.screen}>
      {/* Header */}
      <View style={S.headerRow}>
        <View style={S.headerLeft}>
          <TouchableOpacity onPress={() => nav.goBack()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={S.headerTitle}>
            {t("watched_by")} {filter === "friends" ? t("friends") : t("all")}
          </Text>
        </View>

        {/* Toggle */}
        <View style={S.toggleRow}>
          <TouchableOpacity
            onPress={() => setFilter("friends")}
            style={[S.chip, filter === "friends" && S.chipActive]}
          >
            <Text style={S.chipText}>{t("friends")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={[S.chip, filter === "all" && S.chipActive]}
          >
            <Text style={S.chipText}>{t("all")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {logs === null ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : uniqueByUser.length === 0 ? (
        <Text style={S.emptyText}>
          {filter === "friends" ? t("no_friends_logged") : t("no_one_logged")}
        </Text>
      ) : (
        <FlatList
          data={uniqueByUser}
          keyExtractor={(item, idx) => String(item?._id || idx)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
