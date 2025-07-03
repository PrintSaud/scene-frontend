import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/api";
import { actorAwards, directorAwards } from "../data/awardsData";
import { saudiTalent } from "../data/saudiTalent";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_POSTER = "https://image.tmdb.org/t/p/w300";

export default function DirectorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [director, setDirector] = useState(null);
  const [movies, setMovies] = useState([]);
  const [showFullBio, setShowFullBio] = useState(false);

  const getAwards = (name = "") => {
    const normalized = name.trim().toLowerCase();
    const directAward = Object.keys(directorAwards).find(
      (k) => k.toLowerCase() === normalized
    );
    if (directAward) return directorAwards[directAward];

    const saudiAward = Object.keys(saudiTalent.directors).find(
      (k) => k.toLowerCase() === normalized
    );
    if (saudiAward) return saudiTalent.directors[saudiAward];

    return `🏆 ${name} may have awards – check IMDb for more`;
  };

  useEffect(() => {
    const fetchDirector = async () => {
      try {
        const [detailsRes, creditsRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/person/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`),
          axios.get(`https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
        ]);

        setDirector(detailsRes.data);

        const directed = creditsRes.data.crew
          .filter((c) => c.job === "Director" && c.poster_path)
          .sort((a, b) => b.popularity - a.popularity);

        setMovies(directed);
      } catch (err) {
        console.error("Failed to fetch director:", err);
      }
    };

    fetchDirector();
  }, [id]);

  const toggleBio = () => setShowFullBio((prev) => !prev);

  const isSaudi = director?.name &&
    Object.keys(saudiTalent.directors).some(
      (name) => name.toLowerCase() === director.name.toLowerCase()
    );

  if (!director) {
    return (
      <div style={{ padding: "20px", background: "#000", color: "#fff", minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: "#000",
      color: "#fff",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        paddingBottom: "80px" // keeps bottom content visible above nav
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: "20px",
            color: "#fff",
            background: "none",
            border: "none",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
          <img
            src={director.profile_path ? TMDB_IMG + director.profile_path : "/default-avatar.png"}
            alt={director.name}
            style={{
              width: "100px",
              height: "130px",
              objectFit: "cover",
              borderRadius: "12px",
            }}
          />
          <div>
            <h2 style={{
              fontSize: "22px",
              fontWeight: "bold",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center"
            }}>
              {director.name}
              {isSaudi && (
                <img
                  src="/saudi-icon.png"
                  alt="Saudi Talent"
                  style={{ width: "32px", marginLeft: "8px", verticalAlign: "middle" }}
                />
              )}
            </h2>
            <p style={{ fontSize: "14px", color: "#aaa" }}>{getAwards(director.name)}</p>
          </div>
        </div>

        <div style={{ marginBottom: "24px", lineHeight: "1.6", fontSize: "14px" }}>
          {director.biography ? (
            <>
              <p style={{
                display: "-webkit-box",
                WebkitLineClamp: showFullBio ? "none" : "4",
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>
                {director.biography}
              </p>
              {director.biography.length > 300 && (
                <button
                  onClick={toggleBio}
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    background: "none",
                    color: "#1db954",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {showFullBio ? "Show less" : "Read more"}
                </button>
              )}
            </>
          ) : (
            <p>No biography available.</p>
          )}
        </div>

        <h3 style={{ marginTop: "30px", fontSize: "16px" }}>All Films</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginTop: "12px"
        }}>
          {movies.map((movie) => (
            <img
              key={movie.id}
              src={movie.poster_path ? TMDB_POSTER + movie.poster_path : "/default-poster.png"}
              alt={movie.title}
              style={{ width: "100%", borderRadius: "6px", cursor: "pointer" }}
              onClick={() => navigate(`/movie/${movie.id}`)}
            />
          ))}
        </div>

        {isSaudi && (
          <div style={{
            marginTop: "40px",
            fontSize: "13px",
            color: "#aaa",
            textAlign: "center",
            lineHeight: "1.6"
          }}>
<p>
  🇸🇦 <strong>Scene</strong> proudly celebrates Saudi Arabia’s growing film legacy.<br />
  As the founder, I created Scene to help elevate Saudi cinema, inspire a new generation of filmmakers, <br />
  and spotlight local talent shaping the kingdom’s cinematic future.
</p>

          </div>
        )}
      </div>
    </div>
  );
}
