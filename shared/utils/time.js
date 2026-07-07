// utils/time.js

// English month abbreviations (never localized)
const MONTHS_EN = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  
  /**
   * Parse various input shapes into a valid Date, or null.
   * Accepts:
   *   - Date
   *   - ISO string
   *   - Epoch ms
   *   - Epoch seconds
   */
  const toDate = (input) => {
    if (!input && input !== 0) return null;
  
    if (input instanceof Date && !isNaN(input)) return input;
  
    if (typeof input === "number") {
      // Heuristic: treat < 1e12 as seconds, otherwise ms
      const ms = input < 1e12 ? input * 1000 : input;
      const d = new Date(ms);
      return isNaN(d) ? null : d;
    }
  
    if (typeof input === "string") {
      const d = new Date(input);
      return isNaN(d) ? null : d;
    }
  
    return null;
  };
  
  /**
   * Scene timestamp format (never localized).
   *
   * Rules:
   * - < 1m   → "Just now"
   * - < 60m  → "Xm ago"
   * - < 24h  → "Xh ago"
   * - ≤ 7d   → "Xd ago"
   * - < 1y   → "Mon D"   (UTC)
   * - ≥ 1y   → "YYYY"    (UTC)
   */
  export const formatTimestamp = (input) => {
    const date = toDate(input);
    if (!date) return "";
  
    const now = Date.now();
    const diffMs = Math.max(0, now - date.getTime()); // clamp future → 0
  
    const min  = Math.floor(diffMs / 60000);
    const hr   = Math.floor(diffMs / 3600000);
    const day  = Math.floor(diffMs / 86400000);
    const year = Math.floor(day / 365);
  
    if (min < 1)  return "Just now";
    if (min < 60) return `${min}m ago`;
    if (hr  < 24) return `${hr}h ago`;
    if (day <= 7) return `${day}d ago`;
  
    // Absolute (UTC) after 7 days
    if (year >= 1) {
      return String(date.getUTCFullYear());
    } else {
      const m = MONTHS_EN[date.getUTCMonth()];
      const dd = date.getUTCDate(); // no leading zero
      return `${m} ${dd}`;
    }
  };
  
  // Optional named exports (if you ever need them elsewhere)
  export const _SCENE_MONTHS = MONTHS_EN;
  export const _toDate = toDate;
  