import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import api, {
  suggestMovieToFriends,
  suggestReviewToFriends,
  suggestListToFriends,
} from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";

export default function ShareToFriendScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { type, id } = route.params || {};
  const t = useTranslate();

  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [resourceTitle, setResourceTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const toggleSelect = (uid) => {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) {
          Toast.show({ type: "scene", text1: t("not_logged_in") });
          return;
        }
        const parsed = JSON.parse(storedUser);

        // 🔥 Fetch fresh user from backend
        const freshRes = await api.get(`/api/users/${parsed._id}`);
        setCurrentUser(freshRes.data);

        const usersRes = await api.get("/api/users");
        setAllUsers(usersRes.data);

        // normalize type to avoid casing bugs
        const normalized = (type || "").toLowerCase();
        let title = "";

        if (normalized === "movie") {
          try {
            const res = await api.get(`/api/movies/${id}`);
            title = res.data?.title || t("untitled_movie");
          } catch {
            const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
            const tmdbRes = await fetch(
              `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`
            );
            const tmdbData = await tmdbRes.json();
            title = tmdbData?.title || t("untitled_movie");
          }
        } else if (normalized === "log") {
          const res = await api.get(`/api/logs/${id}`);
          title = res.data?.movie?.title || t("untitled_log");
        } else if (normalized === "list") {
          const res = await api.get(`/api/lists/${id}`);
          title = res.data?.title || t("untitled_list");
        }

        setResourceTitle(title || t("invalid_resource"));
        setLoading(false);
      } catch (err) {
        console.error("❌ Error loading data:", err?.response || err);
        setError(true);
        setLoading(false);
      }
    })();
  }, [id, type]);

  const handleSend = async () => {
    try {
      if (!selected.length) {
        Toast.show({ type: "scene", text1: t("select_at_least_one") });
        return;
      }

      const normalized = (type || "").toLowerCase();

      if (normalized === "movie") {
        await Promise.all(
          selected.map((friendId) =>
            suggestMovieToFriends(friendId, currentUser._id, id)
          )
        );
      } else if (normalized === "log") {
        await suggestReviewToFriends(id, selected);
      } else if (normalized === "list") {
        await suggestListToFriends(id, selected);
      }

      Toast.show({
        type: "scene",
        text1: t("suggested_success", { count: selected.length }),
      });
      navigation.goBack();
    } catch (err) {
      console.error("❌ Suggest error:", err?.response || err);
      Toast.show({ type: "scene", text1: t("failed_to_send") });
    }
  };

  const mutualFollowers = allUsers.filter((u) => {
    const meId = currentUser?._id?.toString();
    const userId = u._id?.toString();
    const meFollowing = (currentUser?.following || []).map((id) =>
      id.toString()
    );
    const userFollowing = (u.following || []).map((id) => id.toString());

    return (
      userId !== meId &&
      meFollowing.includes(userId) &&
      userFollowing.includes(meId)
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
                     <ActivityIndicator size="large" color= "#B327F6" />
        <Text style={{ color: "#fff", marginTop: 10 }}>{t("loading")}</Text>
      </View>
    );
  }

  if (error || !resourceTitle) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff", fontSize: 16 }}>❌ {t("invalid_resource")}</Text>
        <Text style={{ color: "#aaa", marginTop: 8 }}>{t("something_wrong")}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.sendBtn, { marginTop: 20, backgroundColor: "#222" }]}
        >
          <Text style={{ color: "#fff" }}>← {t("go_back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📤 {t("share_to_friends")}</Text>
        <TouchableOpacity
          onPress={handleSend}
          disabled={selected.length === 0}
          style={[
            styles.sendBtn,
            { backgroundColor: selected.length === 0 ? "#444" : "#B327F6" },
          ]}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{t("send")}</Text>
        </TouchableOpacity>
      </View>

      {/* Mutual Followers */}
      {mutualFollowers.length === 0 ? (
        <Text style={styles.noFollowers}>{t("no_mutual_followers")}</Text>
      ) : (
        <FlatList
          data={mutualFollowers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => toggleSelect(item._id)}
              style={[
                styles.userRow,
                selected.includes(item._id) && { backgroundColor: "#2a2a2a" },
              ]}
            >
              <Image
                source={{
                  uri:
                    item.avatar ||
                    "https://scenesa.com/default-avatar.png",
                }}
                style={styles.avatar}
              />
              <Text style={{ color: "#fff" }}>@{item.username}</Text>
              {selected.includes(item._id) && (
                <Text style={styles.checkmark}>✔</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0e0e", paddingTop: 50 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0e0e0e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  noFollowers: { color: "#aaa", textAlign: "center", marginTop: 50 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  checkmark: { marginLeft: "auto", fontSize: 16, color: "#B327F6" },
});
