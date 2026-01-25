// src/components/profile/ProfileTabs.jsx
import React, { useRef } from "react";
import { useDrag } from "@use-gesture/react";
import useTranslate from "../../utils/useTranslate";

export default function ProfileTabs({ activeTab, setActiveTab }) {
  const t = useTranslate();

  // ✅ List of tabs (keys we’ll pass through translator)
  const tabs = ["Profile", "Reviews", "Watchlist", "Lists", "Films"];
  const index = tabs.findIndex((tname) => tname === activeTab);
  const containerRef = useRef();

  const bind = useDrag(
    ({ swipe: [swipeX] }) => {
      if (swipeX === -1 && index < tabs.length - 1) {
        setActiveTab(tabs[index + 1]);
      } else if (swipeX === 1 && index > 0) {
        setActiveTab(tabs[index - 1]);
      }
    },
    {
      axis: "x",
      swipe: {
        velocity: 0.2,
        distance: 30,
      },
    }
  );

  return (
    <div
      ref={containerRef}
      {...bind()}
      style={{
        display: "flex",
        justifyContent: "space-around",
        borderBottom: "1px solid #333",
        touchAction: "pan-y",
        userSelect: "none",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            background: "none",
            border: "none",
            padding: "12px 0",
            fontSize: "14px",
            fontWeight: activeTab === tab ? "bold" : "normal",
            color: activeTab === tab ? "#fff" : "#888",
            borderBottom: activeTab === tab ? "2px solid #fff" : "none",
            flex: 1,
            cursor: "pointer",
          }}
        >
          {t(tab)} {/* ✅ translate instantly */}
        </button>
      ))}
    </div>
  );
}
