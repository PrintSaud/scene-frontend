// src/screens/search/tabs/UsersTab.js
import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

export default function UsersTab({
  results = [],
  saveToRecentSearches,                 // (username, "users")
  backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL,
  onPressUser,                          // optional override; if passed, we call this instead of default nav
}) {
  const navigation = useNavigation();

  const handlePress = async (user) => {
    try {
      await saveToRecentSearches?.(user?.username || "user", "users");
    } catch {}
    if (onPressUser) return onPressUser(user);

    // Default: go to Profile screen with id param.
    // If your Profile tab expects no params, adjust this as needed.
    navigation.navigate("Profile", { id: user?._id });
  };

  return (
    <FlatList
      data={results}
      keyExtractor={(u, i) => u?._id || u?.id || String(i)}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      renderItem={({ item: user }) => {
        const avatar =
          user?.avatar?.startsWith?.("http")
            ? user.avatar
            : user?.avatar
            ? `${backendUrl}${user.avatar}`
            : FALLBACK_AVATAR;

        return (
          <TouchableOpacity
            onPress={() => handlePress(user)}
            activeOpacity={0.85}
            style={styles.row}
          >
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.username}>
                {user?.username || "user"}
              </Text>
              <Text style={styles.handle}>@{user?.username || "user"}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No users found.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  username: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    // fontFamily: "PixelifySans_700Bold", // uncomment if you want Pixelify here
  },
  handle: { color: "#aaa", fontSize: 12, marginTop: 2 },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 16,
  },
});
