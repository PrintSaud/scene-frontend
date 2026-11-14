// 🚫 Blocked IDs (spam, dupes, irrelevant/adult junk)
export const blockedIds = [
  438478, 21193, 259872, 715287, 716263, 559682, 425652, 1137047, 35712,
  123338, 1305194, 452251, 80601, 288985, 55580, 105904, 64511, 129123,
  64530, 118379, 41060, 19173, 299271, 26648, 158618, 43098, 291860,
  326088, 123587, 332291, 1252309, 116994, 410649, 11620, 499546, 135551,
  805307, 155797, 43328, 58680, 525107, 19029, 310602, 445077, 126058,
  1086548, 263132, 419590, 559563, 367401, 77086, 69470, 180876, 571346,
  256569, 21597, 81522, 40132, 76764, 133521, 69544, 72808, 323260, 324558,
  14484, 28567, 323372, 677640, 28485, 10497, 481, 158693, 323430, 5336,
  192483, 84565, 114587, 617932, 95757, 328662, 102497, 109863, 42446,
  41669, 57084, 11334, 61272, 29653, 769234, 87789, 174077, 583911, 84365,
  105825, 121512, 141804, 442928, 22822, 35718, 27, 40652, 179387, 151586,
  322305, 105789, 346536, 20712, 113776, 49714, 59979, 517929, 829557,
  664413, 365592, 418578, 221913, 21484, 36954, 830884, 247136, 197158,
  46697, 173705, 58008, 340540, 93478, 491386
];

// ✅ Whitelist (must always show even if rules would filter them)
export const whitelistIds = [
  76492,   // Hotel Transylvania (2012)
  109445,  // Hotel Transylvania 2
  159824,  // Hotel Transylvania 3
  330459,  // Hotel Transylvania 4
  705996,  // Decision to Leave (2022)
  // Add more Saudi films, festival winners, etc.
];

// 🚫 Explicit NSFW keywords only
const shouldDebugMovieFilter = () =>
  typeof __DEV__ !== "undefined" && __DEV__;

const bannedWords = [
  "porn",
  "porno",
  "hentai",
  "xxx",
  "fetish",
  "bdsm",
  "shemale",
  "rape",
  "incest",
  "orgy",
  "milf",
  "slut",
  "whore",
  "kamasutra",
  "desire",
  "playboy",
  "sex",
  "nude",
  "nud",
  "nu",
];

// 🚫 Queries blocked
export function isQueryBanned(query) {
  const lower = String(query || "").trim().toLowerCase();
  return bannedWords.some((word) => lower.includes(word));
}

export default function filterMovies(movies) {
  const indianLangs = ["hi", "ta", "te", "ml", "kn", "bn", "pa", "ur"];
  const riskyAsianLangs = ["ja", "zh", "ko"]; // 🔥 many porn entries come from here

  return movies.filter((movie) => {
    const id = Number(movie.id);

    // ✅ Always allow whitelist
    if (whitelistIds.includes(id)) return true;

    // 🚫 Blocked list
    if (blockedIds.includes(id)) {
      if (shouldDebugMovieFilter())
        console.log("⛔ Blocked ID:", movie.title, id);
      return false;
    }

    // 🔑 FIXED: check poster || poster_path
    if (!(movie.poster || movie.poster_path)) {
      if (shouldDebugMovieFilter())
        console.log("⛔ No poster:", movie.title, id);
      return false;
    }

    if (movie.adult) {
      if (shouldDebugMovieFilter())
        console.log("⛔ Adult flagged:", movie.title, id);
      return false;
    }

    const title = (movie.title || movie.original_title || "").toLowerCase();
    const overview = (movie.overview || "").toLowerCase();

    if (
      bannedWords.some(
        (word) => title.includes(word) || overview.includes(word)
      )
    ) {
      if (shouldDebugMovieFilter())
        console.log("⛔ Blocked by banned word:", movie.title, id);
      return false;
    }

    const lang = movie.original_language;
    const isArabic = lang === "ar";
    const isSaudi = movie.origin_country?.includes("SA");
    const isJapanese = lang === "ja";
    const isIndian = indianLangs.includes(lang);
    const isRiskyAsian = riskyAsianLangs.includes(lang);

    const voteCount = Number(movie.vote_count || 0);

    // 🇸🇦 Arabic / Saudi content is protected from vote minimums
    if (isArabic || isSaudi) return true;

    // �� HARD FLOOR:
    // Every non-Arab / non-Saudi movie needs at least 50 votes.
    if (voteCount < 50) {
      if (shouldDebugMovieFilter())
        console.log(
          "⛔ Non-Arab movie under 50 votes:",
          movie.title,
          id,
          voteCount
        );
      return false;
    }

    // 🇯🇵 Japanese movies need at least 100 votes.
    if (isJapanese && voteCount < 100) {
      if (shouldDebugMovieFilter())
        console.log(
          "⛔ Japanese movie under 100 votes:",
          movie.title,
          id,
          voteCount
        );
      return false;
    }

    // 🇮🇳 Keep the existing stricter Indian threshold.
    if (isIndian && voteCount < 2000) {
      if (shouldDebugMovieFilter())
        console.log(
          "⛔ Low-vote Indian:",
          movie.title,
          id,
          voteCount
        );
      return false;
    }

    // 🌏 Keep stricter East Asian filtering.
    // Japanese already passed the 100 floor above,
    // but the existing reputation rule remains intentionally strict.
    if (isRiskyAsian && voteCount < 5000) {
      if (shouldDebugMovieFilter())
        console.log(
          "⛔ Low-vote risky Asian:",
          movie.title,
          id,
          voteCount
        );
      return false;
    }

    // 🌍 Other foreign-language movies remain strict.
    if (!["en", "es"].includes(lang) && voteCount < 2000) {
      if (shouldDebugMovieFilter())
        console.log(
          "⛔ Low-vote foreign:",
          movie.title,
          id,
          voteCount
        );
      return false;
    }

    // ⭐ Reputation score check
    const score = (movie.vote_average || 0) * (movie.vote_count || 0);
    if (score < 300) {
      if (shouldDebugMovieFilter())
        console.log("⛔ Score too low:", movie.title, id, "Score:", score);
      return false;
    }

    return true;
  });
}
