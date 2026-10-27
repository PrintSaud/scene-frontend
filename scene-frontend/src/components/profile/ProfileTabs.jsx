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
      className="scene-profile-tabs"
      role="tablist"
      aria-label="Profile sections"
      style={{ touchAction: "pan-y", userSelect: "none" }}
    >
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab}
          className="scene-profile-tab"
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => setActiveTab(tab)}
        >
          {tab === "Films" ? t("Movies") : t(tab)}
        </button>
      ))}
    </div>
  );
}
