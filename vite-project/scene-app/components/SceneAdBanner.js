// src/components/SceneAdBanner.js
import React from "react";
import { Platform } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

const IOS_BANNER_ID = "ca-app-pub-1279194555922916/4804628050";
const ANDROID_BANNER_ID = "ca-app-pub-1279194555922916/xxxxxxxxxx"; // replace later

export default function SceneAdBanner({ size }) {
  // ✅ Default to 320x50 if not passed
  const finalSize = size || BannerAdSize.BANNER;

  const adUnitId = __DEV__
    ? TestIds.BANNER
    : Platform.OS === "ios"
    ? IOS_BANNER_ID
    : ANDROID_BANNER_ID;

  return (
    <BannerAd
      unitId={adUnitId}
      size={finalSize}
      requestOptions={{
        requestNonPersonalizedAdsOnly: false,
      }}
      onAdLoaded={() => console.log("✅ Banner loaded")}
      onAdFailedToLoad={(err) => console.log("❌ Banner failed:", err)}
    />
  );
}
