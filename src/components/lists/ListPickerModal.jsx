import React, { useEffect, useState } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

export default function ListPickerModal({ movie, onClose }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const { data } = await api.get(`/api/lists/user/${user._id}`);
        setLists(data.filter((list) => !list.isPrivate));
        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to load lists", err);
        toast.error("Failed to load your lists");
      }
    };

    fetchLists();
  }, []);

  const handleAddToList = async (listId) => {
    try {
      await api.post(`/api/lists/${listId}/add`, {
        id: movie.id,
        title: movie.title,
        poster: movie.poster,
      });

      window.dispatchEvent(new Event("refreshMyLists"));
      toast.success("✅ Added to list!");
      onClose();
    } catch (err) {
      console.error("❌ Failed to add movie to list", err);
      toast.error("❌ Failed to add movie.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.95)",
        padding: "24px",
        overflowY: "scroll",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <button onClick={onClose} style={backBtn}>← Back</button>
        <h3 style={{ marginLeft: "16px", fontSize: "16px" }}>Select a list to add this film</h3>
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ color: "#aaa" }}>Loading your lists...</p>
      ) : lists.length === 0 ? (
        <p style={{ color: "#aaa" }}>You haven’t made any lists yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            paddingBottom: "24px",
          }}
        >
          {lists.map((list) => (
            <div
              key={list._id}
              onClick={() => handleAddToList(list._id)}
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
                    height: "140px",
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

                <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>
                  @{list.user?.username || "unknown"}
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  marginTop: "4px"
                }}>
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
      )}
    </div>
  );
}

const backBtn = {
  background: "none",
  color: "#fff",
  fontSize: "16px",
  border: "none",
  cursor: "pointer",
};
