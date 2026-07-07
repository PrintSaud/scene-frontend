import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const navItems = [
  {
    route: "Home",
    label: "Home",
    iconFamily: "Ionicons",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  {
    route: "Search",
    label: "Search",
    iconFamily: "Ionicons",
    activeIcon: "search",
    inactiveIcon: "search-outline",
  },
  {
    route: "SceneBot",
    label: "SceneBot",
    iconFamily: "MaterialCommunityIcons",
    activeIcon: "robot",
    inactiveIcon: "robot-outline",
  },
  {
    route: "Notifications",
    label: "Notifications",
    iconFamily: "Ionicons",
    activeIcon: "notifications",
    inactiveIcon: "notifications-outline",
  },
  {
    route: "Profile",
    label: "Profile",
    iconFamily: "Ionicons",
    activeIcon: "person",
    inactiveIcon: "person-outline",
  },
];

const MAIN_TAB_ROUTES = navItems.map((item) => item.route);

// ✅ Add any screen where navbar should NEVER show
const HIDDEN_ROUTES = [
  "Review",
  "ReviewScreen",
  "ReviewPage",
  "ShareReview",
  "ShareReviewPage",
  "LogScreen",
  "Movie",
  "MovieScreen",
  "Actor",
  "ActorScreen",
  "Director",
  "DirectorScreen",
  "Cinematographer",
  "CinematographerScreen",
  "MovieReviews",
  "MovieFriends",
  "Replies",
  "RepliesPage",
  "EditProfile",
  "EditProfileScreen",
  "CreateList",
  "CreateListPage",
  "EditList",
  "EditListPage",
  "ListView",
  "ListViewPage",
];

// ✅ Finds the deepest active screen, not just the main tab
function getFocusedRouteName(navState) {
  if (!navState?.routes?.length) return null;

  let route = navState.routes[navState.index || 0];

  while (route?.state?.routes?.length) {
    route = route.state.routes[route.state.index || 0];
  }

  return route?.name || null;
}

function NavIcon({ item, isActive }) {
  const color = isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)";

  if (item.iconFamily === "MaterialCommunityIcons") {
    return (
      <MaterialCommunityIcons
        name={isActive ? item.activeIcon : item.inactiveIcon}
        size={25}
        color={color}
      />
    );
  }

  return (
    <Ionicons
      name={isActive ? item.activeIcon : item.inactiveIcon}
      size={23}
      color={color}
    />
  );
}

export default function BottomNav({ state, navigation }) {
  const currentTabRoute = state?.routes?.[state.index]?.name || "Home";
  const focusedRoute = getFocusedRouteName(state) || currentTabRoute;

  // ✅ Hide on review/movie/detail pages
  if (HIDDEN_ROUTES.includes(focusedRoute)) {
    return null;
  }

  // ✅ Only show on the main 5 tabs
  if (!MAIN_TAB_ROUTES.includes(focusedRoute) && !MAIN_TAB_ROUTES.includes(currentTabRoute)) {
    return null;
  }

  const handleNavigate = (target) => {
    try {
      if (currentTabRoute === target) return;
      navigation.navigate(target);
    } catch (err) {
      console.log("BottomNav navigation error:", err?.message || err);
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.container}>
        {navItems.map((item) => {
          const isActive = currentTabRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.75}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <NavIcon item={item} isActive={isActive} />
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const BAR_HEIGHT = 64;
const BOTTOM_PADDING = Platform.OS === "ios" ? 28 : 18;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: BOTTOM_PADDING,
  },

  container: {
    width: "100%",
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,

    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.18)",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,

    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 20,

    overflow: "hidden",
  },

  button: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  activeDot: {
    position: "absolute",
    bottom: 10,
    width: 18,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#a855f7",
    shadowColor: "#a855f7",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});

