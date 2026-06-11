const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 8080;
const BACKEND_URL =
  process.env.VITE_API_URL ||
  process.env.REACT_APP_API_URL ||
  "https://backend.scenesa.com";

const BOT_UA =
  /(facebookexternalhit|Facebot|Twitterbot|Discordbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Pinterest|SkypeUriPreview|Viber|Snapchat|Google-InspectionTool|Google-Structured-Data-Testing-Tool)/i;

const isBotRequest = (req) => BOT_UA.test(req.headers["user-agent"] || "");

app.get("/review/:id", async (req, res, next) => {
  try {
    if (!isBotRequest(req)) return next();

    const id = req.params.id;

    const ogResponse = await fetch(`${BACKEND_URL}/og/review/${id}`, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "Twitterbot/1.0",
      },
    });

    const html = await ogResponse.text();

    res
      .status(200)
      .set("Cache-Control", "public, max-age=300")
      .type("text/html; charset=utf-8")
      .send(html);
  } catch (error) {
    console.error("❌ Frontend OG proxy error:", error);
    next();
  }
});

app.head("/review/:id", async (req, res, next) => {
  try {
    if (!isBotRequest(req)) return next();

    const id = req.params.id;

    await fetch(`${BACKEND_URL}/og/review/${id}`, {
      method: "HEAD",
      headers: {
        "User-Agent": req.headers["user-agent"] || "Twitterbot/1.0",
      },
    });

    res.status(200).end();
  } catch (error) {
    console.error("❌ Frontend OG HEAD error:", error);
    next();
  }
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Scene frontend server running on port ${PORT}`);
});