import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { backend } from "../config"; // ✅ correct with named export


export default function ShareToFriendPage() {
    const { movieId } = useParams();
  console.log("📦 Movie ID from useParams:", movieId);
  const navigate = useNavigate();
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;


  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [movieTitle, setMovieTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const fetchData = async () => {
        if (!movieId) {
          console.warn("🚫 No movieId found");
          return;
        }
      
        console.log("⚙️ Starting fetchData for movieId:", movieId);
      
        try {
          const stored = localStorage.getItem("user");
          if (!stored) {
            toast.error("Not logged in");
            return;
          }
      
          const storedUser = JSON.parse(stored);
          setCurrentUser(storedUser);
          console.log("👤 Current User:", storedUser);
      
          const usersRes = await axios.get(`${backend}/api/users`);
          setAllUsers(usersRes.data);
          console.log("👥 Users fetched:", usersRes.data.length);
      
          let title = "";
      
          try {
            const res = await axios.get(`${backend}/api/movies/${movieId}`);
            title = res.data.title;
            console.log("✅ Found in DB:", title);
          } catch (dbErr) {
            console.warn("📭 Movie not in DB, fallback to TMDB");
            try {
              const tmdbRes = await axios.get(
                `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`
              );
              console.log("🎬 TMDB Fallback Success:", tmdbRes.data);
              title = tmdbRes.data.title;
            } catch (tmdbErr) {
              console.error("❌ TMDB Fallback Error:", tmdbErr.response || tmdbErr);
              setError(true);
              setLoading(false);
              return;
            }
          }
      
          setMovieTitle(title);
          console.log("🎯 Final Movie Title Set:", title);
          setLoading(false);
        } catch (err) {
          console.error("❌ Outer Catch Error:", err);
          setError(true);
          setLoading(false);
          toast.error("Failed to load movie or users.");
        }
      };
      

    if (movieId) {
      fetchData();
    }
  }, [movieId]);

  const handleSend = async () => {
    try {
      await axios.post(
        `${backend}/api/users/${currentUser._id}/suggest/${movieId}`,
        {
          friends: selected,
          movieTitle,
        }
      );

      await Promise.all(
        selected.map((friendId) =>
          axios.post(`${backend}/api/users/${friendId}/notify/share`, {
            fromUserId: currentUser._id,
            movieTitle,
          })
        )
      );

      toast.success(`✅ Suggested to ${selected.length} friend(s)!`);
      navigate(-1);
    } catch (err) {
      console.error("❌ Suggest error:", err);
      toast.error("Failed to send suggestions.");
    }
  };

  const mutualFollowers = allUsers.filter(
    (u) =>
      u._id !== currentUser?._id &&
      currentUser?.following?.includes(u._id) &&
      u.following?.includes(currentUser._id)
  );

  if (loading) {
    return (
      <div style={{ padding: "20px", color: "#fff", background: "#0e0e0e", minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !movieTitle) {
    return (
      <div style={{ padding: "20px", color: "#fff", background: "#0e0e0e", minHeight: "100vh" }}>
        <h2 style={{ textAlign: "center" }}>❌ Invalid Movie ID</h2>
        <p style={{ textAlign: "center", color: "#aaa" }}>
          Something went wrong. Please return to the movie page and try again.
        </p>
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button onClick={() => navigate(-1)} style={{ padding: "8px 16px", borderRadius: "6px", background: "#222", color: "#fff", border: "none" }}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", background: "#0e0e0e", minHeight: "100vh", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          <FaArrowLeft />
        </button>

        <h2 style={{ flex: 1, textAlign: "center", margin: 0 }}>📤 Share to Friends</h2>

        <button
          onClick={handleSend}
          disabled={selected.length === 0}
          style={{
            background: selected.length === 0 ? "#444" : "#1db954",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "6px",
            cursor: selected.length === 0 ? "not-allowed" : "pointer",
            border: "none",
            fontSize: "14px",
          }}
        >
          Send
        </button>
      </div>

      {mutualFollowers.length === 0 ? (
  <p style={{ color: "#aaa", textAlign: "center", marginTop: "50px" }}>
    You have no mutual followers yet.
  </p>
) : (
  <div style={{ padding: "0 16px" }}>
    {mutualFollowers.map((u) => (
      <div
        key={u._id}
        onClick={() => toggleSelect(u._id)}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 0",
          borderBottom: "1px solid #222",
          cursor: "pointer",
          background: selected.includes(u._id) ? "#222" : "transparent",
        }}
      >
        <img
          src={u.avatar || "/default-avatar.png"}
          alt="avatar"
          style={{ width: "36px", height: "36px", borderRadius: "50%", marginRight: "12px" }}
        />
        <span>@{u.username}</span>
        {selected.includes(u._id) && (
          <span style={{ marginLeft: "auto", fontSize: "16px", color: "#a970ff" }}>✔</span>
        )}
      </div>
    ))}
  </div>
)}

    </div>
  );
}
