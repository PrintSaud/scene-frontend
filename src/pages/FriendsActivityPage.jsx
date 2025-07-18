import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogModal from "../components/modals/LogModal";
import axios from "../api/api";
import { backend } from "../config";

export default function FriendsActivityPage() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState("week");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`/api/logs/${filter}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      }
    };
    fetchLogs();
  }, [filter]);

  return (
    <div
      style={{
        padding: "20px",
        color: "#fff",
        backgroundColor: "#000", // ✅ FULL BLACK BACKGROUND
        minHeight: "100vh",
      }}
    >
      {/* 🔙 Back to Home */}
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
        ← Home
      </button>

      {/* Title */}
      <h1
        style={{
          textAlign: "center",
          marginTop: "70px", // ⬇️ moved it down
          marginBottom: "20px",
          fontSize: "24px",
        }}
      >
        Your Friends Just Watched 👀
      </h1>

      {/* Filter Buttons */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {["day", "week", "month"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              margin: "0 8px",
              padding: "6px 12px",
              borderRadius: "20px",
              backgroundColor: f === filter ? "#fff" : "transparent",
              color: f === filter ? "#000" : "#fff",
              border: "1px solid #fff",
              cursor: "pointer",
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "20px",
          justifyItems: "center",
        }}
      >
        {Array.isArray(logs) && logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log._id}
              onClick={() => setSelectedLog(log)}
              style={{
                width: "180px",
                background: "#111",
                borderRadius: "10px",
                padding: "10px",
                textAlign: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <img
                src={log.customPoster || log.movie.poster}
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
                    top: "8px",
                    right: "8px",
                    backgroundColor: "#fff",
                    color: "#000",
                    padding: "2px 6px",
                    fontSize: "12px",
                    borderRadius: "6px",
                  }}
                >
                  📝
                </div>
              )}

              {log.rating && (
                <div style={{ marginTop: "8px", fontSize: "14px" }}>
                  ⭐ {log.rating}/5
                </div>
              )}
              <img
                src={log.user.avatar || "/default-avatar.png"}
                alt="avatar"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  marginTop: "6px",
                }}
              />
              <p style={{ fontSize: "12px", marginTop: "4px" }}>{log.user.username}</p>
            </div>
          ))
        ) : (
          <p
            style={{
              textAlign: "center",
              marginTop: "40px",
              fontSize: "16px",
              gridColumn: "1 / -1",
            }}
          >
            No recent activity found.
          </p>
        )}
      </div>

      {/* Modal */}
      {selectedLog && (
        <LogModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
