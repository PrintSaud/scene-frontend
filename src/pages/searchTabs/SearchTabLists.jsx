import React from "react";
import { useNavigate } from "react-router-dom";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

export default function SearchTabLists({ results }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "16px",
        padding: "0 16px 16px",
      }}
    >
      {results.map((list) => (
        <div
          key={list._id}
          onClick={() => navigate(`/list/${list._id}`)}
          style={{
            background: "#1a1a1a",
            borderRadius: "14px",
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {list.coverImage && (
            <img
              src={list.coverImage}
              alt={list.title}
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
              }}
            />
          )}

          <div style={{ padding: "10px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {list.title}
            </div>
            <div
              style={{
                color: "#aaa",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              @{list.user?.username || "unknown"}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "4px",
              }}
            >
              {list.likes?.includes(user?._id) ? (
                <AiFillHeart style={{ fontSize: "14px", color: "#B327F6" }} />
              ) : (
                <AiOutlineHeart style={{ fontSize: "14px", color: "#999" }} />
              )}
              <span style={{ fontSize: "12px", color: "#bbb" }}>{list.likes?.length || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
