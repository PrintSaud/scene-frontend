import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import { backend } from "../config"; // Adjust if you have a backend config export

export default function ShareReviewPage() {
    const { id } = useParams();
    const [review, setReview] = useState(null);
    const navigate = useNavigate();
  
    useEffect(() => {
      axios.get(`${backend}/api/logs/${id}`).then(({ data }) => setReview(data));
    }, [id]);
  
    if (!review) return <div>Loading...</div>;
  
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", padding: 24 }}>
        {/* Beautiful card */}
        <div
          id="share-card"
          style={{
            maxWidth: 400,
            margin: "auto",
            background: "#1e1e1e",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
            position: "relative"
          }}
        >
          <img
            src={review.poster}
            alt="Poster"
            style={{ width: "100%", borderRadius: 8 }}
          />
          <h2 style={{ color: "#fff", marginTop: 12 }}>{review.title}</h2>
          <p style={{ color: "#888" }}>@{review.user?.username}</p>
          <p style={{ color: "#fff", fontSize: 24 }}>⭐ {review.rating}/5</p>
          <p style={{ color: "#ddd", fontStyle: "italic" }}>{review.review}</p>
  
          {/* Scene logo maybe bottom right */}
          <div style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            fontSize: 12,
            color: "#888"
          }}>
            shared from Scene 🎬
          </div>
        </div>
  
        {/* Download button */}
        <button
          style={{
            marginTop: 24,
            background: "#B327F6",
            border: "none",
            borderRadius: 8,
            padding: "12px 20px",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer"
          }}
          onClick={handleDownload}
        >
          Save Image
        </button>
      </div>
    );
  
    function handleDownload() {
      import("html2canvas").then(html2canvas => {
        html2canvas.default(document.querySelector("#share-card")).then(canvas => {
          const link = document.createElement("a");
          link.download = "scene-review.png";
          link.href = canvas.toDataURL();
          link.click();
        });
      });
    }
  }
  