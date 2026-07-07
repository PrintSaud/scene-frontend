// shared/utils/getPlatformIcon.js
import React from "react";

// ✅ Web icons
import { FaTwitter, FaYoutube, FaInstagram, FaTiktok, FaImdb } from "react-icons/fa";
import { SiThemoviedatabase, SiX } from "react-icons/si";
import { FiGlobe } from "react-icons/fi";

// ✅ RN icons (Expo)
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const getPlatformIcon = (platform, size = 24, color = "white") => {
  const isWeb = typeof window !== "undefined";

  if (isWeb) {
    switch (platform.toLowerCase()) {
      case "x":
        return <SiX />;
      case "youtube":
        return <FaYoutube />;
      case "instagram":
        return <FaInstagram />;
      case "tiktok":
        return <FaTiktok />;
      case "imdb":
        return <FaImdb />;
      case "tmdb":
        return <SiThemoviedatabase />;
      case "website":
        return <FiGlobe />;
      default:
        return <FiGlobe />;
    }
  } else {
    // React Native (Expo)
    switch (platform.toLowerCase()) {
      case "x":
        return <FontAwesome5 name="twitter" size={size} color={color} />;
      case "youtube":
        return <FontAwesome5 name="youtube" size={size} color={color} />;
      case "instagram":
        return <FontAwesome5 name="instagram" size={size} color={color} />;
      case "tiktok":
        return <MaterialCommunityIcons name="tiktok" size={size} color={color} />;
      case "imdb":
        return <FontAwesome5 name="imdb" size={size} color={color} />;
      case "tmdb":
        return <FontAwesome5 name="film" size={size} color={color} />;
      case "website":
        return <FontAwesome5 name="globe" size={size} color={color} />;
      default:
        return <FontAwesome5 name="globe" size={size} color={color} />;
    }
  }
};
