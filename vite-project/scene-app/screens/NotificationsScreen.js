// src/screens/NotificationsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { formatDistanceToNow } from "date-fns";
import { socket } from "shared/socket";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import { useNotification } from "shared/context/NotificationContext";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { markAllRead, syncUnreadCount } = useNotification();
  const t = useTranslate();

  const getActionText = (type) => {
    switch (type) {
      case "follow":
        return t("just followed you");
      case "review_like":
        return t("liked your review");
      case "reaction":
        return t("liked your comment");
      case "reply":
        return t("replied to your comment");
      case "list_like":
        return t("liked your list!");
      case "share-list":
        return t("suggested you to check out this list!");
      case "suggest_movie":
        return t("suggested you to check out this film!");
      case "share-review":
        return t("suggested you to check out this review!");
      case "share-movie":
        return t("shared a movie with you!");
      default:
        return t("sent you something!");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get("/api/notifications");
        setNotifications(data);
      } catch (err) {
        console.error("❌ Failed to fetch notifications", err);
        Toast.show({ type: "scene", text1: t("Failed to load notifications") });
      } finally {
        setLoading(false);
      }

      try {
        await api.patch("/api/notifications/read");
        markAllRead();
        syncUnreadCount();
      } catch (err) {
        console.error("❌ Failed to mark all as read", err);
      }
    };

    init();

    socket.off("notification");
    socket.on("notification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      Toast.show({
        type: "scene",
        text1: `${t("🔔 New notification")}: ${newNotif.message || ""}`,
      });
      syncUnreadCount();
    });

    return () => socket.off("notification");
  }, []);

  const markAsReadAndNavigate = async (n, destination) => {
    try {
      await api.patch(`/api/notifications/read-single/${n._id}`);
      navigation.navigate(destination.screen, destination.params);
    } catch (err) {
      console.error("❌ Failed to mark notification as read", err);
      Toast.show({ type: "scene", text1: t("Something went wrong") });
    }
  };

  const renderItem = ({ item: n }) => {
    return (
      <View style={styles.notifRow}>
        <TouchableOpacity
  onPress={() =>
    navigation.navigate("ProfileScreen", { id: n.from?._id })
  }
>
  <Image
    source={{ uri: n.from?.avatar || FALLBACK_AVATAR }}
    style={styles.avatar}
  />
</TouchableOpacity>



        <View style={{ flex: 1 }}>
          {/* Text */}
          <TouchableOpacity
            onPress={() => {
              if (n.type === "follow") {
                navigation.navigate("Profile", { id: n.from?._id });
              } else if (["review_like", "reaction", "reply"].includes(n.type)) {
                markAsReadAndNavigate(n, {
                  screen: "ReviewPage",
                  params: { id: n.relatedId },
                });
              } else if (["share-list", "list_like"].includes(n.type)) {
                markAsReadAndNavigate(n, {
                  screen: "ListViewPage",
                  params: { id: n.listId },
                });
              } else if (["share-movie", "suggest_movie"].includes(n.type)) {
                markAsReadAndNavigate(n, {
                  screen: "Movie",
                  params: { id: n.movieId || n.relatedId },
                });
              } else if (n.type === "share-review") {
                markAsReadAndNavigate(n, {
                  screen: "ReviewPage",
                  params: { id: n.reviewId },
                });
              }
            }}
          >
            <Text style={styles.text}>
              <Text style={styles.username}>@{n.from?.username} </Text>
              {getActionText(n.type)}
            </Text>
          </TouchableOpacity>

          {/* View buttons */}
          {n.type === "suggest_movie" && (
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                markAsReadAndNavigate(n, {
                  screen: "Movie",
                  params: { id: n.movieId },
                })
              }
            >
              <Text style={styles.viewBtnTxt}>🎬 {t("View Movie")}</Text>
            </TouchableOpacity>
          )}
          {n.type === "share-list" && (
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                markAsReadAndNavigate(n, {
                  screen: "ListViewPage",
                  params: { id: n.listId },
                })
              }
            >
              <Text style={styles.viewBtnTxt}>📋 {t("View List")}</Text>
            </TouchableOpacity>
          )}
          {n.type === "share-review" && (
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                markAsReadAndNavigate(n, {
                  screen: "ReviewPage",
                  params: { id: n.reviewId },
                })
              }
            >
              <Text style={styles.viewBtnTxt}>✍️ {t("View Review")}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.time}>
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </Text>
        </View>

        {!n.read && <View style={styles.unreadDot} />}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#B327F6" size="large" />
        <Text style={{ marginTop: 8, color: "#888" }}>{t("Loading...")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={notifications}
      keyExtractor={(n) => n._id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      ListHeaderComponent={
        <Text style={styles.header}>🔔 {t("Notifications")}</Text>
      }
      ListEmptyComponent={
        <Text style={{ color: "#888", marginTop: 20 }}>
          {t("You're all caught up. No notifications yet!")}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0e0e" },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    fontFamily: "Inter",
    color: "#fff",
    marginTop:52,
    fontFamily: "PixelifySans_700Bold",
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    gap: 14,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#444",
  },
  text: { fontSize: 14, color: "#ddd" },
  username: { fontWeight: "600", color: "#fff" },
  time: { fontSize: 12, color: "#888", marginTop: 4 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#b46eff",
  },
  viewBtn: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  viewBtnTxt: { fontSize: 12, color: "#fff" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0e0e0e",
  },
});
