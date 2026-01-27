import React from "react";
import { View, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function StarRating({ rating = 0, size = 16, compact = false }) {
  if (compact) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <FontAwesome name="star" size={size} color="#B327F6" />
        <Text style={{ color: "#ccc", fontSize: size * 0.85 }}>
          {rating.toFixed(1)} / 10
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row" }}>
      {[...Array(5)].map((_, i) => {
        const isFull = i + 1 <= rating;
        const isHalf = rating >= i + 0.5 && rating < i + 1;

        return (
          <View key={i} style={{ marginHorizontal: 1 }}>
            {isFull ? (
              <FontAwesome name="star" size={size} color="#B327F6" />
            ) : isHalf ? (
              <FontAwesome name="star-half-full" size={size} color="#B327F6" />
            ) : (
              <FontAwesome name="star-o" size={size} color="#777" />
            )}
          </View>
        );
      })}
    </View>
  );
}
