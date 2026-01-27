import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNotification } from "shared/context/NotificationContext";

const navItems = [
  { route: "Home", icon: "home-outline", type: "ion" },
  { route: "Search", icon: "search-outline", type: "ion" },
  { route: "SceneBot", icon: "robot-outline", type: "mci" },
  { route: "Notifications", icon: "notifications-outline", type: "ion" },
  { route: "Profile", icon: "person-outline", type: "ion" },
];

export default function BottomNav({ state, navigation }) {
  const { unreadCount } = useNotification();
  const currentRouteName = state?.routes?.[state.index]?.name;
  const showDot = unreadCount > 0 && currentRouteName !== "Notifications";

  const handleNavigate = (target) => {
    if (navigation.navigate) {
      // Always go via MainTabs if we’re outside
      navigation.navigate("MainTabs", { screen: target });
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {navItems.map(({ route: target, icon, type }, index) => {
          const isActive = currentRouteName === target;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleNavigate(target)}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel={target}
            >
              <View style={{ position: "relative" }}>
                {type === "mci" ? (
                  <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={isActive ? "#fff" : "#888"}
                  />
                ) : (
                  <Ionicons
                    name={icon}
                    size={24}
                    color={isActive ? "#fff" : "#888"}
                  />
                )}
                {target === "Notifications" && showDot && (
                  <View style={styles.dot} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12,12,12,0.6)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
  },
  button: { flex: 1, alignItems: "center", justifyContent: "center" },
  dot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    backgroundColor: "#a855f7",
    borderRadius: 6,
    shadowColor: "#a855f7",
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
  },
});
