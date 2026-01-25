// filename: generateSceneBotJWT.js
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// 1️⃣ Your server secret for SceneBot
const SECRET = 'supersecretstring123'; // this must match what the backend expects

// 2️⃣ Generate a valid JWT
const payload = {
  bot: 'scene',      // some identifier the backend checks
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
};

const token = jwt.sign(payload, SECRET);
console.log('✅ Generated JWT:', token);

// 3️⃣ Call the SceneBot endpoint
const callSceneBot = async () => {
  const res = await fetch('https://backend.scenesa.com/api/scene-bot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message: 'Hi SceneBot, recommend a good movie tonight' }),
  });

  const data = await res.json();
  console.log('🎬 SceneBot response:', data);
};

callSceneBot();
