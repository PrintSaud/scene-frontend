// shared/utils/filterShows.js

// 🚫 Blocked show IDs
export const blockedShowIds = [];

// ✅ Whitelist
export const whitelistShowIds = [];

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
  "playboy",
  "sex",
];

const indianLangs = [
  "hi",
  "ta",
  "te",
  "ml",
  "kn",
  "bn",
  "pa",
  "ur",
];

const riskyAsianLangs = [
  "ja",
  "zh",
  "ko",
];

const escapeRegExp = (value) =>
  String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

const containsBannedShowWord = (value) => {
  const normalized =
    String(value || "")
      .toLowerCase();

  return bannedWords.some((word) => {
    const escapedWord =
      escapeRegExp(word);

    /*
     * Match explicit terms as complete words.
     *
     * This prevents false positives such as:
     * "scrapes" matching "rape".
     */
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapedWord}([^a-z0-9]|$)`,
      "i"
    );

    return pattern.test(normalized);
  });
};

export function isShowQueryBanned(query) {
  return containsBannedShowWord(query);
}

export default function filterShows(shows) {
  if (!Array.isArray(shows)) {
    return [];
  }

  return shows.filter((show) => {
    const id =
      Number(show?.id);

    const lang =
      String(
        show?.original_language ||
        show?.originalLanguage ||
        ""
      ).toLowerCase();

    if (
      whitelistShowIds.includes(id)
    ) {
      return true;
    }

    if (
      blockedShowIds.includes(id)
    ) {
      return false;
    }

    if (
      !(
        show?.poster ||
        show?.poster_path ||
        show?.posterPath
      )
    ) {
      return false;
    }

    if (show?.adult) {
      return false;
    }

    const title =
      String(
        show?.name ||
        show?.original_name ||
        show?.title ||
        ""
      ).toLowerCase();

    const overview =
      String(
        show?.overview ||
        ""
      ).toLowerCase();

    if (
      containsBannedShowWord(title) ||
      containsBannedShowWord(overview)
    ) {
      return false;
    }

    /*
     * Arabic-language shows must never be removed because
     * of TMDB vote count, popularity, or score thresholds.
     *
     * Saudi and Arabic TV has much lower TMDB engagement
     * than major English-language content, so those global
     * thresholds are not meaningful for this market.
     *
     * Explicit blocks, adult filtering, banned words,
     * and poster requirements above still apply.
     */
    if (lang === "ar") {
      return true;
    }

    const voteCount =
      Number(
        show?.vote_count ||
        show?.voteCount ||
        0
      );

    const voteAverage =
      Number(
        show?.vote_average ||
        show?.voteAverage ||
        0
      );

    const popularity =
      Number(
        show?.popularity ||
        0
      );

    const isIndian =
      indianLangs.includes(lang);

    const isRiskyAsian =
      riskyAsianLangs.includes(lang);

    if (
      isIndian &&
      voteCount < 2000
    ) {
      return false;
    }

    if (
      isRiskyAsian &&
      voteCount < 5000
    ) {
      return false;
    }

    if (
      !["en", "es"].includes(lang) &&
      voteCount < 2000
    ) {
      return false;
    }

    if (
      voteCount < 50 &&
      popularity < 5
    ) {
      return false;
    }

    const score =
      voteAverage *
      voteCount;

    if (score < 300) {
      return false;
    }

    return true;
  });
}
