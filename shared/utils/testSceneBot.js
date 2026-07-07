// shared/utils/testSceneBot.js
import callSceneBot from "./callSceneBot.js";

// Patch AsyncStorage for Node
import { existsSync } from "fs";

if (!global.AsyncStorage) {
  global.AsyncStorage = {
    getItem: async (key) => null,
    setItem: async (key, value) => {},
  };
}

async function testBot() {
  try {
    const reply = await callSceneBot("Hello SceneBot!");
    console.log("✅ SceneBot replied:", reply);
  } catch (err) {
    console.error("❌ SceneBot error:", err);
  }
}

testBot();
