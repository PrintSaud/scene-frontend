import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import api from "../api/api";



export default function ShareToFriendPage() {
  const { type, id } = useParams(); // 🔥 universal support
  const navigate = useNavigate();
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [resourceTitle, setResourceTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const toggleSelect = (uid) => {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) return toast.error("Not logged in");
    
        const loggedIn = JSON.parse(stored);
    
        // 🔥 FIX: Fetch fresh current user data with following/followers included
        const { data: freshUser } = await api.get(`/api/users/${loggedIn._id}`);
        setCurrentUser(freshUser);
    
        const usersRes = await api.get(`/api/users`);
        setAllUsers(usersRes.data);
    
        let title = "";
    
        if (type === "movie") {
          try {
            const res = await api.get(`/api/movies/${id}`);
            title = res.data.title;
          } catch {
            const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`);
            title = tmdbRes.data.title;
          }
        } else if (type === "log") {
          const res = await api.get(`/api/logs/${id}`);
          title = res.data.movie?.title || "Untitled Log";
        } else if (type === "list") {
          const res = await api.get(`/api/lists/${id}`);
          title = res.data.title || "Untitled List";
        }
    
        setResourceTitle(title);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error loading data:", err);
        setError(true);
        setLoading(false);
      }
    };
    

    if (type && id) fetchData();
  }, [type, id]);

  const handleSend = async () => {
    try {
      await api.post(`/api/users/${currentUser._id}/suggest`, {
        friends: selected,
        resourceType: type,
        resourceTitle: resourceTitle,
      });
      
  
      toast.success(`✅ Suggested to ${selected.length} friend(s)!`);
      navigate(-1);
    } catch (err) {
      console.error("❌ Suggest error:", err);
      toast.error("Failed to send suggestions.");
    }
  };
  
  

  const mutualFollowers = allUsers.filter((u) => {
    const currentUserId = currentUser?._id?.toString();
    const userId = u._id?.toString();
  
    const currentUserFollowing = (currentUser?.following || []).map((id) => id.toString());
    const userFollowing = (u.following || []).map((id) => id.toString());
  
    return (
      userId !== currentUserId &&
      currentUserFollowing.includes(userId) &&
      userFollowing.includes(currentUserId)
    );
  });
  

  if (loading) return <div style={{ padding: 20, color: "#fff", background: "#0e0e0e", minHeight: "100vh" }}>Loading...</div>;

  if (error || !resourceTitle) {
    return (
      <div style={{ padding: 20, color: "#fff", background: "#0e0e0e", minHeight: "100vh" }}>
        <h2 style={{ textAlign: "center" }}>❌ Invalid resource</h2>
        <p style={{ textAlign: "center", color: "#aaa" }}>Something went wrong.</p>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => navigate(-1)} style={{ padding: "8px 16px", borderRadius: 6, background: "#222", color: "#fff", border: "none" }}>← Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, background: "#0e0e0e", minHeight: "100vh", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>
          <FaArrowLeft />
        </button>
        <h2 style={{ flex: 1, textAlign: "center", margin: 0 }}>📤 Share to Friends</h2>
        <button
          onClick={handleSend}
          disabled={selected.length === 0}
          style={{
            background: selected.length === 0 ? "#444" : "#B327F6",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 6,
            cursor: selected.length === 0 ? "not-allowed" : "pointer",
            border: "none",
            fontSize: 14
          }}
        >
          Send
        </button>
      </div>

      {mutualFollowers.length === 0 ? (
        <p style={{ color: "#aaa", textAlign: "center", marginTop: 50 }}>You have no mutual followers yet.</p>
      ) : (
        <div style={{ padding: 0 }}>
          {mutualFollowers.map((u) => (
            <div
              key={u._id}
              onClick={() => toggleSelect(u._id)}
              style={{
                display: "flex",
                alignItems: "center",
                paddingTop: 10,
                paddingBottom: 10,
                paddingRight: 16,
                paddingLeft: 12,        // ➡️ slight indent for avatar
                marginLeft: -20,        // ✅ extend background full left
                width: "100vw",         // ✅ ensure full width
                borderBottom: "1px solid #222",
                cursor: "pointer",
                background: selected.includes(u._id) ? "#2a2a2a" : "transparent",
                boxSizing: "border-box"
              }}                            
            >
              <img src={u.avatar || "/default-avatar.png"} alt="avatar" style={{ width: 36, height: 36, borderRadius: "50%", marginRight: 12 }} />
              <span>@{u.username}</span>
              {selected.includes(u._id) && <span style={{ marginLeft: "auto", fontSize: 16, color: "#a970ff" }}>✔</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
