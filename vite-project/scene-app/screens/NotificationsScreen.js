// src/screens/NotificationsScreen.js
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { formatDistanceToNow } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import api from "../../../shared/api/api";
import useTranslate from "../../../shared/utils/useTranslate";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

function getAvatarUri(avatar) {
  if (!avatar) return FALLBACK_AVATAR;

  if (
    typeof avatar === "string" &&
    (avatar.startsWith("http") || avatar.startsWith("data:"))
  ) {
    return avatar;
  }

  return FALLBACK_AVATAR;
}

function getNotifId(n) {
  return String(n?._id || n?.id || Math.random());
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const t = useTranslate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getActionText = (type) => {
    switch (type) {
      case "follow":
        return t("just followed you") || "just followed you";
      case "review_like":
        return t("liked your review") || "liked your review";
      case "reaction":
        return t("liked your comment") || "liked your comment";
      case "reply":
        return t("replied to your comment") || "replied to your comment";
      case "list_like":
        return t("liked your list!") || "liked your list!";
      case "share-list":
        return (
          t("suggested you to check out this list!") ||
          "suggested you to check out this list!"
        );
      case "suggest_movie":
        return (
          t("suggested you to check out this film!") ||
          "suggested you to check out this film!"
        );
      case "share-review":
        return (
          t("suggested you to check out this review!") ||
          "suggested you to check out this review!"
        );
      case "share-movie":
        return t("shared a movie with you!") || "shared a movie with you!";
      default:
        return t("sent you something!") || "sent you something!";
    }
  };

  const loadNotifications = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);

      const { data } = await api.get("/api/notifications");

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setNotifications(arr);
    } catch (err) {
      console.error("❌ Failed to fetch notifications", err?.message || err);
      Toast.show({
        type: "scene",
        text1: t("Failed to load notifications") || "Failed to load notifications",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllAsReadSilently = async () => {
    try {
      await api.patch("/api/notifications/mark-all-read");
    } catch (err1) {
      try {
        await api.patch("/api/notifications/read-all");
      } catch (err2) {
        try {
          await api.patch("/api/notifications/mark-read");
        } catch (err3) {
          console.log("Could not mark all notifications as read yet.");
        }
      }
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications({ silent: true });
      markAllAsReadSilently();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications({ silent: true });
  };

  const markSingleRead = async (notificationId) => {
    if (!notificationId) return;

    try {
      await api.patch(`/api/notifications/read-single/${notificationId}`);
    } catch (err) {
      console.log("Could not mark single notification as read.");
    }

    setNotifications((prev) =>
      prev.map((n) =>
        String(n._id) === String(notificationId) ? { ...n, read: true } : n
      )
    );
  };

  const navigateFromNotification = async (n) => {
    try {
      if (!n) return;

      await markSingleRead(n._id);

      if (n.type === "follow") {
        const profileId = n.from?._id || n.from || n.userId;
        if (profileId) navigation.navigate("ProfileScreen", { id: profileId });
        return;
      }

      if (["review_like", "reaction", "reply"].includes(n.type)) {
        const reviewId = n.relatedId || n.reviewId || n.logId;
        if (reviewId) navigation.navigate("ReviewPage", { id: reviewId });
        return;
      }

      if (["share-review"].includes(n.type)) {
        const reviewId = n.reviewId || n.relatedId || n.logId;
        if (reviewId) navigation.navigate("ReviewPage", { id: reviewId });
        return;
      }

      if (["share-list", "list_like"].includes(n.type)) {
        const listId = n.listId || n.relatedId;
        if (listId) navigation.navigate("ListViewPage", { id: listId });
        return;
      }

      if (["share-movie", "suggest_movie"].includes(n.type)) {
        const movieId = Number(n.movieId || n.relatedId || n.tmdbId);
        if (!Number.isNaN(movieId) && movieId > 0) {
          navigation.navigate("Movie", { id: movieId });
        }
      }
    } catch (err) {
      console.error("❌ Failed notification navigation", err?.message || err);
      Toast.show({
        type: "scene",
        text1: t("Something went wrong") || "Something went wrong",
      });
    }
  };

  const renderItem = ({ item: n }) => {
    const fromUser = n.from || n.fromUser || {};
    const username = fromUser?.username || "user";
    const avatar = getAvatarUri(fromUser?.avatar);

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => navigateFromNotification(n)}
        style={styles.notifRow}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            const profileId = fromUser?._id || fromUser;
            if (profileId) navigation.navigate("ProfileScreen", { id: profileId });
          }}
        >
          <Image source={{ uri: avatar }} style={styles.avatar} />
        </TouchableOpacity>

        <View style={styles.content}>
        <Text style={styles.text}>
  <Text style={styles.username}>@{username} </Text>
  {getActionText(n.type)}
</Text>

          <Text style={styles.time}>
            {n.createdAt
              ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
              : ""}
          </Text>

          {n.type === "suggest_movie" && (
            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnTxt}>🎬 {t("View Movie") || "View Movie"}</Text>
            </View>
          )}

          {n.type === "share-list" && (
            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnTxt}>📋 {t("View List") || "View List"}</Text>
            </View>
          )}

          {n.type === "share-review" && (
            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnTxt}>✍️ {t("View Review") || "View Review"}</Text>
            </View>
          )}
        </View>

        {!n.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#B327F6" size="large" />
        <Text style={styles.loadingText}>{t("Loading...") || "Loading..."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        style={styles.container}
        data={notifications}
        keyExtractor={getNotifId}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 20,
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.header}>🔔 {t("Notifications") || "Notifications"}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-outline" size={34} color="#555" />
            <Text style={styles.emptyText}>
              {t("You're all caught up. No notifications yet!") ||
                "You're all caught up. No notifications yet!"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({


  wrap: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },


  headerRow: {
    marginBottom: 12,
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },

  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 13,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#222",
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: "#ddd",
    lineHeight: 19,
  },
  username: {
    fontWeight: "800",
    color: "#fff",
  },
  time: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#B327F6",
  },
  viewBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: "rgba(179,39,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(179,39,246,0.35)",
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  viewBtnTxt: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "800",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 90,
    paddingHorizontal: 30,
  },
  emptyText: {
    color: "#888",
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  loadingText: {
    marginTop: 8,
    color: "#888",
  },
});

