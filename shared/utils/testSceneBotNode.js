import fetch from "node-fetch";

async function testBot() {
  try {
    const res = await fetch("https://backend.scenesa.com/api/scene-bot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Hello from test!" })
    });
    const data = await res.json();
    console.log("✅ SceneBot response:", data);
  } catch (err) {
    console.error("❌ Error calling SceneBot:", err);
  }
}

testBot();
