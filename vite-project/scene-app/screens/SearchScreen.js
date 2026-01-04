// src/screens/SearchScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "shared/context/LanguageContext";
import useTranslate from "shared/utils/useTranslate";
import StarRating from "../components/StarRating";
import filterMovies, { isQueryBanned, whitelistIds } from "shared/utils/filterMovies";
import UsersTab from "./searchtabs/SearchTabUsers";
import ListsTab from "./searchtabs/SearchTabLists";
import ActorsTab from "./searchtabs/SearchTabActors";
import RecentTab from "./searchtabs/SearchTabRecents";



const TMDB_IMG = "https://image.tmdb.org/t/p";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const screenWidth = Dimensions.get("window").width;
const HEADER_H = 90; // space for input + tabs after your new margins

// --- Tiny helpers
const getYear = (dateStr) => (dateStr && dateStr.slice(0, 4)) || "N/A";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function SearchScreen() {
  const navigation = useNavigation();
  const t = useTranslate();
  const { language } = useLanguage();
  const reqSeq = useRef(0); // monotonically increasing request id
  

  // state
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("films"); // films | users | lists | actors | directors
  const [results, setResults] = useState([]);
  const [posterOverrides, setPosterOverrides] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  // tabs
  const tabs = ["films", "users", "lists", "actors", "directors"];
  const tabLabels = {
    films: t("Movies"),
    users: t("Users"),
    lists: t("Lists"),
    actors: t("Actors"),
    directors: t("Directors"),
  };

  const activeTabRef = useRef(activeTab);
useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

const queryRef = useRef(query);
useEffect(() => { queryRef.current = query; }, [query]);

  // load persisted state
  useEffect(() => {
    (async () => {
      try {
        const savedQuery = await AsyncStorage.getItem("sceneSearchQuery");
        const savedTab = await AsyncStorage.getItem("sceneSearchTab");
        if (savedQuery) setQuery(savedQuery);
        if (savedTab) setActiveTab(savedTab);

        const stored = JSON.parse((await AsyncStorage.getItem("sceneRecentSearches")) || "[]");
        setRecentSearches(Array.isArray(stored) ? stored : []);
      } catch {}
    })();
  }, []);

  // persist state
  useEffect(() => {
    AsyncStorage.setItem("sceneSearchQuery", query || "");
    AsyncStorage.setItem("sceneSearchTab", activeTab || "films");
  }, [query, activeTab]);

  // debounce search
  useEffect(() => {
    let cancelled = false;
    const h = setTimeout(async () => {
      if (!query) {
        setResults([]);
        return;
      }
      if (cancelled) return;
      await handleSearch(query);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(h);
    };
  }, [query, activeTab]);

  const saveToRecentSearches = async (q, tab) => {
    const updated = [
      { query: q, tab },
      ...recentSearches.filter((i) => i.query !== q || i.tab !== tab),
    ].slice(0, 10);
    await AsyncStorage.setItem("sceneRecentSearches", JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const handleResultClick = async (q, tab) => {
    await saveToRecentSearches(q, tab);
    setQuery(q);
    setActiveTab(tab);
    // ensure state is set before searching
    await sleep(50);
    await handleSearch(q, tab);
  };

  async function handleSearch(q, tabOverride) {
    const qTab = tabOverride || activeTab;
    if (!q) return;
    if (isQueryBanned(q)) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

          // strict fallback if no results or missing obvious movies

      // FILMS
      if (qTab === "films") {
        const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
        const [res1, res2] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
              q
            )}&api_key=${apiKey}&page=1`
          ),
          fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
              q
            )}&api_key=${apiKey}&page=2`
          ),
        ]);
        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
        let allResults = [...(data1.results || []), ...(data2.results || [])];

        // filter + whitelist backfill
        let filtered = filterMovies(allResults);
        const normalizedQuery = q.toLowerCase();
        const missingWhitelisted = whitelistIds.filter(
          (id) => !filtered.some((m) => Number(m.id) === id)
        );

        for (const id of missingWhitelisted) {
          try {
            const res = await fetch(
              `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`
            );
            if (res.ok) {
              const movieData = await res.json();
              const titleMatch =
                movieData.title?.toLowerCase().includes(normalizedQuery) ||
                movieData.original_title?.toLowerCase().includes(normalizedQuery);
              if (titleMatch) filtered.push(movieData);
            }
          } catch {}
        }

        // strict fallback if no results or missing obvious movies
if (!filtered.some((m) => m.title?.toLowerCase() === q.toLowerCase())) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
        q
      )}&api_key=${apiKey}&include_adult=false`
    );
    const { results: extra } = await res.json();
    if (extra?.length) {
      const exact = extra.find(
        (m) =>
          m.title?.toLowerCase() === q.toLowerCase() ||
          m.original_title?.toLowerCase() === q.toLowerCase()
      );
      if (exact) filtered.push(exact);
    }
  } catch {}
}


        setResults(filtered);

        // poster overrides
        const userStr = await AsyncStorage.getItem("user");
        const userId = userStr ? JSON.parse(userStr)?._id : null;
        if (userId) {
          const overrides = {};
          await Promise.all(
            filtered.map(async (movie) => {
              try {
                const res = await fetch(
                  `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/posters/${movie.id}?userId=${userId}`
                );
                const data = await res.json();
                if (data?.posterOverride) overrides[movie.id] = data.posterOverride;
              } catch {}
            })
          );
          setPosterOverrides(overrides);
        } else {
          setPosterOverrides({});
        }
      }

      // USERS
      else if (qTab === "users") {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/search?query=${encodeURIComponent(q)}`
        );
        const users = await res.json();
        setResults(Array.isArray(users) ? users : []);
      }

