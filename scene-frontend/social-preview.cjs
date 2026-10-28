"use strict";
// Scene social previews: public metadata and image generation only.
const sharp = require("sharp");
const BACKEND = (process.env.SCENE_OG_BACKEND_URL || "https://scene-backend-tv-production.up.railway.app").replace(/\/$/, "");
const SITE = "https://scenesa.com";
const W = 1200, H = 630;
const botRE = /(facebookexternalhit|Facebot|Twitterbot|Discordbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Pinterest|SkypeUriPreview|Viber|Snapchat|Google-InspectionTool|Google-Structured-Data-Testing-Tool)/i;
const allowedImageHosts = new Set(["image.tmdb.org", "res.cloudinary.com", "scenesa.com"]);
const XML = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const plain = (value, max = 180) => String(value ?? "").replace(/\s+/g," ").trim().slice(0,max);
const isId = value => /^[a-f\d]{24}$/i.test(value);
const isUsername = value => /^[a-z\d_.-]{1,48}$/i.test(value);
const normImage = value => {
  const src = typeof value === "object" && value !== null ? (value.url || value.secure_url || value.file_path || value.path || value.src || "") : value;
  const raw = String(src || "").trim();
  if (!raw) return null;
  const candidate = raw.startsWith("/") && !raw.startsWith("//") ? `https://image.tmdb.org/t/p/original${raw}` : raw;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && allowedImageHosts.has(url.hostname) ? url.href : null;
  } catch { return null; }
};
const pickImage = (...values) => values.map(normImage).find(Boolean) || null;
function backdrop(kind, data) {
  if (kind === "profile") return pickImage(data.profileBackdrop, data.backdrop);
  if (kind === "show-review") return pickImage(data.customBackdrop, data.reviewBackdrop, data.showBackdrop, data.show?.displayBackdrop, data.show?.backdropPath, data.show?.backdrop_path, data.show?.backdrop);
  if (kind === "episode-review") return pickImage(data.customEpisodeBackdrop, data.customBackdrop, data.episodeBackdrop, data.episodeStillPath, data.episode?.still, data.episode?.still?.file_path, data.episode?.still?.path, data.episode?.still_path, data.episode?.stillPath, data.episode?.backdrop, data.stillPath, data.showBackdrop, data.show?.backdropPath, data.show?.backdrop_path, data.show?.backdrop);
  return pickImage(data.customBackdrop, data.customBackdropUrl, data.reviewBackdrop, data.backdrop, data.backdropPath, data.movie?.backdrop_path);
}
function sendHeaders(res, status, type, maxAge = 180) {
  res.writeHead(status, {"Content-Type": type, "Cache-Control": `public, max-age=${maxAge}`, "X-Content-Type-Options": "nosniff"});
}
async function getJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(BACKEND + path, {headers: {Accept: "application/json"}, signal: controller.signal});
    if (!response.ok) return null;
    if (Number(response.headers.get("content-length") || 0) > 1024 * 1024) return null;
    const value = await response.json();
    return value && typeof value === "object" ? value : null;
  } catch (error) {
    console.warn("Scene OG API:", error.message);
    return null;
  } finally { clearTimeout(timer); }
}
async function loadRecord(kind, id) {
  if (kind === "profile") return getJson(`/api/users/username/${encodeURIComponent(id)}`);
  if (kind === "review") {
    const log = await getJson(`/api/logs/${encodeURIComponent(id)}`);
    if (!log) return null;
    // Public log responses may contain the film title but omit its release date.
    // Fetch movie details by TMDB ID only when the year is not already provided.
    const knownYear = yearOf(
      log.movie?.releaseDate, log.movie?.release_date, log.movie?.releaseYear,
      log.releaseDate, log.release_date, log.releaseYear, log.movie?.year, log.year
    );
    const tmdbId = Number(log.tmdbId || log.movie?.tmdbId || log.movie?.id);
    if (!knownYear && Number.isSafeInteger(tmdbId) && tmdbId > 0) {
      const movieDetails = await getJson(`/api/movies/${tmdbId}`);
      const details = movieDetails?.movie || movieDetails?.data || movieDetails;
      const resolvedYear = yearOf(
        details?.release_date, details?.releaseDate, details?.year,
        details?.releaseYear, details?.movie?.release_date, details?.movie?.releaseDate
      );
      if (resolvedYear) log.sceneSocialReleaseYear = resolvedYear;
    }
    return log;
  }
  if (kind === "show-review") {
    const result = await getJson(`/api/show-reviews/${encodeURIComponent(id)}`);
    return result?.review || null;
  }
  if (kind === "episode-review") {
    const result = await getJson(`/api/tv-logs/${encodeURIComponent(id)}`);
    return result?.log || null;
  }
  return null;
}
function episodeCode(data) {
  const season = data.seasonNumber ?? data.season_number ?? data.episode?.seasonNumber ?? data.episode?.season_number ?? data.season?.number;
  const episode = data.episodeNumber ?? data.episode_number ?? data.episode?.episodeNumber ?? data.episode?.episode_number ?? data.episode?.number;
  const s = Number(season), e = Number(episode);
  return season != null && episode != null && Number.isInteger(s) && s >= 0 && Number.isInteger(e) && e > 0
    ? `S${String(s).padStart(2,"0")}E${String(e).padStart(2,"0")}` : "";
}
function yearOf(...values) {
  for (const value of values) {
    const str = String(value || "");
    const year = str.match(/^(18|19|20|21)\d{2}/);
    if (year) return year[0];
  }
  return "";
}
function titleFor(kind, data) {
  if (kind === "show-review") return plain(data.showName || data.showTitle || data.show?.name || data.show?.title || "TV Show", 90);
  if (kind === "episode-review") return plain(data.episodeName || data.episodeTitle || data.episode?.name || data.episode?.title || data.episode?.episodeName || data.episode?.episodeTitle || data.episodeDetails?.name || data.episodeDetails?.title || "Episode", 90);
  return plain(data.movie?.title || data.movieTitle || data.title || "Film", 90);
}
function usernameFor(kind, data) {
  return plain(kind === "profile" ? data.username : (data.user?.username || data.username), 42) || "Scene";
}
function ratingFor(data) {
  const rating = Number(data.rating);
  return data.rating != null && data.rating !== "" && Number.isFinite(rating) && rating >= 0.5 && rating <= 5 ? Math.round(rating * 2) / 2 : null;
}
function displayTitle(kind, data) {
  const title = titleFor(kind, data);
  if (kind === "episode-review") {
    const code = episodeCode(data);
    return code ? `${title} · ${code}` : title;
  }
  const year = kind === "show-review"
    ? yearOf(data.firstAirDate, data.first_air_date, data.show?.firstAirDate, data.show?.first_air_date, data.show?.releaseDate, data.show?.firstAirYear, data.show?.year)
    : yearOf(data.sceneSocialReleaseYear, data.movie?.releaseDate, data.movie?.release_date, data.movie?.releaseYear, data.releaseDate, data.release_date, data.releaseYear, data.movie?.year, data.year);
  return year && !title.includes(`(${year})`) ? `${title} (${year})` : title;
}
function imageUrl(kind, value, record) {
  const version = encodeURIComponent(String(record.updatedAt || record.customEpisodeBackdrop || record.customBackdrop || record.profileBackdrop || record._id || "1").slice(0,55));
  return `${SITE}/__scene_og/${kind}/${encodeURIComponent(value)}.png?v=${version}`;
}
function shareMeta(kind, record, value) {
  const isProfile = kind === "profile";
  const username = usernameFor(kind, record);
  const headline = isProfile ? `@${username} on Scene` : `${displayTitle(kind, record)} — @${username} on Scene`;
  const description = isProfile
    ? plain(record.bio, 160) || "Discover this member on Scene."
    : plain(record.review, 160) || `A review by @${username} on Scene.`;
  const url = `${SITE}/${kind === "profile" ? "u" : kind}/${encodeURIComponent(value)}`;
  const image = imageUrl(kind, value, record);
  const og = [
    ["og:type", isProfile ? "profile" : "article"], ["og:title", headline],
    ["og:description", description], ["og:url", url], ["og:image", image],
    ["og:image:width", "1200"], ["og:image:height", "630"], ["og:image:type", "image/png"]
  ].map(([key, val]) => `<meta property="${key}" content="${XML(val)}">`).join("\n");
  const twitter = [
    ["twitter:card", "summary_large_image"], ["twitter:title", headline],
    ["twitter:description", description], ["twitter:image", image]
  ].map(([key,val]) => `<meta name="${key}" content="${XML(val)}">`).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${XML(headline)}</title>\n${og}\n${twitter}</head><body><a href="${XML(url)}">Open on Scene</a></body></html>`;
}
const STAR = "M 23 1 L 29.8 15.1 L 45.5 17.3 L 34.1 28.4 L 36.8 44 L 23 36.6 L 9.2 44 L 11.9 28.4 L .5 17.3 L 16.2 15.1 Z";
function svgStars(rating, y) {
  if (rating === null) return "";
  return Array.from({length: 5}, (_, i) => {
    const fill = Math.max(0, Math.min(1, rating - i));
    const width = (46 * fill).toFixed(1);
    return `<g transform="translate(${70 + i * 56},${y})"><path d="${STAR}" fill="#51465c"/>${fill > 0 ? `<svg width="${width}" height="46" viewBox="0 0 ${width} 46" overflow="hidden"><path d="${STAR}" fill="#A970FF"/></svg>` : ""}</g>`;
  }).join("");
}
function imageSvg(kind, data) {
  const isProfile = kind === "profile";
  const username = "@" + usernameFor(kind,data);
  const heading = isProfile ? "" : displayTitle(kind, data);
  const bio = isProfile ? plain(data.bio, 125) : "";
  // Keep all visible text toward the lower-left, leaving the selected backdrop as the hero.
  const gradient = `<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#000" stop-opacity="0"/><stop offset=".43" stop-color="#000" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".88"/></linearGradient></defs><rect width="1200" height="630" fill="url(#shade)"/>`;
  const userY = isProfile ? 475 : 450;
  const user = `<text x="70" y="${userY}" fill="#fff" font-size="${username.length > 25 ? 42 : 52}" font-weight="700" font-family="Arial, sans-serif">${XML(username)}</text>`;
  let details;
  if (isProfile) {
    const first = bio.slice(0,65), second = bio.slice(65,125).trim();
    details = bio ? `<text x="70" y="548" font-size="30" fill="#f1edf5" font-family="Arial, sans-serif">${XML(first)}</text>${second ? `<text x="70" y="587" font-size="30" fill="#f1edf5" font-family="Arial, sans-serif">${XML(second)}</text>` : ""}` : "";
  } else {
    const short = heading.length > 48 ? heading.slice(0,47).trimEnd() + "…" : heading;
    details = `<text x="70" y="515" font-size="${short.length > 33 ? 32 : 40}" fill="#fff" font-weight="600" font-family="Arial, sans-serif">${XML(short)}</text>${svgStars(ratingFor(data), 535)}`;
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${gradient}${user}${details}</svg>`);
}
async function fetchImage(url) {
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(url, {signal: controller.signal});
    if (!response.ok || !(response.headers.get("content-type") || "").startsWith("image/")) return null;
    if (Number(response.headers.get("content-length") || 0) > 8 * 1024 * 1024) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length <= 8 * 1024 * 1024 ? bytes : null;
  } catch { return null; }
  finally { clearTimeout(timer); }
}
function backdropCandidates(kind, data) {
  if (kind === "episode-review") {
    return [
      data.customEpisodeBackdrop, data.customBackdrop, data.episodeBackdrop,
      data.episodeStillPath, data.episode?.still, data.episode?.still?.file_path,
      data.episode?.still_path, data.episode?.stillPath, data.episode?.backdrop,
      data.stillPath, data.showBackdrop, data.show?.backdropPath,
      data.show?.backdrop_path, data.show?.backdrop,
    ].map(normImage).filter(Boolean);
  }
  return [backdrop(kind, data)].filter(Boolean);
}
async function makeImage(kind, record) {
  let background = sharp({create:{width:W,height:H,channels:4,background:"#171421"}}).png();
  // A missing or inaccessible custom image must not hide the available episode/show still.
  for (const url of backdropCandidates(kind, record)) {
    const bytes = await fetchImage(url);
    if (!bytes) continue;
    try {
      await sharp(bytes).metadata();
      background = sharp(bytes).rotate().resize(W,H,{fit:"cover",position:"attention"}).png();
      break;
    } catch { /* Try next candidate. */ }
  }
  return background.composite([{input:imageSvg(kind,record),left:0,top:0}]).png().toBuffer();
}
async function handle(req,res,pathname) {
  const picture = pathname.match(/^\/__scene_og\/(review|show-review|episode-review|profile)\/([^/]+)\.png$/);
  const page = pathname.match(/^\/(review|show-review|episode-review|u)\/([^/]+)\/?$/);
  if (!picture && !(page && botRE.test(req.headers["user-agent"] || ""))) return false;
  if (req.method !== "GET" && req.method !== "HEAD") {res.writeHead(405);res.end();return true;}
  const kind = picture ? picture[1] : (page[1] === "u" ? "profile" : page[1]);
  let value;
  try { value = decodeURIComponent(picture ? picture[2] : page[2]); }
  catch {res.writeHead(400);res.end();return true;}
  if (!(kind === "profile" ? isUsername(value) : isId(value))) {res.writeHead(404);res.end();return true;}
  const record = await loadRecord(kind,value);
  if (!record) {res.writeHead(404,{"Cache-Control":"no-store"});res.end("Not found");return true;}
  if (picture) {
    try {
      const png = await makeImage(kind,record);
      sendHeaders(res,200,"image/png",300);
      res.end(req.method === "HEAD" ? undefined : png);
    } catch (error) {
      console.error("Scene OG image:",error.message);
      res.writeHead(500,{"Cache-Control":"no-store"});res.end("Image unavailable");
    }
  } else {
    sendHeaders(res,200,"text/html; charset=utf-8");
    res.end(req.method === "HEAD" ? undefined : shareMeta(kind,record,value));
  }
  return true;
}
module.exports = {handle};
