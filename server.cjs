const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");

// Important: OG routes live at backend root, not /api
const BACKEND_URL = (
  process.env.OG_BACKEND_URL ||
  "https://backend.scenesa.com"
).replace(/\/+$/, "").replace(/\/api$/, "");

const BOT_UA =
  /(facebookexternalhit|Facebot|Twitterbot|Discordbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Pinterest|SkypeUriPreview|Viber|Snapchat|Google-InspectionTool|Google-Structured-Data-Testing-Tool)/i;

function isBotRequest(req) {
  return BOT_UA.test(req.headers["user-agent"] || "");
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  return {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  }[ext] || "application/octet-stream";
}

function sendIndex(req, res) {
  fs.readFile(INDEX_FILE, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Scene frontend index.html not found.");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });

    if (req.method === "HEAD") return res.end();
    res.end(data);
  });
}

function sendStatic(req, res, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(cleanPath);
  const filePath = path.join(DIST_DIR, decodedPath);

  if (!filePath.startsWith(DIST_DIR)) return sendIndex(req, res);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) return sendIndex(req, res);

    res.writeHead(200, {
      "Content-Type": getContentType(filePath),
      "Content-Length": stats.size,
      "Cache-Control": filePath === INDEX_FILE
        ? "no-cache"
        : "public, max-age=31536000, immutable",
    });

    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

async function handleReviewBot(req, res, reviewId) {
  const targetUrl = `${BACKEND_URL}/review/${encodeURIComponent(reviewId)}`;

  try {
    console.log(`🤖 OG proxy hit: ${req.headers["user-agent"] || ""}`);
    console.log(`➡️ Fetching: ${targetUrl}`);

    const backendResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "Twitterbot/1.0",
        "Accept": "text/html,*/*",
      },
    });

    const html = await backendResponse.text();

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Scene-OG-Proxy": "1",
      "X-Scene-OG-Backend": targetUrl,
    });

    if (req.method === "HEAD") return res.end();
    res.end(html);
  } catch (error) {
    console.error("❌ Review OG proxy error:", error?.message || error);
    sendIndex(req, res);
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Method Not Allowed");
  }

  const reviewMatch = pathname.match(/^\/review\/([^/]+)\/?$/);

  if (reviewMatch && isBotRequest(req)) {
    await handleReviewBot(req, res, reviewMatch[1]);
    return;
  }

  sendStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`✅ Scene frontend server running on port ${PORT}`);
  console.log(`✅ Review OG backend source: ${BACKEND_URL}`);
});
