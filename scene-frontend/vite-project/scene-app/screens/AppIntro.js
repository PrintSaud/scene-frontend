// src/screens/AppIntro.js
import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// ❌ REMOVE any SplashScreen.preventAutoHideAsync() here

export default function AppIntro() {
  const navigation = useNavigation();
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    textOpacity.value = withTiming(1, { duration: 500, delay: 350, easing: Easing.out(Easing.cubic) });

    // Navigate out after ~1.2s if you want
    const t = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0b0b0f", "#14121a"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <Image
            source={require("../assets/default-avatarccc.png")} // replace with your logo asset
            resizeMode="contain"
            style={{ width: width * 0.35, height: width * 0.35 }}
          />
        </Animated.View>

        <Animated.View style={[{ marginTop: 18 }, titleStyle]}>
          <Text style={styles.title}>Scene</Text>
          <Text style={styles.tagline}>The cinematic way to connect</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: 0.5, textAlign: "center" },
  tagline: { color: "#c9c4d4", fontSize: 14, marginTop: 6, textAlign: "center" },
});
