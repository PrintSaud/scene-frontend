import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Welcome.css';


const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome">
      <div className="welcome-content">
        <h1 className="scene-logo">
          Scene <span role="img" aria-label="scene-icon">🎭</span>
        </h1>
        <h2 className="welcome-title">Welcome to Scene</h2>
        <p className="welcome-subtitle">Watch. Feel. Share.</p>

        {/* ✅ Here’s the fixed image line */}
        <img src="/images/popcorn-guy.png" alt="Popcorn Guy" className="popcorn-img" />


        <button className="next-btn" onClick={() => navigate('/login')}>
          → NEXT
        </button>
      </div>
    </div>
  );
};

export default Welcome;
