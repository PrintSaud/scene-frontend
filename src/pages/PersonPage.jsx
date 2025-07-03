import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { actorAwards, directorAwards } from "../data/awardsData";
import backend from "../config";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w300";

export default function PersonPage({ isDirector }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;



  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState([]);
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/person/${id}?api_key=${TMDB_KEY}&language=en-US`
        );
        setPerson(res.data);
      } catch (err) {
        console.error("Failed to fetch person:", err);
      }
    };

    const fetchCredits = async () => {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${TMDB_KEY}&language=en-US`
        );
        const items = isDirector
          ? res.data.crew.filter((c) => c.job === "Director")
          : res.data.cast;

        const sorted = items
          .filter((m) => m.poster_path)
          .sort((a, b) => b.popularity - a.popularity);

        setCredits(sorted);
      } catch (err) {
        console.error("Failed to fetch credits:", err);
      }
    };

    fetchPerson();
    fetchCredits();
  }, [id, isDirector]);

  const findAward = (name) => {
    const source = isDirector ? directorAwards : actorAwards;
    const match = Object.keys(source).find(
      (key) => key.toLowerCase() === name?.toLowerCase()
    );
    return match ? source[match] : `🏆 ${name} may have awards – check IMDb for more`;
  };

  if (!person) {
    return (
      <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
        overflowY: "auto",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "18px",
          marginBottom: "20px",
          cursor: "pointer",
        }}
      >
        <FaArrowLeft />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
        <img
          src={person.profile_path ? TMDB_PROFILE + person.profile_path : "/default-avatar.png"}
          alt={person.name}
          style={{
            width: "100px",
            height: "130px",
            borderRadius: "12px",
            objectFit: "cover",
          }}
        />
        <div>
          <h2 style={{ margin: "0 0 8px", fontWeight: "700", fontSize: "22px" }}>
            {person.name}
          </h2>
          <p style={{ fontSize: "14px", color: "#aaa" }}>{findAward(person.name)}</p>
        </div>
      </div>

      {person.biography && (
        <div
          style={{
            marginBottom: "30px",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#ddd",
            maxWidth: "100%",
          }}
        >
          <p
            style={{
              display: "-webkit-box",
              WebkitLineClamp: showFullBio ? "none" : 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {person.biography}
          </p>
          {person.biography.length > 300 && (
            <button
              onClick={() => setShowFullBio(!showFullBio)}
              style={{
                color: "#1db954",
                background: "none",
                border: "none",
                fontSize: "13px",
                marginTop: "6px",
                cursor: "pointer",
              }}
            >
              {showFullBio ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      <h3 style={{ marginBottom: "12px" }}>
        🎬 {isDirector ? "All Directed Films" : "All Films"}
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {credits.map((movie) => (
          <div
            key={movie.id}
            onClick={() => navigate(`/movie/${movie.id}`)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={`${TMDB_IMG}${movie.poster_path}`}
              alt={movie.title}
              style={{
                width: "100%",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
