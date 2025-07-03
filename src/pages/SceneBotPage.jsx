import React from "react";
import SceneBotComponent from "../components/SceneBotComponent";
import { backend } from "../config";

export default function SceneBotPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0e0e",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "60px",
      }}
    >
      <SceneBotComponent />
    </div>
  );
}
