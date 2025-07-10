
export const blockedIds = [438478, 21193, 259872, 715287, 716263, 559682, 425652, 1137047, 35712, 123338, 1305194, 452251,
    80601, 288985, 55580, 105904, 64511, 129123, 64530, 118379, 41060, 19173, 299271, 26648, 158618, 43098, 291860,
    326088, 123587, 332291, 1252309, 116994, 410649, 11620, 499546,135551, 805307, 155797, 43328, 58680, 525107, 19029, 310602,
    445077, 126058, 1086548, 263132, 419590, 559563, 367401,77086, 69470, 180876, 571346, 256569, 21597, 81522, 40132, 76764,
    133521, 69544, 72808, 323260, 324558, 14484, 28567, 323372, 677640,28485, 10497, 481, 158693, 323430, 5336, 192483, 84565,
    114587, 617932, 95757, 328662, 102497, 109863, 42446, 41669,57084, 11334, 61272, 29653, 769234, 87789, 174077, 583911,
    84365, 105825, 121512, 141804, 442928, 22822,35718,27,  40652, 179387];
    

const bannedWords = ["sex", "porn", "nude", "hot", "xxx", "hentai", "naked", "ass", "boobs", "pussy", "penis", "dick", "Porno", "Erotic", "horny", "Pornography", "Naked", "erotic"];

export function isQueryBanned(query) {
  const lower = query.toLowerCase();
  return bannedWords.some((word) => lower.includes(word));
}

export default function filterMovies(movies) {
  return movies.filter((movie) => {
    const isBlocked = blockedIds.includes(Number(movie.id));  // ✅ FIXED HERE
    const isLowRatedJapanese = movie.original_language === "ja" && movie.vote_count < 2500;
    const indianLangs = ["hi", "ta", "te", "ml", "kn", "bn", "pa", "ur"];
    const isIndian = indianLangs.includes(movie.original_language);
    const otherLangs = ["zh", "fr", "de", "ru", "ko"];
    const isArabic = movie.original_language === "ar";
    const isForeignLowRated = !isArabic && otherLangs.includes(movie.original_language) && movie.vote_count < 5000;

    return (
      movie.vote_count > 10 &&
      movie.poster_path &&
      !movie.adult &&
      !isBlocked &&
      !isLowRatedJapanese &&
      !isIndian &&
      !isForeignLowRated
    );
  });
}
