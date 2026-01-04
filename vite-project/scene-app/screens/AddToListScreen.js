import React, { useEffect, useState } from "react";
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
import Toast from "react-native-toast-message";
import AntDesign from "@expo/vector-icons/AntDesign"; // ✅ instead of react-icons
 // ✅ real Scene heart
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";

export default function AddToListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { movieId, movie } = route.params || {};
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslate();

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        const token = stored ? JSON.parse(stored)?.token : null;
        const me = stored ? JSON.parse(stored) : null;

        if (!me?._id || !token) return;

        const res = await api.get(`/api/lists/user/${me._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLists(res.data || []);
      } catch (err) {
        console.error("❌ Fetch lists error →", err);
        Toast.show({ type: "scene", text1: t("errors.failed_load_lists") });
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, []);

  const handleAdd = async (listId) => {
    if (!movieId || !movie?.title) {
      return Toast.show({ type: "scene", text1: t("errors.missing_movie") });
    }
  
    try {
      const stored = await AsyncStorage.getItem("user");
      const token = stored ? JSON.parse(stored)?.token : null;
  
      await api.post(
        `/api/lists/${listId}/add`,
        {
          id: movieId.toString(),
          title: movie.title,
          poster: movie.poster || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      const addedList = lists.find((l) => l._id === listId);
      Toast.show({
        type: "scene",
        text1: `${t("added_to")} "${addedList?.title}"`,
      });
      navigation.goBack();
    } catch (err) {
      console.error("❌ Add to list error:", err.response?.data || err.message);
      if (err.response?.status === 409) {
        Toast.show({
          type: "scene",
          text1: t("already_in_list") || "This movie is already in the list",
        });
      } else {
        Toast.show({
          type: "scene",
          text1: t("errors.failed_add_to_list"),
        });
      }
    }
  };
  

  const renderList = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleAdd(item._id)}>
      {/* ✅ Show cover if exists, else poster grid */}
      {item.coverImage ? (
        <Image
          source={{ uri: item.coverImage }}
          style={styles.cover}
        />
      ) : (
        <View style={styles.grid}>
          {(item.movies || []).slice(0, 4).map((m, idx) => (
            <Image
              key={idx}
              source={{ uri: m.poster || "https://scenesa.com/default-poster.jpg" }}
              style={styles.gridPoster}
            />
          ))}
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.username}>@{item.user?.username || "unknown"}</Text>

        {/* ✅ Real Scene Like Button */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
  {item.likes?.length > 0 ? (
    <AntDesign name="heart" size={14} color="#B327F6" style={{ marginRight: 4 }} />
  ) : (
    <AntDesign name="hearto" size={14} color="#bbb" style={{ marginRight: 4 }} />
  )}
  <Text style={styles.likes}>
    {item.likes?.length || 0}{" "}
    {item.likes?.length === 1 ? t("like") : t("likes")}
  </Text>
</View>

      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ← Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>{t("select_a_list")}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#B327F6" style={{ marginTop: 20 }} />
      ) : lists.length === 0 ? (
        <Text style={styles.empty}>{t("no_lists_yet")}</Text>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item._id}
          renderItem={renderList}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

// inside styles
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 16, paddingTop: 60 },
    backBtn: {
      position: "absolute",
      top: 53,
      left: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    pageTitle: {
      textAlign: "center",
      color: "#fff",
      fontSize: 18,
      marginBottom: 16,
      fontWeight: "700",
    },
    empty: { textAlign: "center", color: "#aaa", marginTop: 20 },
    card: {
      backgroundColor: "#1a1a1a",
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#333",
    },
    // ✅ Bigger cover image
    cover: { width: "100%", height: 160, resizeMode: "cover" },
  
    // ✅ Smaller grid
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      overflow: "hidden",
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
  
    cardBody: { padding: 10 },
    title: { fontSize: 14, fontWeight: "bold", color: "#fff" },
    username: { color: "#aaa", fontSize: 12, marginTop: 4 },
    likes: { fontSize: 12, color: "#bbb" },
  });
  