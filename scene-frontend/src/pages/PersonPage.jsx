// src/pages/PersonPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { actorAwards, directorAwards } from "../data/awardsData";
import getPosterUrl from "../utils/getPosterUrl";

import useTranslate from "../utils/useTranslate";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w300";

export default function PersonPage({ isDirector }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const t = useTranslate();

  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState([]);
  const [showFullBio, setShowFullBio] = useState(false);
  const [localizedName, setLocalizedName] = useState("");

  useEffect(() => {

    const fetchPerson = async () => {
      try {
        const [resEn, resLocal] = await Promise.all([
          axios.get(
            `https://api.themoviedb.org/3/person/${id}?api_key=${TMDB_KEY}&language=en-US`
          ),
          axios.get(
            `https://api.themoviedb.org/3/person/${id}?api_key=${TMDB_KEY}&language=ar-SA`
          ),
        ]);

        setPerson(resEn.data);
        setLocalizedName(resLocal.data.name || "");
      } catch (err) {
        console.error("❌ Failed to fetch person:", err);
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
        console.error("❌ Failed to fetch credits:", err);
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
    return match
      ? source[match]
      : `🏆 ${t("check_imdb")}`;
      
  };

  if (!person) {
    return (
      <div
        style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px" }}
      >
        <p>{t("loading")}</p>
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
      {/* Back */}
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

      {/* Header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}
      >
        <img
          src={
            person.profile_path
              ? TMDB_PROFILE + person.profile_path
              : "/default-avatar.png"
          }
          alt={person.name}
          style={{
            width: "100px",
            height: "130px",
            borderRadius: "12px",
            objectFit: "cover",
          }}
        />
        <div>
          {/* Dual names */}
          <h2 style={{ margin: "0 0 8px", fontWeight: "700", fontSize: "22px" }}>
            {localizedName && localizedName !== person.name
              ? `${localizedName} / ${person.name}`
              : person.name}
          </h2>
          <p style={{ fontSize: "14px", color: "#aaa" }}>{findAward(person.name)}</p>
        </div>
      </div>

      {/* Biography */}
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
                color: "#B327F6", // ✅ purple
                background: "none",
                border: "none",
                fontSize: "13px",
                marginTop: "6px",
                cursor: "pointer",
              }}
            >
              {showFullBio ? t("show_less") : t("read_more")}
            </button>
          )}
        </div>
      )}

      {/* Filmography */}
      <h3 style={{ marginBottom: "12px" }}>
        🎬 {isDirector ? t("all_directed_films") : t("all_films")}
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
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
              src={getPosterUrl(movie.id, movie.poster_path)}
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
