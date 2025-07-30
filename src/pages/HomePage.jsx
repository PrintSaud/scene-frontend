import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";


export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [feedLogs, setFeedLogs] = useState([]);
  const [dailyMovie, setDailyMovie] = useState(null);



const TMDB_IMG = "https://image.tmdb.org/t/p/w500";


  useEffect(() => {
    const stored = localStorage.getItem("user");
    let parsedUser;

    try {
      parsedUser = stored ? JSON.parse(stored) : null;
    } catch {
      parsedUser = null;
    }

    if (parsedUser) {
      setUser(parsedUser);
    }
    
  }, []);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );
        const data = await res.json();
        const results = data.results || [];
        setMovies(results);
    
        // ✅ Check daily cache
        const stored = localStorage.getItem("dailyMovie");
        const today = new Date().toDateString();
    
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.date === today) {
            setDailyMovie(parsed.movie);
            return;
          }
        }
    
        // ✅ Filter valid movies
        const eligible = results.filter(
          (m) => m.vote_average >= 7.5 && m.vote_count >= 3000
        );
    
        // ✅ Fallback in case nothing matches
        const fallback = results[Math.floor(Math.random() * results.length)];
    
        const selected = eligible.length
          ? eligible[Math.floor(Math.random() * eligible.length)]
          : fallback;
    
        const daily = {
          id: selected.id,
          title: selected.title,
          poster: `https://image.tmdb.org/t/p/w500${selected.poster_path}`,
          overview: selected.overview,
        };
    
        setDailyMovie(daily);
        localStorage.setItem("dailyMovie", JSON.stringify({ date: today, movie: daily }));
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      }
    }
    

    fetchTrending();
  }, []);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!user?._id) return;
      try {
        const res = await api.get(`/api/logs/feed/${user._id}`);
        setFeedLogs(res.data);
      } catch (err) {
        console.error("🔥 Failed to fetch feed logs:", err);
      }
    };    
    fetchFeed();
  }, [user]);

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#000",
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "18px",
        }}
      >
        Loading your Scenes...
      </div>
    );
  }

  const avatar = user?.avatar?.startsWith("http")
    ? user.avatar
    : user?.avatar
    ? `${import.meta.env.VITE_BACKEND_URL}${user.avatar}`
    : "/default-avatar.png";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px 20px 100px",
        color: "#fff",
        backgroundColor: "#000",
        boxSizing: "border-box",
      }}
    >
      {/* 👋 Welcome Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>Welcome back, {user.username || user.name} 🎬</h1>
        <img
          src={avatar}
          alt="Profile"
          onError={(e) => (e.target.src = "/default-avatar.png")}
          style={{
            borderRadius: "50%",
            marginTop: "20px",
            width: "100px",
            height: "100px",
            objectFit: "cover",
          }}
        />
      </div>

     {/* 🎬 Daily Movie */}
{dailyMovie && (
  <>
<h2 style={{ fontSize: "24px", textAlign: "center", marginBottom: "20px" }}>
New Day. New Amazing Film. It’s a Scene Thing. 🎥
</h2>

    <div
      onClick={() => navigate(`/movie/${dailyMovie.id}`)}
      style={{
        display: "flex",
        backgroundColor: "#111",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <img
        src={dailyMovie.poster}
        alt={dailyMovie.title}
        style={{ width: "150px", height: "220px", objectFit: "cover" }}
      />
      <div style={{ padding: "15px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 8px 0", lineHeight: "1.3" }}>
          {dailyMovie.title}
        </h3>
        <p style={{ fontSize: "12px", color: "#ccc", lineHeight: "1.5", marginBottom: 0 }}>
          {dailyMovie.overview.split(" ").slice(0, 20).join(" ")}...
          <span
            onClick={() => navigate(`/movie/${dailyMovie.id}`)}
            style={{ color: "#aaa", marginLeft: "6px", fontWeight: "500", cursor: "pointer" }}
          >
            Read more
          </span>
        </p>
      </div>
    </div>
  </>
)}


      {/* 👀 Friends Just Watched */}
      <h2 style={{ marginTop: "50px", fontSize: "22px" }}>
      Recent activities
        <span
          onClick={() => navigate("/friends-activity")}
          style={{ float: "right", cursor: "pointer" }}
        >
          More →
        </span>
      </h2>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "12px",
            padding: "1px 10px",
            scrollSnapType: "x mandatory",
          }}
        >
          {feedLogs.slice(0, 12).map((log, index) => (    
            <div
              key={index}
              style={{
                position: "relative",
                minWidth: "65vw",
                maxWidth: "180px",
                background: "#111",
                borderRadius: "10px",
                padding: "10px",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                src={
                  log.customPoster ||
                  log.movie?.poster ||
                  `https://image.tmdb.org/t/p/w500${log.poster_path || ""}` ||
                  "/default-poster.png"
                }
                
                  alt="poster"
                  style={{
                    width: "100%",
                    aspectRatio: "2/3",
                    objectFit: "cover",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    backgroundColor: "#000",
                  }}
                />
                {log.review && (
                  <div style={{ position: "absolute", top: 8, right: 8, fontSize: "18px" }}>
                    📝
                  </div>
                )}
              </div>

              {log.rating && (
                <div style={{ fontSize: "14px", marginTop: "6px" }}>⭐️ {log.rating}</div>
              )}
              <img
                src={log.user?.avatar || "/default-avatar.png"}
                alt="avatar"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  marginTop: "6px",
                }}
              />
              <p style={{ fontSize: "12px", marginTop: "4px" }}>{log.user?.username}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 Trending */}
      <h2 style={{ marginTop: "40px", fontSize: "22px" }}>
        🔥 Trending Films
        <span
          onClick={() => navigate("/trending")}
          style={{ float: "right", cursor: "pointer" }}
        >
          More →
        </span>
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          padding: "2px 0px",
          gap: "18px",
          justifyItems: "center",
        }}
      >
        {Array.isArray(movies) && movies.length > 0 ? (
          movies.slice(0, 8).map((movie) => (
            <img
              key={movie.id}
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : "/default-poster.png"
              }
              alt={movie.title}
              style={{
                width: "170px",
                maxWidth: "200px",
                aspectRatio: "2 / 3",
                height: "300px",
                padding: "6px 0px",
                borderRadius: "10px",
                objectFit: "cover",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              }}
              onClick={() => {
                navigate(`/movie/${movie.id}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center" }}>
            No trending movies right now.
          </p>
        )}
      </div>
    </div>
  );
}
