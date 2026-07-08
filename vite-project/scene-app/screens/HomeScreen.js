import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

import api from "../../../shared/api/api";
import MovieHomeScreen from "./MovieHomeScreen";

const SCENE_PURPLE = "#B327F6";

function TVHomePlaceholder({ onSwitchMode, switchingMode }) {
  return (
    <View style={styles.tvContainer}>
      <Text style={styles.tvTitle}>Scene TV</Text>

      <Text style={styles.tvSubtitle}>
        TV mode is connected. The full TV Home comes next.
      </Text>

      <TouchableOpacity
        style={[
          styles.modeButton,
          switchingMode && styles.modeButtonDisabled,
        ]}
        onPress={() => onSwitchMode("movies")}
        disabled={switchingMode}
      >
        {switchingMode ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.modeButtonText}>
            Switch to Movies
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const isFocused = useIsFocused();

  const [preferredMode, setPreferredMode] = useState(null);
  const [loadingMode, setLoadingMode] = useState(true);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [modeError, setModeError] = useState("");

  const fetchMode = useCallback(async () => {
    try {
      setModeError("");

      const res = await api.get("/api/tv-mode");

      const nextMode =
        res.data?.preferredMode === "tv"
          ? "tv"
          : "movies";

      setPreferredMode(nextMode);
    } catch (error) {
      console.error(
        "Failed to fetch Scene mode:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setPreferredMode("movies");
      setModeError(
        "Could not load Scene mode. Movies mode was used."
      );
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
      setSwitchingMode(true);
      setModeError("");

      const res = await api.patch("/api/tv-mode", {
        mode,
      });

      const nextMode =
        res.data?.preferredMode === "tv"
          ? "tv"
          : "movies";

      setPreferredMode(nextMode);
    } catch (error) {
      console.error(
        "Failed to switch Scene mode:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setModeError("Could not switch Scene mode.");
    } finally {
      setSwitchingMode(false);
    }
  };

  if (loadingMode || !preferredMode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={SCENE_PURPLE}
        />

        <Text style={styles.loadingText}>
          Loading Scene...
        </Text>
      </View>
    );
  }

  if (preferredMode === "tv") {
    return (
      <TVHomePlaceholder
        onSwitchMode={handleSwitchMode}
        switchingMode={switchingMode}
      />
    );
  }

  return (
    <View style={styles.root}>
      <MovieHomeScreen />

      <View style={styles.floatingModeWrap}>
        <TouchableOpacity
          style={[
            styles.modePill,
            switchingMode && styles.modeButtonDisabled,
          ]}
          onPress={() => handleSwitchMode("tv")}
          disabled={switchingMode}
          activeOpacity={0.85}
        >
          {switchingMode ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <Text style={styles.modePillText}>
              TV
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {modeError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>
            {modeError}
          </Text>
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

  loadingText: {
    color: "#aaa",
    marginTop: 12,
    fontSize: 14,
  },

  floatingModeWrap: {
    position: "absolute",
    top: 58,
    right: 16,
    zIndex: 100,
  },

  modePill: {
    minWidth: 52,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: SCENE_PURPLE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  modePillText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  modeButtonDisabled: {
    opacity: 0.6,
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
  },

  errorText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },

  tvContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  tvTitle: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 12,
  },

  tvSubtitle: {
    color: "#aaa",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },

  modeButton: {
    minWidth: 190,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: SCENE_PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  modeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