// LISTS (auth optional)
else if (qTab === "lists") {
  try {
    const raw = await AsyncStorage.getItem("user");
    const token = raw ? JSON.parse(raw)?.token : null;

    const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/lists/search?query=${encodeURIComponent(q)}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(url, { headers });
    const data = await res.json();

    setResults(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("❌ Lists search failed:", err);
    setResults([]);
  }
}


      // ACTORS / DIRECTORS
      else if (qTab === "actors" || qTab === "directors") {
        const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
        const res = await fetch(
          `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(
            q
          )}&api_key=${apiKey}`
        );
        const data = await res.json();
        const filtered = (data.results || []).filter((p) =>
          qTab === "actors"
            ? p.known_for_department === "Acting"
            : p.known_for_department === "Directing"
        );
        setResults(filtered);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // --- UI bits
  const renderTabs = () => (
    <View style={styles.tabsRow}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[
            styles.tabBtn,
            activeTab === tab && styles.tabBtnActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive,
            ]}
          >
            {tabLabels[tab]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Films grid (2 per row)
  const isTablet = screenWidth >= 768;
const FILM_COLS = isTablet ? 5 : 2;
  const FILM_GAP = 12;
  const FILM_SIDE = 16;
  const ITEM_W = Math.floor((screenWidth - FILM_SIDE * 2 - FILM_GAP * (FILM_COLS - 1)) / FILM_COLS);

  const renderFilms = () => (
    <FlatList
      data={results}
      keyExtractor={(m) => String(m.id)}
      numColumns={FILM_COLS}
      contentContainerStyle={{ paddingHorizontal: FILM_SIDE }}
      columnWrapperStyle={{ gap: FILM_GAP }}
      renderItem={({ item }) => {
        const poster =
          posterOverrides[item.id] ||
          (item.poster_path ? `${TMDB_IMG}/w300${item.poster_path}` : FALLBACK_POSTER);
        return (
          <TouchableOpacity
            onPress={async () => {
              await saveToRecentSearches(item.title, "films");
              navigation.navigate("Movie", { id: item.id });
            }}
            style={{ width: ITEM_W, marginBottom: FILM_GAP }}
          >
            <Image
              source={{ uri: poster }}
              style={{ width: ITEM_W, height: Math.round(ITEM_W * 1.5), borderRadius: 8, backgroundColor: "#222" }}
            />
            <View style={{ paddingTop: 8 }}>
              <Text numberOfLines={1} style={styles.movieTitle}>{item.title}</Text>
              <Text style={styles.subtle}>{getYear(item.release_date)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <StarRating rating={item.vote_average || 0} size={14} compact />
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderUsers = () => (
    <FlatList
      data={results}
      keyExtractor={(u) => u._id || u.id || u.username}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      renderItem={({ item }) => {
        const avatar =
          item?.avatar?.startsWith?.("http")
            ? item.avatar
            : item?.avatar
            ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${item.avatar}`
            : FALLBACK_AVATAR;
        return (
          <TouchableOpacity
            onPress={async () => {
              await saveToRecentSearches(item.username || item.name || "user", "users");
              // You can navigate to a Profile screen if wired:
              // navigation.navigate("Profile", { id: item._id });
            }}
            style={styles.userRowItem}
          >
            <Image source={{ uri: avatar }} style={styles.userAvatar} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.userName}>{item.username || item.name}</Text>
              <Text style={styles.subtle}>@{item.username || "user"}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderLists = () => (
    <FlatList
      data={results}
      keyExtractor={(l, i) => l._id || l.id || String(i)}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={async () => {
            await saveToRecentSearches(item.name || "list", "lists");
            // navigation.navigate("List", { id: item._id });
          }}
          style={styles.listCard}
        >
          <Text numberOfLines={1} style={styles.listTitle}>{item.name || "Untitled List"}</Text>
          <Text style={styles.subtle}>
            {Array.isArray(item.items) ? item.items.length : (item.count || 0)} {t("items")}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderPeople = () => (
    <FlatList
      data={results}
      keyExtractor={(p) => String(p.id)}
      numColumns={2}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingTop: 4 }}
      renderItem={({ item }) => {
        const pic = item.profile_path ? `${TMDB_IMG}/w300${item.profile_path}` : FALLBACK_AVATAR;
        return (
          <View style={{ width: ITEM_W, marginBottom: 12, alignItems: "center" }}>
            <Image source={{ uri: pic }} style={{ width: ITEM_W, height: Math.round(ITEM_W * 1.2), borderRadius: 8 }} />
            <Text numberOfLines={1} style={styles.movieTitle}>{item.name}</Text>
            <Text style={styles.subtle}>{item.known_for_department || ""}</Text>
          </View>
        );
      }}
    />
  );

  const renderRecent = () => (
    <View style={{ paddingHorizontal: 16 }}>
      <Text style={[styles.subtle, { marginBottom: 10 }]}>{t("Recent searches")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {recentSearches.map(({ query: q, tab }, i) => (
          <TouchableOpacity
            key={`${q}-${tab}-${i}`}
            onPress={() => handleResultClick(q, tab)}
            style={styles.recentChip}
          >
            <Text style={styles.recentChipText}>{q}</Text>
            <Text style={[styles.recentChipText, { opacity: 0.6 }]}> · {tabLabels[tab]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const ResultsBlock = useMemo(() => {
    if (!query) return renderRecent();
    if (loading) {
      return (
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      );
    }
    if (activeTab === "films") return renderFilms();
    if (activeTab === "users") {
      return (
        <UsersTab
          results={results}
          saveToRecentSearches={saveToRecentSearches}
          // onPressUser={(u) => navigation.navigate("Profile", { id: u._id })} // optional override
        />
      );
    }
    if (activeTab === "lists") {
      return (
        <ListsTab
          results={results}                         // from handleSearch
          t={t}
          saveToRecentSearches={saveToRecentSearches}
          onPressList={(list) => {
            // navigate if you have a List screen; otherwise keep it for later
            // navigation.navigate("List", { id: list._id });
          }}
        />
      );
    }
    
    if (activeTab === "actors") {
      return (
        <ActorsTab
          results={results.filter((p) => p.profile_path)} // remove no-photo actors
          saveToRecentSearches={saveToRecentSearches}
          onPressActor={(actor) => navigation.navigate("Actor", { id: actor.id })}
        />
      );
    }
    return null;
  }, [query, activeTab, results, posterOverrides, loading, recentSearches, language]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0e0e0e" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* spacer so content starts below the glass header */}
        <View style={{ height: HEADER_H }} />
  
        {/* 🧠 Dynamic Results */}
        <View style={{ flex: 1 }}>{ResultsBlock}</View>
  
        {/* 🔍 Glassy sticky header */}
        <View style={styles.glassHeader}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("Search")}
            placeholderTextColor="#555"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
  
          {/* 📂 Tabs */}
          {renderTabs()}
        </View>
      </View>
    </KeyboardAvoidingView>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 8, // room for bottom nav
    paddingTop: HEADER_H,     // 👈 pushes results below the glass header
    paddingBottom: 30, 
  },

  // glassy header (matches Home nav vibe)
  glassHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "rgba(12,12,12,0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    zIndex: 100,    // iOS
    elevation: 8,   // Android
  },

  // keep your existing input, tweak spacing
  searchInput: {
    alignSelf: "center",
    width: "94%",
    height: 42,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#f0f0f0",
    color: "#000",
    marginBottom: 16, // was 14
    marginTop: 55,       // 👈 pushes the whole input down
    marginBottom: 14,
  },

  // tabs tighten up a bit
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 2, // was 16
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  tabBtnActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    color: "#aaa",
    fontWeight: "600",
    fontSize: 12,

    
  },
  tabTextActive: {
    color: "#000",
  },

  movieTitle: {
    color: "#fff",
    fontWeight: "600", 
    fontFamily: "PixelifySans_700Bold",
    
  },
  subtle: {
    color: "#aaa",
    fontSize: 12,
    fontFamily: "PixelifySans_700Bold",
  },

  userRowItem: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  userName: { color: "#fff", fontWeight: "600", marginBottom: 2 },

  listCard: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 12,
  },
  listTitle: { color: "#fff", fontWeight: "700", marginBottom: 4 ,     fontFamily: "PixelifySans_700Bold", },

  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 999,
  },
  recentChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "PixelifySans_700Bold",
  },
});
