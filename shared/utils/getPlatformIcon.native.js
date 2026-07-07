// shared/utils/getPlatformIcon.js
import React from "react";
import { MaterialCommunityIcons, FontAwesome5, FontAwesome } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

// ✅ Official X logo as SVG
function XIcon({ size = 18, color = "#fff" }) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 1200 1227"
      fill={color}
    >
      <Path d="M714.163 519.284L1160.89 0H1052.09L669.327 
        442.106L366.601 0H0L468.687 681.821L0 1226.55H108.797L515.01 
        757.463L833.399 1226.55H1200L714.137 519.284H714.163Z" />
    </Svg>
  );
}

export const getPlatformIcon = (platform) => {
  switch (platform) {
    case "X":
    case "twitter": // legacy naming fallback
      return <XIcon size={14} color="#fff" />; // ✅ official X logo
    case "youtube":
      return <MaterialCommunityIcons name="youtube" size={18} color="red" />;
    case "instagram":
      return <MaterialCommunityIcons name="instagram" size={18} color="#aaa" />;
    case "tiktok":
      return <FontAwesome5 name="tiktok" size={18} color="#aaa" />;
    case "imdb":
      return <FontAwesome name="imdb" size={18} color="gold" />;
    case "tmdb":
      return <MaterialCommunityIcons name="movie" size={18} color="#aaa" />;
    case "website":
      return <MaterialCommunityIcons name="web" size={18} color="#aaa" />;
    default:
      return <MaterialCommunityIcons name="link" size={18} color="#aaa" />;
  }
};
