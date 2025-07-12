import React, { useEffect, useState } from "react";
import axios from "../../api/api";
import { backend } from "../../config";
import toast from "react-hot-toast";


export default function ListPickerModal({ movie, onClose }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));


  useEffect(() => {
    const fetchLists = async () => {
      try {
        const { data } = await axios.get(`${backend}/api/lists/user/${user._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        setLists(data.filter((list) => !list.isPrivate));
        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to load lists", err);
      }
    };

    fetchLists();
  }, []);

  const handleAddToList = async (listId) => {
    try {
      await axios.post(
        `${backend}/api/lists/${listId}/add`,
        {
          id: movie.id,
          title: movie.title,
          poster: movie.poster,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
  
      window.dispatchEvent(new Event("refreshMyLists"));
      toast.success("✅ Added to list!");  // ✅ Nice toast
      onClose();
    } catch (err) {
      console.error("❌ Failed to add movie to list", err);
      toast.error("❌ Failed to add movie.");  // ✅ Error toast too
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
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <button onClick={onClose} style={backBtn}>← Back</button>
        <h3 style={{ marginLeft: "16px", fontSize: "16px" }}>Select a list to add this film</h3>
      </div>

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
              <img
                src={list.coverImage || "/default-cover.jpg"}
                alt={list.title}
                style={{
                  width: "100%",
                  height: "140px",
                  objectFit: "cover",
                }}
              />
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
                <div style={{ fontSize: "12px", color: "#bbb", marginTop: "4px" }}>
                  ❤️ {list.likes?.length || 0} {list.likes?.length === 1 ? "like" : "likes"}
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
