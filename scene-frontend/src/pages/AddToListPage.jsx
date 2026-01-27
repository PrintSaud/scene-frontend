import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../api/api"; // ✅ Using your centralized axios instance
import toast from "react-hot-toast";
import { backend } from "../config";
export default function AddToListPage() {
  const { movieId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const movie = location.state?.movie;
 

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!storedUser || !token) return;

        const user = JSON.parse(storedUser);

        const res = await axios.get(`${backend}/api/lists/user/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLists(res.data || []);
      } catch (err) {
        console.error("❌ Fetch lists error →", err);
        toast.error("Failed to load your lists.");
      }
    };

    fetchLists();
  }, []);

  const handleAdd = async (listId) => {
    if (!movieId || !movie?.title) {
      toast.error("Movie data is missing.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${backend}/api/lists/${listId}/add`,
        {
          id: movieId.toString(),
          title: movie.title,
          poster: movie.poster || "", // fallback
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(`Added to "${lists.find((l) => l._id === listId)?.title}"`);
      navigate(-1); // back to movie page
    } catch (err) {
      console.error("Add to list error:", err);
      toast.error("Failed to add to list");
    }
  };

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        padding: "24px",
        color: "#fff",
        position: "relative",
      }}
    >
      {/* ← Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ←
      </button>

      {/* Page Title */}
      <h2 style={{ textAlign: "center", marginBottom: "16px", fontSize: "18px" }}>
        Select a List
      </h2>

      {lists.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa" }}>You don’t have any lists yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            padding: "0 4px",
          }}
        >
          {lists.map((list) => (
            <div
              key={list._id}
              onClick={() => handleAdd(list._id)}
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
                src={list.coverImage || "https://placehold.co/300x170/000/fff?text=No+Image"}
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
