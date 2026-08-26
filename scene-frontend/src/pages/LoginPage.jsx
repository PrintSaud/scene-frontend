// src/pages/LoginPage.jsx

import { useState } from "react";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { login } from "../api/api";
import { useLanguage } from "../context/LanguageContext";
import "../styles/LoginPage.css";

const TMDB_POSTER_BASE =
  "https://image.tmdb.org/t/p/w342";

const ROW_1 = [
  ["The Dark Knight", "/qJ2tW6WMUDux911r6m7haRef0WH.jpg"],
  ["Interstellar", "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"],
  ["Pulp Fiction", "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg"],
  ["Fight Club", "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"],
  ["Forrest Gump", "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"],
  ["La La Land", "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg"],
  ["Breaking Bad", "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg"],
  ["Stranger Things", "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg"],
  ["Game of Thrones", "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg"],
  ["The Last of Us", "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg"],
];

const ROW_2 = [
  ["The Matrix", "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg"],
  ["Inception", "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"],
  ["Joker", "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"],
  ["Parasite", "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg"],
  ["The Lord of the Rings", "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg"],
  ["Spirited Away", "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg"],
  ["The Office", "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg"],
  ["Better Call Saul", "/fC2HDm5t0kHl7mTm7jxMR31b7by.jpg"],
  ["The Bear", "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg"],
  ["Wednesday", "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg"],
];

const ROW_3 = [
  ["The Godfather", "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"],
  ["Titanic", "/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg"],
  ["Avengers: Endgame", "/or06FN3Dka5tukK1e9sl16pB3iy.jpg"],
  ["Spider-Man: No Way Home", "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg"],
  ["Dune: Part Two", "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"],
  ["Oppenheimer", "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"],
  ["The Boys", "/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg"],
  ["House of the Dragon", "/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg"],
  ["Arcane", "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg"],
  ["Squid Game", "/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg"],
];

function PosterRow({ items, className }) {
  const loop = [...items, ...items];

  return (
    <div className={`scene-login-poster-track ${className}`}>
      {loop.map(([title, poster], index) => (
        <div
          className="scene-login-poster"
          key={`${title}-${index}`}
        >
          <img
            src={`${TMDB_POSTER_BASE}${poster}`}
            alt=""
            draggable="false"
          />
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  const navigate = useNavigate();
  const { setLanguage } = useLanguage();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const res = await login({
        email,
        password,
      });

      const mergedUser = {
        ...res.data.user,
        _id: res.data.user._id,
        token: res.data.token,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(mergedUser)
      );

      setLanguage(
        res.data.user?.language || "en"
      );

      toast.success(
        "Logged in successfully!"
      );

      navigate("/home");
    } catch (err) {
      console.error(
        "Login error:",
        err?.response?.data ||
          err?.message ||
          err
      );

      setError(
        "Login failed. Please check your credentials."
      );

      toast.error("Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="scene-login-page">
      <div className="scene-login-grid" />
      <div className="scene-login-purple-glow scene-login-purple-glow-one" />
      <div className="scene-login-purple-glow scene-login-purple-glow-two" />

      <button
        className="scene-login-back"
        type="button"
        onClick={() => navigate("/")}
        aria-label="Back to Scene"
      >
        <ArrowLeft size={18} />
        <span>Back to Scene</span>
      </button>

      <div
        className="scene-login-poster-wall"
        aria-hidden="true"
      >
        <PosterRow
          items={ROW_1}
          className="scene-login-row-one"
        />

        <PosterRow
          items={ROW_2}
          className="scene-login-row-two"
        />

        <PosterRow
          items={ROW_3}
          className="scene-login-row-three"
        />

        <div className="scene-login-wall-fade" />
      </div>

      <div className="scene-login-layout">
        <section className="scene-login-hero">
          <div className="scene-login-brand">
            <img
              src="/landing/scene-logo.png"
              alt="Scene"
            />
          </div>

          <div className="scene-login-copy">
            <span className="scene-login-eyebrow">
              YOUR WATCHING LIFE
            </span>

            <h1>
              Your watching life,
              <span> all in one place.</span>
            </h1>

            <p>
              Log movies and shows, share reviews,
              track every episode and see what your
              friends are watching.
            </p>
          </div>
        </section>

        <section className="scene-login-panel">
          <div className="scene-login-card">
            <div className="scene-login-card-header">
              <span className="scene-login-card-kicker">
                SCENE
              </span>

              <h2>Welcome back</h2>

              <p>
                Log in to continue your Scene.
              </p>
            </div>

            {error && (
              <div
                className="scene-login-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleLogin}
              className="scene-login-form"
            >
              <label className="scene-login-field">
                <span>Email</span>

                <div className="scene-login-input-wrap">
                  <Mail size={17} />

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <label className="scene-login-field">
                <span>Password</span>

                <div className="scene-login-input-wrap">
                  <Lock size={17} />

                  <input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    autoComplete="current-password"
                    required
                  />
                </div>
              </label>

              <button
                type="button"
                className="scene-login-forgot"
                onClick={() =>
                  navigate("/forgot-password")
                }
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="scene-login-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FaSpinner className="spin" />
                ) : (
                  <>
                    Log in
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="scene-login-divider">
              <span />
              <small>NEW TO SCENE?</small>
              <span />
            </div>

            <button
              className="scene-login-signup"
              type="button"
              onClick={() =>
                navigate("/signup")
              }
            >
              Create your account
            </button>

            <div className="scene-login-support">
              <span>Need help?</span>

              <a href="mailto:support@scenesa.com">
                support@scenesa.com
              </a>
            </div>
          </div>

          <p className="scene-login-bottom-copy">
            Movies · TV · Reviews · Friends · AI
          </p>
        </section>
      </div>
    </main>
  );
}
