// SCENE_WEB_PROFILE_BATCH2 — web adaptation of mobile Watchlist
import React, {useEffect,useMemo,useState} from "react";
import {useNavigate} from "react-router-dom";
import api, {getCustomPostersBatch} from "../../api/api";
import getPosterUrl from "../../utils/getPosterUrl";
import useTranslate from "../../utils/useTranslate";
import "../../styles/scene-profile-batch2.css";
const asArray=v=>Array.isArray(v)?v:Array.isArray(v?.results)?v.results:Array.isArray(v?.items)?v.items:Array.isArray(v?.watchlist)?v.watchlist:[];
const mid=v=>Number(v?.tmdbId??v?.movie?.tmdbId??v?.movie?.id??v?.id??v?.movieId)||null;
const fmtDate=v=>{const t=new Date(v||0).getTime();return Number.isFinite(t)?t:0};
const numeric=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const getYear=v=>v?.release_date||v?.releaseDate||v?.movie?.release_date||v?.movie?.releaseDate||"";
const getGenre=v=>v?.genre_ids||v?.movie?.genre_ids||v?.genres||v?.movie?.genres||[];
const hasGenre=(v,g)=>!g||asArray(getGenre(v)).some(x=>Number(x?.id??x)===Number(g));
const getRuntime=v=>numeric(v?.runtime??v?.movie?.runtime);
const getRating=v=>numeric(v?.rating??v?.myRating??v?.movie?.vote_average??v?.vote_average);
const getTitle=v=>v?.title||v?.movie?.title||"Movie";
export default function ProfileTabWatchlist({user,sortType="added",setSortType,order="desc",setOrder,watchList=[],setWatchList,profileUserId}){
 const t=useTranslate();const nav=useNavigate();const [items,setItems]=useState([]);const [genre,setGenre]=useState("");const [query,setQuery]=useState("");const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [posters,setPosters]=useState({});
 const [localSort,setLocalSort]=useState(sortType);const [localOrder,setLocalOrder]=useState(order);
 const sort=setSortType?sortType:localSort;const direction=setOrder?order:localOrder;
 useEffect(()=>{let active=true;if(!profileUserId){setItems([]);setLoading(false);return;}setLoading(true);setError("");
 api.get(`/api/users/${encodeURIComponent(profileUserId)}/watchlist`).then(r=>{if(!active)return;const list=asArray(r.data).filter(v=>!v?.isPrivate);setItems(list);if(typeof setWatchList==="function")setWatchList(list);const ids=[...new Set(list.map(mid).filter(Boolean))].slice(0,100);if(ids.length)getCustomPostersBatch(profileUserId,ids).then(p=>{if(active)setPosters(p||{});}).catch(()=>{});}).catch(()=>{if(active){setItems([]);setError(t("Unable to load watchlist."));}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false};},[profileUserId]);
 const shown=useMemo(()=>{const dir=direction==="asc"?1:-1;let a=items.filter(x=>hasGenre(x,genre)&&getTitle(x).toLowerCase().includes(query.trim().toLowerCase()));return [...a].sort((x,y)=>{let ax=0,ay=0;if(sort==="release"){ax=fmtDate(getYear(x));ay=fmtDate(getYear(y));}else if(sort==="runtime"){ax=getRuntime(x);ay=getRuntime(y);}else if(sort==="rating"){ax=getRating(x);ay=getRating(y);}else{ax=fmtDate(x.addedAt||x.createdAt);ay=fmtDate(y.addedAt||y.createdAt);}return (ax-ay)*dir;});},[items,genre,query,sort,direction]);
 return <section className="scene-b2"><div className="scene-b2-toolbar"><input aria-label="Search watchlist" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search watchlist...")}/><select aria-label="Sort watchlist" value={sort} onChange={e=>setSortType?setSortType(e.target.value):setLocalSort(e.target.value)}><option value="added">{t("Recently Added")}</option><option value="release">{t("Release Date")}</option><option value="rating">{t("Rating")}</option><option value="runtime">{t("Runtime")}</option></select><button type="button" aria-label="Reverse sort" onClick={()=>setOrder?setOrder(direction==="desc"?"asc":"desc"):setLocalOrder(direction==="desc"?"asc":"desc")}>{direction==="desc"?"↓":"↑"}</button><select aria-label="Genre" value={genre} onChange={e=>setGenre(e.target.value)}>{[["",t("All Genres")],[28,t("Action")],[35,t("Comedy")],[18,t("Drama")],[27,t("Horror")],[10749,t("Romance")],[16,t("Animation")],[80,t("Crime")],[53,t("Thriller")]].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
 {loading?<div className="scene-b2-empty">{t("Loading your Scenes...")}</div>:error?<div className="scene-b2-empty" role="alert">{error}</div>:shown.length?<div className="scene-b2-posters">{shown.map((m,i)=>{const id=mid(m);const src=getPosterUrl(id,posters,m)||"/default-poster.jpg";return <button type="button" className="scene-b2-poster" key={`${id||"missing"}-${i}`} title={getTitle(m)} onClick={()=>id&&nav(`/movie/${id}`)}><img loading="lazy" alt={getTitle(m)} src={src} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default-poster.jpg";}}/></button>;})}</div>:<div className="scene-b2-empty">{t("This watchlist is empty.")}</div>}</section>;
}
