// src/screens/review/MoreReviewsList.js
import React, { useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import StarRating from "../../components/StarRating";
import useTranslate from "shared/utils/useTranslate";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

function Poster({ uri }) {
  const [src, setSrc] = useState(uri || FALLBACK_POSTER);
  return (
    <Image
      source={{ uri: src || FALLBACK_POSTER }}
      style={styles.poster}
      onError={() => setSrc(FALLBACK_POSTER)}
    />
  );
}

/** Remove __media__ token entirely; if nothing remains, treat as empty */
const stripMediaToken = (text = "") => text.replace(/__media__/gi, "").trim();

export default function MoreReviewsList({ reviews = [], onClick }) {
  const t = useTranslate();

  const filteredReviews = useMemo(() => {
    const onlyTextual = (reviews || [])
      .filter((r) => {
        const clean = stripMediaToken(r?.review || "");
        return clean.length > 0; // never show media-only entries
      })
      .slice(0, 3); // show up to 3
    return onlyTextual;
  }, [reviews]);

  // --- English fallback date helpers ---
  const MONTHS_EN = useMemo(
    () => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    []
  );
  const englishOrdinal = (n) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}`;
    switch (n % 10) {
      case 1: return `${n}`;
      case 2: return `${n}`;
      case 3: return `${n}`;
      default: return `${n}`;
    }
  };
  const formatRelative = (iso) => {
    if (!iso) return "";
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = now - then;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return t("Just now");
    if (diff < hour) return t("{{n}}m ago", { n: Math.floor(diff / minute) });
    if (diff < day) return t("{{n}}h ago", { n: Math.floor(diff / hour) });
    if (diff <= 7 * day) return t("{{n}}d ago", { n: Math.floor(diff / day) });

    const d = new Date(iso);
    const dayNum = d.getDate();
    const monthName = MONTHS_EN[d.getMonth()];
    return `${englishOrdinal(dayNum)} ${monthName}`;
  };

  /** Render preview with purple “Read more.” if truncated */
  const renderPreview = (raw, wordLimit = 30) => {
    const text = stripMediaToken(raw);
    if (!text) return null;

    const words = text.split(/\s+/);
    if (words.length <= wordLimit) {
      return <Text style={styles.preview}>{text}</Text>;
    }

    const head = words.slice(0, wordLimit).join(" ");
    return (
      <Text style={styles.preview}>
        {head}
        {"… "}
        <Text style={styles.readMore}>{t("Read more.")}</Text>
      </Text>
    );
  };

  if (!filteredReviews.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("More reviews")}</Text>

      {filteredReviews.map((r) => {
        const timeIso = r.watchedAt || r.createdAt;
        const posterSrc =
          r.posterOverride && r.posterOverride.startsWith("http")
            ? r.posterOverride
            : FALLBACK_POSTER;

        return (
          <TouchableOpacity
            key={r._id}
            style={styles.card}
            onPress={() => onClick?.(r._id)}
          >
            <Text style={styles.timestamp}>{formatRelative(timeIso)}</Text>

            <Poster uri={posterSrc} />

            <View style={styles.content}>
              <StarRating rating={r.rating} size={12} />
              {renderPreview(r.review)}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 16, color: "#fff", marginBottom: 8 },
  card: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 6,
    marginBottom: 12,
  },
  timestamp: {
    position: "absolute",
    top: 6,
    right: 8,
    fontSize: 10,
    color: "#888",
  },
  poster: {
    width: 70,
    height: 100,
    borderRadius: 6,
    marginRight: 8,
  },
  content: { flex: 1 },
  preview: { fontSize: 12, color: "#ccc", marginTop: 4, lineHeight: 18 },
  readMore: { color: "#B327F6", fontWeight: "600" }, // purple “Read more.”
});
