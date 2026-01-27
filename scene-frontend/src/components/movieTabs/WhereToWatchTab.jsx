// src/components/movieTabs/WhereToWatchTab.jsx
import React from "react";
import { backend } from "../../config";


export default function WhereToWatchTab({ providers, selectedRegion, setSelectedRegion }) {
  return (
    <div style={{ fontFamily: "Inter", padding: "10px" }}>
      {Object.keys(providers).length === 0 ? (
        <p style={{ color: "#888" }}>No streaming info available.</p>
      ) : (
        <>
          {/* Region Selector */}
          <div style={{ margin: "12px 0" }}>
            <label style={{ color: "#ccc", marginRight: "8px" }}>Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                backgroundColor: "#1f1f1f",
                color: "#fff",
                border: "1px solid #444",
                padding: "6px 10px",
                borderRadius: "6px",
                fontFamily: "Inter",
              }}
            >
              
              {Object.keys(providers).map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Logos */}
          {providers[selectedRegion] &&
          (providers[selectedRegion].flatrate ||
            providers[selectedRegion].rent ||
            providers[selectedRegion].buy) ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[...(providers[selectedRegion].flatrate || []),
                ...(providers[selectedRegion].rent || []),
                ...(providers[selectedRegion].buy || [])]
                .filter(
                  (v, i, self) =>
                    self.findIndex((s) => s.provider_id === v.provider_id) === i
                )
                .map((provider) => (
                  <div
                    key={provider.provider_id}
                    style={{ textAlign: "center", fontFamily: "Inter" }}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                      alt={provider.provider_name}
                      title={provider.provider_name}
                      style={{ width: "50px", borderRadius: "8px" }}
                    />
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: "#888" }}>
              No providers available for this region.
            </p>
          )}
        </>
      )}
    </div>
  );
}
