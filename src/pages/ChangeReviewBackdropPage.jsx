import React, { useState, useEffect, useRef } from "react";
import axios from "../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { backend } from "../config";
import toast from "react-hot-toast"; // make sure you have this imported

export default function ChangeReviewBackdropPage() {
  const { id } = useParams(); // This is the reviewId (logId)
  const navigate = useNavigate();
  const [backdrops, setBackdrops] = useState([]);
  const [selectedBackdrop, setSelectedBackdrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const doneRef = useRef(null);

  useEffect(() => {
    const fetchReviewedMovieBackdrops = async () => {
      try {
        const { data: log } = await axios.get(`${backend}/api/logs/${id}`);
        const movieId = log.movie?.id || log.movie;

        if (!movieId) {
          console.error("No movieId found in this review.");
          setLoading(false);
          return;
        }

        const res = await axios.get(`${backend}/api/movies/${movieId}`);
        const urls = (res.data.backdrops || []).map(
          (b) => `https://image.tmdb.org/t/p/original${b}`
        );
        setBackdrops(urls);
      } catch (err) {
        console.error("Failed to load reviewed movie backdrops:", err);
      }
      setLoading(false);
    };

    fetchReviewedMovieBackdrops();
  }, [id]);

  const handleBackdropSelect = (url) => {
    setSelectedBackdrop(url);
    setTimeout(() => {
      doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };


  const handleSave = async () => {
    if (!selectedBackdrop) return;
    try {
      await axios.patch(`${backend}/api/logs/${id}/backdrop`, {
        backdrop: selectedBackdrop
      });
      toast.success("Backdrop updated successfully!");
      navigate(`/review/${id}`);
    } catch (err) {
      console.error("Failed to update backdrop:", err);
      toast.error("Failed to update backdrop. Please try again.");
    }
  };
  
  

  
  return (
    <div style={{ background: "#0e0e0e", color: "#fff", minHeight: "100vh", padding: "24px", paddingBottom: "140px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "12px"
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Change Backdrop</h1>
      </div>

      {/* Backdrop grid */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        {loading ? (
          <p style={{ color: "#888" }}>Loading backdrops...</p>
        ) : (
          backdrops.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Backdrop ${idx}`}
              onClick={() => handleBackdropSelect(url)}
              style={{
                width: "100%",
                maxWidth: "600px",
                height: "200px",
                objectFit: "cover",
                borderRadius: "10px",
                marginBottom: "20px",
                cursor: "pointer",
                border:
                  selectedBackdrop === url
                    ? "3px solid white"
                    : "1px solid #333",
                transition: "border 0.2s ease",
              }}
            />
          ))
        )}

        <div ref={doneRef}>
          {selectedBackdrop && (
            <button
              onClick={handleSave}
              style={{
                background: "#fff",
                color: "#000",
                padding: "10px 20px",
                fontWeight: "bold",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
                marginTop: "16px",
              }}
            >
              ✅ Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
