import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { actorAwards } from "../data/awardsData";
import { saudiTalent } from "../data/saudiTalent";
import { backend } from "../config";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_POSTER = "https://image.tmdb.org/t/p/w300";

// ... imports stay the same

export default function ActorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [actor, setActor] = useState(null);
    const [movies, setMovies] = useState([]);
    const [showFullBio, setShowFullBio] = useState(false);
  
    const getAwards = (name = "") => {
      return (
        saudiTalent.actors[name] ||
        actorAwards[name] ||
        `🏆 ${name} may have awards – check IMDb for more`
      );
    };
  
    useEffect(() => {
      const fetchActor = async () => {
        try {
          const [detailsRes, creditsRes] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/person/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`),
          ]);
  
          setActor(detailsRes.data);
          const sorted = creditsRes.data.cast
            .filter((m) => m.poster_path)
            .sort((a, b) => b.popularity - a.popularity);
          setMovies(sorted);
        } catch (err) {
          console.error("Failed to fetch actor:", err);
        }
      };
  
      fetchActor();
    }, [id]);
  
    const toggleBio = () => setShowFullBio((prev) => !prev);
    const isSaudiTalent = actor?.name && Object.keys(saudiTalent.actors).includes(actor.name);
  
    if (!actor) {
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
          paddingBottom: "80px" // keeps content above nav
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginBottom: "20px",
              color: "#fff",
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
  
          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
            <img
              src={actor.profile_path ? TMDB_IMG + actor.profile_path : "/default-avatar.png"}
              alt={actor.name}
              style={{
                width: "100px",
                height: "130px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "6px", display: "flex", alignItems: "center" }}>
                {actor.name}
                {isSaudiTalent && (
                  <img
                    src="/saudi-icon.png"
                    alt="Saudi Talent"
                    style={{ width: "32px", marginLeft: "8px", verticalAlign: "middle" }}
                  />
                )}
              </h2>
              <p style={{ fontSize: "14px", color: "#aaa" }}>{getAwards(actor.name)}</p>
            </div>
          </div>
  
          <div style={{ marginBottom: "24px", lineHeight: "1.6", fontSize: "14px" }}>
            {actor.biography ? (
              <>
                <p
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: showFullBio ? "none" : "4",
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontFamily: "Inter, sans-serif",
                  }}
                > 
                  {actor.biography}
                </p>
                {actor.biography.length > 300 && (
                  <button
                    onClick={toggleBio}
                    style={{
                      marginTop: "6px",
                      fontSize: "13px",
                      background: "none",
                      fontFamily: "Inter, sans-serif",
                      color: "#1db954",
                      border: "none",
                      cursor: "pointer",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            {movies.map((movie) => (
              <img
                key={movie.id}
                src={
                  movie.poster_path
                    ? TMDB_POSTER + movie.poster_path
                    : "/default-poster.png"
                }
                alt={movie.title}
                style={{ width: "100%", borderRadius: "6px", cursor: "pointer" }}
                onClick={() => navigate(`/movie/${movie.id}`)}
              />
            ))}
          </div>
  
          {isSaudiTalent && (
            <div
              style={{
                marginTop: "40px",
                fontSize: "13px",
                color: "#aaa",
                textAlign: "center",
                lineHeight: "1.6",
              }}
            >
                  <p style={{ marginTop: "18px", direction: "rtl", textAlign: "center" }}>
  نحتفي ونفخر بإرث السعودية السينمائي المتنامي.<br />
    كمؤسس للمنصة، أنشأت Scene على أمل أن نسهم في نمو السينما السعودية،<br />
    وأن نلهم الآخرين وتُسلّط الضوء على المواهب المحلية التي تُشكّل مستقبل المملكة على الشاشة.
  </p>

<div style={{ marginTop: "10px", fontSize: "13px", color: "#aaa", textAlign: "center", lineHeight: "1.6" }}>
  <p>
    We proudly celebrates Saudi Arabia’s growing film legacy.<br />
    As the founder, I created Scene to help grow Saudi cinema and to inspire and spotlight local talent,<br />
    honoring the visions that are shaping the kingdom’s cinematic future. 🇸🇦
  </p>
</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  