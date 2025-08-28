import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { subDays, isBefore, formatDistanceToNowStrict } from "date-fns";
import { FaRegComment } from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";
import StarRating from "../components/StarRating"; // adjust path if needed


export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [feedLogs, setFeedLogs] = useState([]);
  const [dailyMovie, setDailyMovie] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const scrollRef = useRef();
   


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

// ✅ Bulletproof scroll detection (FINAL FIX)
useEffect(() => {
  const container = scrollRef.current;
  if (!container) return;

  const sections = Array.from(container.children);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
          const index = sections.indexOf(entry.target);
          if (index !== -1) {
            setCurrentSection(index);
          }
        }
      });
    },
    {
      root: container,
      threshold: 0.9, // almost fully visible
    }
  );

  sections.forEach((section) => observer.observe(section));

  return () => {
    sections.forEach((section) => observer.unobserve(section));
  };
}, [feedLogs]);

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
    src={
      user?.avatar?.startsWith("http")
        ? user.avatar
        : user?.avatar
        ? `${import.meta.env.VITE_BACKEND_URL}${user.avatar}`
        : "/default-avatar.png"
    }
    alt="Profile"
    onError={(e) => {
      console.warn("❌ Avatar failed to load:", user?.avatar);
      e.target.src = "/default-avatar.png";
    }}
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

{/* 👀 Recent Activities */}
<h2 style={{ marginTop: "50px", fontSize: "22px" }}>
  Recent Activities
</h2>

{feedLogs.length > 0 ? (
  <>
    {(() => {
      // ✅ Deduplicate by (userId + movieId), keep latest log
      const seen = new Set();
      const uniqueFeedLogs = [];

      for (const log of feedLogs) {
        const movieId = log.tmdbId || log.movie?.id || log.movie;
        const key = `${log.user._id}-${movieId}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueFeedLogs.push(log);
        }
      }

      return (
        <>
          {/* 🔄 Scroll Sections */}
          <div
            ref={scrollRef}
            style={{
              display: "flex",
              flexDirection: "row",
              overflowX: "scroll",
              scrollSnapType: "x mandatory",
              gap: "24px",
              padding: "12px 0 8px 0",
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {[0, 6, 12].map((start, i) => (
              <div
                key={i}
                style={{
                  flex: "0 0 100%",
                  scrollSnapAlign: "start",
                  padding: "0px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="scroll-section"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", // ✅ responsive grid
                    gap: "12px", // ✅ spacing
                    justifyItems: "center", // ✅ center cards
                  }}
                >
                  {uniqueFeedLogs.slice(start, start + 6).map((log) => {
                    const id = log.tmdbId || log.movie?.id || log.movie;
                    const customPoster = log.posterOverride;
                    const fallback = log.movie?.poster_path
                      ? `${TMDB_IMG}${log.movie.poster_path}`
                      : "/default-poster.jpg";
                    const posterUrl = customPoster || fallback;

                    const hasReview =
                      log.review && log.review.trim().length > 0;
                    const timestamp = formatDistanceToNowStrict(
                      new Date(log.createdAt),
                      { addSuffix: true }
                    );

                    return (
                      <div
                        key={log._id}
                        onClick={() =>
                          navigate(
                            hasReview ? `/review/${log._id}` : `/movie/${id}`
                          )
                        }
                        style={{
                          position: "relative",
                          cursor: "pointer",
                          width: "100%",
                          maxWidth: "130px", // ✅ consistent cap
                        }}
                      >
                        {/* 🕒 Timestamp */}
                        <div
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            padding: "2px 6px",
                            fontSize: "10px",
                            borderRadius: "8px",
                            color: "#ccc",
                            zIndex: 2,
                          }}
                        >
                          {timestamp}
                        </div>

                        {/* Poster */}
                        <img
                          src={posterUrl}
                          alt={log.title}
                          style={{
                            width: "100%",
                            height: "170px",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                          onError={(e) =>
                            (e.currentTarget.src = "/default-poster.jpg")
                          }
                        />

                        {/* Avatar + Username */}
                        <div
                          style={{
                            marginTop: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <img
                            src={
                              log.user?.avatar?.startsWith("http")
                                ? log.user.avatar
                                : log.user?.avatar
                                ? `${import.meta.env.VITE_BACKEND_URL}${log.user.avatar}`
                                : "/default-avatar.png"
                            }
                            alt="avatar"
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <p style={{ fontSize: "12px", margin: 0 }}>
                            {log.user?.username}
                          </p>
                        </div>

                        {/* Rating + Icons */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "2px",
                            fontSize: "11px",
                            color: "#aaa",
                          }}
                        >
                          <StarRating rating={log.rating} size={12} />
                          {hasReview && (
                            <FaRegComment
                              size={9}
                              style={{ position: "relative", top: "-1.0px" }}
                            />
                          )}
                          {log.rewatchCount > 0 && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                            
                              }}
                            >
                              <HiOutlineRefresh
                                size={11}
                                style={{
                                  position: "relative",
                                  top: "-1.5px",
                                }}
                              />
                              <span
                                style={{                       fontSize: "10px",
                                  color: "#aaa",
                                  position: "relative",
                                  top: "-1.5px", }}
                              >
                                {log.rewatchCount}x
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 🎯 Scene Dot Indicators */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "14px",
              marginBottom: "24px",
              padding: "0 16px",
            }}
          >
            {[0, 1, 2].map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: currentSection === idx ? "100%" : "30px",
                  maxWidth: currentSection === idx ? "120px" : "30px",
                  height: "6px",
                  borderRadius: "999px",
                  background: currentSection === idx ? "#a855f7" : "#555",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </>
      );
    })()}
  </>
) : (
  <p style={{ color: "#888", marginTop: "20px" }}>No recent logs yet.</p>
)}



{/* 🔥 Trending */}
<h2 style={{ marginTop: "40px", fontSize: "22px" }}>
  🔥 Trending Movies
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
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px",
    padding: "6px 0",
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
          width: "100%",
          aspectRatio: "2 / 3",
          objectFit: "cover",
          borderRadius: "6px",
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
