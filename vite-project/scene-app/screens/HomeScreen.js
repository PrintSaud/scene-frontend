import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import useTranslate from "../../../shared/utils/useTranslate";
import api from "../../../shared/api/api";
import MovieHomeScreen from "./MovieHomeScreen";
import TVHomeScreen from "./TVHomeScreen";

const SCENE_PURPLE = "#B327F6";
const { width } = Dimensions.get("window");

function SceneModeTransition({ visible, targetMode }) {
  const t = useTranslate();
  const pulse = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      pulse.stopAnimation();
      slide.stopAnimation();
      glow.stopAnimation();

      pulse.setValue(0);
      slide.setValue(0);
      glow.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 720,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const slideLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(slide, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    slideLoop.start();
    glowLoop.start();

    return () => {
      pulseLoop.stop();
      slideLoop.stop();
      glowLoop.stop();
    };
  }, [visible, pulse, slide, glow]);

  if (!visible) return null;

  const goingTV = targetMode === "tv";

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.42],
  });

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: goingTV ? [-18, 18] : [18, -18],
  });

  return (
    <View style={styles.transitionOverlay}>
      <Animated.View
        style={[
          styles.transitionGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.transitionIconStage,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.transitionIconBubble}>
          <MaterialCommunityIcons
            name={goingTV ? "filmstrip" : "television-classic"}
            size={38}
            color="#777"
          />
        </View>

        <Animated.View
          style={[
            styles.transitionArrowWrap,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={goingTV ? "arrow-right" : "arrow-left"}
            size={26}
            color={SCENE_PURPLE}
          />
        </Animated.View>

        <View style={[styles.transitionIconBubble, styles.transitionIconActive]}>
          <MaterialCommunityIcons
            name={goingTV ? "television-classic" : "filmstrip"}
            size={38}
            color="#fff"
          />
        </View>
      </Animated.View>

      <Text style={styles.transitionTitle}>
        {goingTV ? t("Entering Scene TV") : t("Back to Movies")}
      </Text>

      <Text style={styles.transitionSubtitle}>
        {goingTV
          ? t("Preparing your shows, episodes, and progress...")
          : t("Rolling the film reels back...")}
      </Text>

      <View style={styles.transitionDots}>
        <Animated.View style={[styles.transitionDot, { opacity }]} />
        <Animated.View style={[styles.transitionDot, styles.transitionDotActive]} />
        <Animated.View style={[styles.transitionDot, { opacity }]} />
      </View>
    </View>
  );
}

function SceneInitialLoading() {
  const t = useTranslate();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.initialLoadingBubble,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name="movie-open-play"
          size={42}
          color="#fff"
        />
      </Animated.View>

      <Text style={styles.loadingText}>{t("Loading Scene...")}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const isFocused = useIsFocused();

  const [preferredMode, setPreferredMode] = useState(null);
  const [loadingMode, setLoadingMode] = useState(true);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [transitionTargetMode, setTransitionTargetMode] = useState(null);
  const [modeError, setModeError] = useState("");

  const fetchMode = useCallback(async () => {
    try {
      setModeError("");

      const res = await api.get("/api/tv-mode");

      const nextMode = res.data?.preferredMode === "tv" ? "tv" : "movies";

      setPreferredMode(nextMode);
    } catch (error) {
      console.error(
        "Failed to fetch Scene mode:",
        error?.response?.data || error?.message || error
      );

      setPreferredMode("movies");
      setModeError("Could not load Scene mode. Movies mode was used.");
    } finally {
      setLoadingMode(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    fetchMode();
  }, [fetchMode, isFocused]);

  const handleSwitchMode = async (mode) => {
    if (
      switchingMode ||
      !["movies", "tv"].includes(mode) ||
      preferredMode === mode
    ) {
      return;
    }

    try {
      setTransitionTargetMode(mode);
      setSwitchingMode(true);
      setModeError("");

      const res = await api.patch("/api/tv-mode", { mode });

      const nextMode = res.data?.preferredMode === "tv" ? "tv" : "movies";

      // Tiny delay so the transition feels intentional instead of flashing.
      setTimeout(() => {
        setPreferredMode(nextMode);
        setSwitchingMode(false);
      }, 650);
    } catch (error) {
      console.error(
        "Failed to switch Scene mode:",
        error?.response?.data || error?.message || error
      );

      setModeError("Could not switch Scene mode.");
      setSwitchingMode(false);
      setTransitionTargetMode(null);
    }
  };

  if (loadingMode || !preferredMode) {
    return <SceneInitialLoading />;
  }

  if (preferredMode === "tv") {
    return (
      <View style={styles.root}>
        <TVHomeScreen
          onSwitchMode={handleSwitchMode}
          switchingMode={switchingMode}
        />

        <SceneModeTransition
          visible={switchingMode}
          targetMode={transitionTargetMode}
        />

        {modeError ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{modeError}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MovieHomeScreen
        onSwitchMode={handleSwitchMode}
        switchingMode={switchingMode}
      />

      <SceneModeTransition
        visible={switchingMode}
        targetMode={transitionTargetMode}
      />

      {modeError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{modeError}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  initialLoadingBubble: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: SCENE_PURPLE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: SCENE_PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },

  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "PixelifySans_700Bold",
  },

  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: "rgba(0,0,0,0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  transitionGlow: {
    position: "absolute",
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: width * 0.36,
    backgroundColor: SCENE_PURPLE,
  },

  transitionIconStage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  transitionIconBubble: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },

  transitionIconActive: {
    backgroundColor: SCENE_PURPLE,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: SCENE_PURPLE,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },

  transitionArrowWrap: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  transitionTitle: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    fontFamily: "PixelifySans_700Bold",
  },

  transitionSubtitle: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 290,
  },

  transitionDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },

  transitionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666",
  },

  transitionDotActive: {
    width: 22,
    backgroundColor: SCENE_PURPLE,
  },

  errorWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(120,0,0,0.92)",
    zIndex: 1000,
  },

  errorText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
});
