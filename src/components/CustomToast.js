// src/components/CustomToast.js
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import StarRating from "./StarRating";

export const toastConfig = {
  // 🔔 Default Scene toast
  scene: ({ text1, text2, props }) => (
    <View style={styles.container}>
      <View style={styles.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{text1}</Text>
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}

        {/* 🔗 If a preview object was passed, show it */}
        {props?.preview && (
          <View style={styles.previewRow}>
            <Image
              source={{ uri: props.preview.backdrop }}
              style={styles.previewImage}
            />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.previewTitle}>{props.preview.title}</Text>
              <View style={styles.previewMeta}>
                <Text style={styles.previewUsername}>
                  {props.preview.username}
                </Text>
                <StarRating rating={props.preview.rating} size={12} />
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20,20,20,0.9)", // glassy black
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 12,
    minHeight: 60,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  accent: {
    width: 5,
    height: "100%",
    backgroundColor: "#B327F6", // Scene purple
    borderRadius: 3,
    marginRight: 12,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    color: "#ccc",
    fontSize: 12,
    marginTop: 2,
  },
  // --- Preview bits ---
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  previewImage: {
    width: 60,
    height: 34,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "#222",
  },
  previewTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 6,
  },
  previewUsername: {
    color: "#aaa",
    fontSize: 12,
  },
});
