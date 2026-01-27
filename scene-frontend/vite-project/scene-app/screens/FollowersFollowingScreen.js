// src/screens/FollowersFollowingScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useTranslate from "shared/utils/useTranslate";
import api from "shared/api/api";
import { backend } from "shared/config";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

export default function FollowersFollowingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const t = useTranslate();

  const { id, initialTab = "followers" } = route.params || {};
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [profileUsername, setProfileUsername] = useState("User");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // translated labels
  const TAB_LABELS = useMemo(
    () => ({
      followers: t("Followers"),
      following: t("Following"),
    }),
    [t]
  );

  // load logged-in user
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  // fetch users
  useEffect(() => {
    if (!id) return;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/users/${id}/${activeTab}`, {
          headers: currentUser?.token
            ? { Authorization: `Bearer ${currentUser.token}` }
            : {},
        });
        const arr = res.data.followers || res.data.following || [];
        setUsers(arr);
        setProfileUsername(res.data.user?.username || t("User"));
      } catch (err) {
        console.error("❌ Fetch failed:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [id, activeTab, currentUser?.token]);

  const toggleFollow = async (targetId) => {
    if (!currentUser) return; // could redirect to Login
    try {
      await api.post(
        `/api/users/${currentUser._id}/follow/${targetId}`,
        {},
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      const isFollowing = (currentUser.following || []).includes(targetId);
      const updatedFollowing = isFollowing
        ? currentUser.following.filter((fid) => fid !== targetId)
        : [...(currentUser.following || []), targetId];
      const updatedUser = { ...currentUser, following: updatedFollowing };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Toggle follow failed:", err);
    }
  };

  const renderUser = ({ item: u }) => {
    const iFollow = (currentUser?.following || []).includes(u._id);
    const isMe = currentUser?._id === u._id;
    return (
      <View style={styles.userRow}>
{/* Avatar + Username */}
<TouchableOpacity
  style={styles.userInfo}
  onPress={() =>
    navigation.push("ProfileScreen", { id: u._id }) // ✅ correct screen + keeps stack history
  }
>
  <Image
    source={{ uri: u.avatar || FALLBACK_AVATAR }}
    style={styles.avatar}
  />
  <Text style={styles.username}>{u.username || t("User")}</Text>
</TouchableOpacity>




        {/* Follow/Unfollow */}
        {!isMe && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              { backgroundColor: iFollow ? "#222" : "#fff" },
            ]}
            onPress={() => toggleFollow(u._id)}
          >
            <Text
              style={[
                styles.followBtnText,
                { color: iFollow ? "#fff" : "#000" },
              ]}
            >
              {iFollow ? t("Unfollow") : t("Follow")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back + Title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("{{name}}’s {{tab}}", {
            name: profileUsername,
            tab: TAB_LABELS[activeTab],
          })}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab("following")}
          style={[
            styles.tabBtn,
            activeTab === "following" && styles.tabBtnActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "following" && styles.tabTextActive,
            ]}
          >
            {TAB_LABELS.following}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("followers")}
          style={[
            styles.tabBtn,
            activeTab === "followers" && styles.tabBtnActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "followers" && styles.tabTextActive,
            ]}
          >
            {TAB_LABELS.followers}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#B327F6" style={{ marginTop: 20 }} />
      ) : users.length === 0 ? (
        <Text style={styles.emptyText}>{t("No users found.")}</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u._id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    top:22,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    marginBottom: 60,
    top:28,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 36, // balance space for back button
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#222",
  },
  tabBtnActive: {
    backgroundColor: "#fff",
  },
  tabText: { color: "#fff", fontSize: 12 },
  tabTextActive: { color: "#000" },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: "#222",
  },
  username: { color: "#fff", fontSize: 13, fontWeight: "600" },
  followBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  followBtnText: { fontSize: 12, fontWeight: "600" },
  emptyText: { color: "#888", textAlign: "center", marginTop: 20 },
});
