// SCENE_PROFILE_APP_PARITY_BATCH1 — movie stats and web timeline derived from public logs.
import React, { useMemo, useState } from "react";
import {useNavigate} from "react-router-dom";
// SCENE_PROFILE_REPAIR_TIMELINE_V3
import "../../styles/scene-profile-app-parity.css";
const movieId = l => l?.tmdbId ?? l?.movie?.tmdbId ?? l?.movie?.id ?? l?.movieId;
const watchedAt = l => l?.watchedAt || l?.watchedDate || l?.watchDate || l?.createdAt;
export default function SceneWebProfileStats({logs = []}) {
  const navigate=useNavigate();
  const guest=(()=>{try{const u=JSON.parse(localStorage.getItem("user")||"null");return !u?._id||!u?.token;}catch{return true}})();
  const openTimeline=()=>guest
    ? navigate(`/login?redirect=${encodeURIComponent(window.location.pathname+window.location.search)}`)
    : setTimelineOpen(true);
  const [timelineOpen,setTimelineOpen]=useState(false);
  const [year,setYear]=useState(new Date().getFullYear());
  const data=useMemo(()=>{
    const valid=(Array.isArray(logs)?logs:[]).filter(l=>movieId(l));
    const y=new Date().getFullYear();
    const thisYear=valid.filter(l=>{const d=new Date(watchedAt(l));return !Number.isNaN(d.getTime()) && d.getFullYear()===y});
    const ratings=valid.map(l=>Number(l.rating)).filter(n=>Number.isFinite(n)&&n>0);
    // Runtime can only be summed where the API provided a reliable positive minute value.
    const minutes=valid.map(l=>Number(l?.movie?.runtime ?? l?.runtime)).filter(n=>Number.isFinite(n)&&n>0);
    const entries=valid.filter(l=>!Number.isNaN(new Date(watchedAt(l)).getTime())).sort((a,b)=>new Date(watchedAt(b))-new Date(watchedAt(a)));
    return {year:y, watched:thisYear.length, avg:ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2):"—",minutes:minutes.length===valid.length&&valid.length?minutes.reduce((a,b)=>a+b,0):null,entries};
  },[logs]);
  const years=[...new Set([data.year,...data.entries.map(l=>new Date(watchedAt(l)).getFullYear())])].sort((a,b)=>b-a);
  const byMonth=Array.from({length:12},(_,m)=>({month:m, entries:data.entries.filter(l=>new Date(watchedAt(l)).getFullYear()===year && new Date(watchedAt(l)).getMonth()===m)})).filter(x=>x.entries.length);
  const time=data.minutes==null?"—":`${Math.floor(data.minutes/60)}h ${data.minutes%60}m`;
  return <section className="scene-web-stats">
    <div className="scene-web-stats-heading"><h3>Movie Stats</h3><button type="button" onClick={openTimeline}>▦ <span>Timeline</span> ›</button></div>
    <div className="scene-web-stat-grid">
      <div className="scene-web-stat-card"><span aria-hidden="true">▣</span><strong>{data.watched}</strong><small>Movies Watched This Year</small><em>{data.year}</em></div>
      <div className="scene-web-stat-card"><span aria-hidden="true">◷</span><strong>{time}</strong><small>Watched Time</small>{data.minutes==null&&<em>Runtime unavailable</em>}</div>
      <div className="scene-web-stat-card"><span aria-hidden="true">☆</span><strong>{data.avg}</strong><small>Average Rating</small></div>
    </div>
    {timelineOpen && <div className="scene-web-timeline-cover" role="presentation" onClick={()=>setTimelineOpen(false)}><div className="scene-web-timeline" role="dialog" aria-modal="true" aria-label="Watch timeline" onClick={e=>e.stopPropagation()}><div className="scene-web-timeline-top"><h3>Timeline</h3><button type="button" onClick={()=>setTimelineOpen(false)} aria-label="Close timeline">×</button></div><div className="scene-web-year-row">{years.map(y=><button key={y} type="button" className={y===year?"selected":""} onClick={()=>setYear(y)}>{y}</button>)}</div><div className="scene-web-timeline-list">{byMonth.length?byMonth.map(({month,entries})=><section key={month}><h4>{new Date(year,month,1).toLocaleDateString(undefined,{month:"long",year:"numeric"})}<span>{entries.length} watched</span></h4><div className="scene-web-timeline-items">{entries.map((l,i)=><div key={l._id||i}><span>{new Date(watchedAt(l)).toLocaleDateString(undefined,{day:"numeric",month:"short"})}</span><strong>{l.title||l.movie?.title||`Movie ${movieId(l)}`}</strong>{Number(l.rating)>0&&<small>★ {l.rating}</small>}</div>)}</div></section>):<p>No movies logged for this year.</p>}</div></div></div>}
  </section>;
}
