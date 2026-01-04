// src/components/movieTabs/WhereToWatchTab.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import useTranslate from "shared/utils/useTranslate";

const LOGO_BASE = "https://image.tmdb.org/t/p/w92";

// Common ISO-3166-1 alpha-2 country names (extend any time)
const COUNTRY_NAMES = {
  SA: "Saudi Arabia", AE: "United Arab Emirates", QA: "Qatar", KW: "Kuwait", BH: "Bahrain", OM: "Oman", JO: "Jordan", LB: "Lebanon", EG: "Egypt",
  MA: "Morocco", DZ: "Algeria", TN: "Tunisia", IQ: "Iraq",
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil", AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru",
  GB: "United Kingdom", IE: "Ireland", FR: "France", DE: "Germany", ES: "Spain", IT: "Italy", PT: "Portugal", NL: "Netherlands", BE: "Belgium",
  SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", CH: "Switzerland", AT: "Austria", PL: "Poland", CZ: "Czechia", HU: "Hungary",
  RO: "Romania", BG: "Bulgaria", GR: "Greece",
  TR: "Türkiye", RU: "Russia", UA: "Ukraine",
  SG: "Singapore", MY: "Malaysia", TH: "Thailand", ID: "Indonesia", PH: "Philippines", VN: "Vietnam",
  JP: "Japan", KR: "South Korea", CN: "China", HK: "Hong Kong", TW: "Taiwan", IN: "India",
  AU: "Australia", NZ: "New Zealand",
  ZA: "South Africa", NG: "Nigeria", KE: "Kenya", GH: "Ghana",
};

const labelRegion = (code) => (code ? `${code}${COUNTRY_NAMES[code] ? ` (${COUNTRY_NAMES[code]})` : ""}` : "");

// Try to detect device region from locale (e.g., "en-SA" -> "SA")
function getDeviceRegion() {
  try {
    const loc =
      (typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().locale) ||
      (typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage)) ||
      "";
    const m = String(loc).match(/[-_](?<region>[A-Z]{2})(?:\b|[_-])/);
    return m?.groups?.region || null;
  } catch {
    return null;
  }
}

// Prefer device region (if in providers), else SA, else first available
function pickInitialRegion(regions) {
  if (!regions || !regions.length) return null;
  const device = getDeviceRegion();
  if (device && regions.includes(device)) return device;
  if (regions.includes("SA")) return "SA";
  return regions[0];
}

export default function WhereToWatchTab({
  providers = {},          // { SA: { flatrate:[], rent:[], buy:[] }, US:{...}, ... }
  selectedRegion,          // string like "SA"
  setSelectedRegion,       // (region) => void
}) {
  const t = useTranslate();
  const [pickerOpen, setPickerOpen] = useState(false);

  const regions = useMemo(() => Object.keys(providers || {}), [providers]);

  // Choose a sensible default once providers are present
  useEffect(() => {
    if (!regions.length) return;
    const isValid = selectedRegion && providers[selectedRegion];
    if (!isValid) {
      const preferred = pickInitialRegion(regions);
      if (preferred) setSelectedRegion?.(preferred);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions.join("|")]);

  if (!regions.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.muted}>{t("No streaming info available.")}</Text>
      </View>
    );
  }

  const regionEntry = providers?.[selectedRegion] || {};
  const merged = [
    ...(regionEntry.flatrate || []),
    ...(regionEntry.rent || []),
    ...(regionEntry.buy || []),
  ];

  // dedupe by provider_id
  const uniqueProviders = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const p of merged) {
      const id = p?.provider_id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(p);
    }
    return out;
  }, [merged]);

  return (
    <View style={styles.wrap}>
      {/* Region selector (single compact control) */}
      <View style={styles.selRow}>
        <Text style={styles.regionLabel}>{t("Region:")}</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setPickerOpen(true)}>
          <Text style={styles.selectorTxt}>{labelRegion(selectedRegion) || t("Choose")}</Text>
          <Text style={styles.chev}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Provider logos */}
      {uniqueProviders.length ? (
        <View style={styles.logoGrid}>
          {uniqueProviders.map((p) => {
            const uri = p?.logo_path ? `${LOGO_BASE}${p.logo_path}` : null;
            return (
              <View key={p?.provider_id} style={styles.logoCell}>
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={styles.logo}
                    resizeMode="cover"
                    accessibilityLabel={p?.provider_name}
                  />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]} />
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.muted}>{t("No providers available for this region.")}</Text>
      )}

      {/* Region picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t("Choose Region")}</Text>
            <ScrollView contentContainerStyle={{ paddingVertical: 6 }}>
              {regions.map((r) => {
                const active = r === selectedRegion;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rowItem, active && styles.rowItemActive]}
                    onPress={() => {
                      setSelectedRegion?.(r);
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.rowTxt, active && styles.rowTxtActive]}>
                      {labelRegion(r)}
                    </Text>
                    {active ? <Text style={styles.tick}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setPickerOpen(false)}>
              <Text style={styles.closeTxt}>{t("Close")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 10, gap: 12 },
  muted: { color: "#888" },

  selRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  regionLabel: { color: "#ccc" },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1f1f1f",
    borderColor: "#444",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectorTxt: { color: "#fff", fontWeight: "700" },
  chev: { color: "#bbb", marginLeft: 2 },

  logoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  logoCell: { width: 56, alignItems: "center" },
  logo: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#111" },
  logoFallback: { borderWidth: 1, borderColor: "#333" },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    marginBottom: 8,
    marginTop: 250,
  },
  sheetTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  rowItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowItemActive: { backgroundColor: "#1e1e1e", borderWidth: 1, borderColor: "#2a2a2a" ,  marginBottom: 8 },
  rowTxt: { color: "#ddd", fontSize: 14 },
  rowTxtActive: { color: "#fff", fontWeight: "700" },
  tick: { color: "#7df", fontWeight: "800" },
  closeBtn: {
    alignSelf: "stretch",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#444",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeTxt: { color: "#fff", fontWeight: "600" },
});
