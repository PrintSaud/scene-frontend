// SCENE_PROFILE_FILMS_TARGETED_FIX_20261028
import React, {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import useTranslate from "../../utils/useTranslate";
import "../../styles/scene-profile-batch2.css";

const movieId = v => Number(v?.tmdbId ?? v?.movie?.tmdbId ?? v?.movie?.id ?? v?.movieId ?? v?.id) || null;
const watchedAt = v => new Date(v?.watchedAt || v?.createdAt || 0).getTime() || 0;
const movieTitle = v => v?.title || v?.movie?.title || "Movie";
const hasReview = v => {
  const text = String(v?.review?.text ?? v?.review ?? "").trim();
  return Boolean((text && !["__media__", "[GIF ONLY]", "[IMAGE ONLY]"].includes(text)) || v?.gif || v?.image);
};
const validPoster = value => {
  if (typeof value !== "string" || !value.trim()) return null;
  const x = value.trim();
  if (/^https?:\/\//i.test(x)) return x;
  if (/^\/\//.test(x)) return `https:${x}`;
  if (x.startsWith("/")) return `https://image.tmdb.org/t/p/w500${x}`;
  return null;
};
const fallbackPosters = (log, customPosters, id) => {
  const possible = [
    customPosters?.[id],
    log?.posterOverride,
    log?.poster,
    log?.movie?.posterOverride,
    log?.movie?.poster,
    log?.movie?.poster_path,
    log?.movie?.posterPath,
    log?.poster_path,
    "/default-poster.jpg"
  ];
  const results = possible.map((p, i) => i === possible.length-1 ? p : validPoster(p)).filter(Boolean);
  return [...new Set(results)];
};
function FilmPoster({log, customPosters, id}) {
  const sources = useMemo(() => fallbackPosters(log, customPosters, id), [log, customPosters, id]);
  const [index, setIndex] = useState(0);
  return <img key={`${id}-${sources[0]}`} loading="lazy" alt={movieTitle(log)}
    src={sources[Math.min(index, sources.length-1)]}
    onError={() => setIndex(n => Math.min(n + 1, sources.length-1))} />;
}
export default function ProfileTabFilms({logs=[], favorites=[], customPosters={}}) {
  const t=useTranslate();
  const navigate=useNavigate();
  const [sort,setSort]=useState("added");
  const [direction,setDirection]=useState("desc");
  const [query,setQuery]=useState("");
  const favs=new Set((Array.isArray(favorites)?favorites:[]).map(x=>Number(x?.tmdbId??x?.id??x)).filter(Boolean));
  const films=useMemo(()=>{
    // Latest watched log per film, regardless of the API response order.
    const mostRecent=new Map();
    for (const log of Array.isArray(logs)?logs:[]) {
      const id=movieId(log);
      if (!id) continue;
      const existing=mostRecent.get(id);
      if (!existing || watchedAt(log)>watchedAt(existing)) mostRecent.set(id,log);
    }
    let arr=[...mostRecent.values()];
    if (sort==="favorites") arr=arr.filter(log=>favs.has(movieId(log)));
    const term=query.trim().toLowerCase();
    if (term) arr=arr.filter(log=>movieTitle(log).toLowerCase().includes(term));
    const sign=direction==="asc"?1:-1;
    return arr.sort((a,b)=>{
      const value=x=>sort==="rating"?Number(x?.rating??0):watchedAt(x);
      return (value(a)-value(b))*sign;
    });
  },[logs,sort,direction,query,favorites]);
  return <section className="scene-b2">
    <div className="scene-b2-toolbar">
      <input aria-label="Search films" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search films...")}/>
      <select aria-label="Sort films" value={sort} onChange={e=>setSort(e.target.value)}>
        <option value="added">{t("Recently Watched")}</option>
        <option value="rating">{t("Rating")}</option>
        <option value="favorites">{t("Favorites")}</option>
      </select>
      <button type="button" aria-label="Reverse sort" onClick={()=>setDirection(x=>x==="desc"?"asc":"desc")}>{direction==="desc"?"↓":"↑"}</button>
    </div>
    {films.length?<div className="scene-b2-posters">{films.map(log=>{
      const id=movieId(log);
      const rating=Number(log?.rating);
      return <div className="scene-b2-film" key={id}>
        <button type="button" className="scene-b2-poster" title={movieTitle(log)}
          onClick={()=>navigate(hasReview(log)&&log?._id?`/review/${log._id}`:`/movie/${id}`)}>
          <FilmPoster log={log} customPosters={customPosters} id={id}/>
        </button>
        <div className="scene-b2-filmmeta">
          <span title="Your rating (out of 5)">{Number.isFinite(rating)&&rating>0?`★ ${rating}/5`:""}</span>
          <span>{hasReview(log)?"▤":""}</span>
          <span>{favs.has(id)?"♥":""}</span>
        </div>
      </div>;
    })}</div>:<div className="scene-b2-empty">{t("No films to show.")}</div>}
  </section>;
}
