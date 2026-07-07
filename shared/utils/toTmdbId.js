// replace your toTmdbId with this (note: no _id)
const toTmdbId = (x) => {
    if (x == null) return null;
    if (typeof x === "number" && Number.isFinite(x)) return x;
    if (typeof x === "string" && /^\d+$/.test(x)) return Number(x);
  
    if (typeof x === "object") {
      const cand =
        x.tmdbId ??
        x.id ??
        x.movieId ??
        x.movie?.tmdbId ??
        x.movie?.id;
      const n = Number(cand);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  