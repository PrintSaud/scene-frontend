import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api"; // 👈 uses token automatically
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

    export default function SearchTabLists({ searchTerm, activeTab }) {

  const navigate = useNavigate();
  const [lists, setLists] = useState([]);

  useEffect(() => {
    const fetchLists = async () => {
      console.log("📤 Calling /lists/search with:", searchTerm);
  
      try {
        const res = await axios.get(`/api/lists/search?query=${searchTerm}`);
        console.log("📥 Response from list search:", res.data);
  
        if (Array.isArray(res.data)) {
          setLists(res.data);
        } else {
          console.warn("⚠️ Lists response is not an array:", res.data);
          setLists([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch lists:", err);
        setLists([]);
      }
    };
  
    if (activeTab === "lists" && searchTerm) {
      fetchLists();
    }
  }, [activeTab, searchTerm]);
  
  

  const user = JSON.parse(localStorage.getItem("user"));

  if (!Array.isArray(lists) || lists.length === 0) {
    return <p style={{ color: "#888", textAlign: "center" }}>No lists found.</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "16px",
        padding: "0 16px 80px",
      }}
    >
      {lists.map((list) => (
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
              style={{ width: "100%", height: "150px", objectFit: "cover" }}
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
            <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>
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
              <span style={{ fontSize: "12px", color: "#bbb" }}>
                {list.likes?.length || 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
