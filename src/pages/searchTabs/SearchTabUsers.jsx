import React from "react";
import { useNavigate } from "react-router-dom";

export default function SearchTabUsers({ results, onSearch, saveToRecentSearches }) {

  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {results.map((user) => (
        <div
          key={user._id}
          onClick={() => {
            saveToRecentSearches(user.username, "users");
            navigate(`/profile/${user._id}`);
          }}          
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 14px",
            background: "#111",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          <img
            src={user.avatar || "/default-avatar.jpg"}
            alt={user.username}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              objectFit: "cover",
              marginRight: "12px",
            }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              fontFamily: "Inter",
            }}
          >
            {user.username}
          </span>
        </div>
      ))}
    </div>
  );
}
