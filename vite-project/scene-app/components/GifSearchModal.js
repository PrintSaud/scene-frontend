// src/components/GifSearchModal.js
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "shared/api/api";

const GIPHY_API = "https://api.giphy.com/v1/gifs";
const API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY;

const categories = [
  { label: "Recently Used", key: "recent" },
  { label: "Trending", key: "trending" },
  { label: "Sad", key: "sad" },
  { label: "Celebrating", key: "celebration" },
  { label: "Mind Blown", key: "mind blown" },
];

export default function GifSearchModal({ visible, onSelect, onClose }) {
  const [gifs, setGifs] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("user");
      const parsed = stored ? JSON.parse(stored) : null;
      setUserId(parsed?._id || null);
    })();
  }, []);

  useEffect(() => {
    fetchGIFs(activeTab);
  }, [activeTab]);

  const fetchGIFs = async (query) => {
    if (query === "recent" && userId) {
      try {
        const res = await api.get(`/api/users/${userId}/recent-gifs`);
        const gifsArray = res.data?.recentGifs || [];
        setGifs(
          gifsArray.map((url, idx) => ({
            id: String(idx),
            images: {
              original: { url },
              fixed_width: { url },
            },
          }))
        );
      } catch (err) {
        console.error("Failed to fetch recent gifs:", err);
        setGifs([]);
      }
      return;
    }

    const endpoint =
      query === "trending"
        ? `${GIPHY_API}/trending?api_key=${API_KEY}&limit=20`
        : `${GIPHY_API}/search?api_key=${API_KEY}&q=${encodeURIComponent(
            query
          )}&limit=20`;

    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setGifs(json.data);
    } catch (err) {
      console.error("Failed to load GIFs:", err);
      setGifs([]);
    }
  };

  const handleSearch = async (text) => {
    setSearch(text);
    if (text.trim()) {
      const endpoint = `${GIPHY_API}/search?api_key=${API_KEY}&q=${encodeURIComponent(
        text
      )}&limit=20`;
      const res = await fetch(endpoint);
      const json = await res.json();
      setGifs(json.data);
    }
  };

  const handleSelectGif = async (gif) => {
    const gifUrl = gif?.images?.original?.url;
    onSelect(gifUrl);
    onClose();

    if (userId && gifUrl) {
      try {
        await api.post(`/api/users/gif/recent`, { userId, gifUrl });
      } catch (err) {
        console.error("Failed to save recent gif:", err);
      }
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      {/* Overlay */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Stop propagation so taps inside modal don’t close */}
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* 🔍 Search */}
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder="Search GIPHY"
            placeholderTextColor="#888"
            style={styles.input}
          />

          {/* 📂 Tabs */}
          <View style={styles.tabs}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveTab(cat.key)}
              >
                <Text
                  style={[
                    styles.tab,
                    activeTab === cat.key && styles.tabActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 🖼 GIFs */}
          <FlatList
            data={gifs}
            keyExtractor={(item) => item.id || String(item.url)}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gifWrapper}
                onPress={() => handleSelectGif(item)}
              >
                <Image
                  source={{ uri: item.images.fixed_width.url }}
                  style={styles.gif}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />

          {/* Attribution */}
          <View style={{ alignItems: "center", marginTop: 12 }}>
          <Image
  source={require("../../assets/images/PoweredBy_200px-White_HorizLogo.png")}
  style={{ width: 100, height: 30, resizeMode: "contain" }}
/>

          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#111",
    height: "75%",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 16,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  tab: {
    color: "#aaa",
    marginRight: 16,
    fontSize: 13,
  },
  tabActive: {
    color: "#fff",
    fontWeight: "bold",
    borderBottomWidth: 2,
    borderBottomColor: "#B327F6",
    paddingBottom: 2,
  },
  gifWrapper: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  gif: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
});
