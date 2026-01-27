import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import LogModal from "../components/modals/LogModal";
import StarRating from "../components/StarRating";
import { FaRegComment } from "react-icons/fa";
import { TMDB_IMG } from "../config";

export default function FriendsActivityPage() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState("week");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await axios.get(`/api/logs/${filter}`);
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      }
    };
    fetchLogs();
  }, [filter]);

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: "24px 16px", color: "#fff" }}>
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate("/home")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "transparent",
          border: "1px solid #fff",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ←
      </button>

      {/* Title */}
      <h1 style={{ textAlign: "center", marginTop: "70px", fontSize: "22px" }}>
        Your Friends Just Watched
      </h1>

      {/* Filter Buttons */}
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        {["day", "week", "month"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              margin: "0 8px",
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: f === filter ? "#fff" : "transparent",
              color: f === filter ? "#000" : "#fff",
              border: "1px solid #fff",
              cursor: "pointer",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Logs Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          gap: "18px",
        }}
      >
        {Array.isArray(logs) && logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log._id}
              onClick={() => setSelectedLog(log)}
              style={{
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={
                    log.customPoster ||
                    log.movie?.poster ||
                    `${TMDB_IMG}${log.movie?.poster_path}` ||
                    "/default-poster.jpg"
                  }
                  alt="poster"
                  style={{
                    width: "100%",
                    aspectRatio: "2/3",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
                {log.review && (
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      backgroundColor: "#fff",
                      color: "#000",
                      padding: "2px 6px",
                      fontSize: "12px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 600,
                    }}
                  >
                    <FaRegComment size={12} />
                  </div>
                )}
              </div>

              {/* Avatar + Username */}
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <img
                  src={log.user.avatar || "/default-avatar.png"}
                  alt="avatar"
                  style={{ width: "30px", height: "30px", borderRadius: "50%" }}
                />
                <p style={{ fontSize: "12px", color: "#ccc" }}>{log.user.username}</p>
              </div>

              {/* Rating */}
              {log.rating > 0 && (
                <div style={{ marginTop: "4px" }}>
                  <StarRating value={log.rating} size={12} />
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", marginTop: "40px", fontSize: "16px", gridColumn: "1 / -1" }}>
            No recent activity found.
          </p>
        )}
      </div>

      {/* Log Modal */}
      {selectedLog && (
        <LogModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
