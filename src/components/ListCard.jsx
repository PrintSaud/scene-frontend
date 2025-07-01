// src/components/ListCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function ListCard({ list }) {
  const navigate = useNavigate();

  return (
    <div
      key={list._id}
      onClick={() => navigate(`/list/${list._id}`)}
      style={{
        background: "#1a1a1a",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        height: "180px",
        transition: "transform 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <img
        src={list.coverImage}
        alt={list.title}
        style={{
          width: "100%",
          height: "120px",
          objectFit: "cover",
        }}
      />
      <div style={{ padding: "8px 12px", color: "#fff", fontSize: "13px" }}>
        <div
          style={{
            fontWeight: "bold",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {list.title}
        </div>
        <div style={{ color: "#aaa", fontSize: "11px", marginTop: "2px" }}>
          @{list.user?.username || "unknown"}
        </div>
        <div style={{ fontSize: "11px", color: "#bbb", marginTop: "4px" }}>
          ❤️ {list.likes?.length || 0} {list.likes?.length === 1 ? "like" : "likes"}
        </div>
      </div>
    </div>
  );
}
