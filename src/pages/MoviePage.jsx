import { useEffect, useState } from "react";
import axios from 'axios';
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { toast } from "react-hot-toast";
import LogModal from "../components/modals/LogModal"; // update path if different
import { backend } from "../config";
import { getWatchlistStatus } from "../api/api";
import ListPickerModal from "../components/lists/ListPickerModal";
import { useSearchParams } from "react-router-dom";
import StarRating from "../components/StarRating"; // adjust path if needed
import { FaRegComment } from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

// Components
import MovieTopBar from "../components/movie/MovieTopBar";
import MovieHeader from "../components/movie/MovieHeader";
import MovieTabs from "../components/movie/MovieTabs";
import MovieTrailer from "../components/movie/MovieTrailer";
import ChangePosterModal from "../components/movie/ChangePosterModal";
import AddMovieModal from "../components/lists/AddMovieModal";

export default function MoviePage() {

  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("edit") === "1";
  const editLogId = searchParams.get("logId");


  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [providers, setProviders] = useState({});
  const [selectedRegion, setSelectedRegion] = useState("SA");
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [posterOverride, setPosterOverride] = useState(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [activeTab, setActiveTab] = useState("watch");
  const [friendLogs, setFriendLogs] = useState([]);
  const [popularReviews, setPopularReviews] = useState([]);
  const [scrollReady, setScrollReady] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);


  const getRelativeTime = (date) => {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = now - then;
  
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
  
    if (min < 1) return "Just now";
    if (min < 60) return `${min}min ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day <= 7) return `${day}d ago`;
  
    const d = new Date(date);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };
  

  
  useEffect(() => {
    const fetchPopularReviews = async () => {
      try {
        const { data } = await api.get(`/api/logs/movie/${id}/popular`);
        setPopularReviews(data);
      } catch (err) {
        console.error("Failed to fetch popular reviews:", err);
      }
    };
  
    fetchPopularReviews();
  }, [id]);
  
  const handleLikeReview = async (reviewId) => {
    try {
      await api.post(`/api/reviews/${reviewId}/like`);
      setPopularReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                likes: r.likes.includes(userId)
                  ? r.likes.filter((id) => id !== userId)
                  : [...r.likes, userId],
              }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to like review:", err);
    }
  };
  
  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/api/reviews/${reviewId}`);
      setPopularReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };
  
useEffect(() => {
  if (editMode && editLogId) {
    setShowLogModal(true);
  }
}, [editMode, editLogId]);


  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const TMDB_IMG = "https://image.tmdb.org/t/p/original";
  const TMDB_AVATAR = "https://image.tmdb.org/t/p/w185";

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  
  const userId = user?._id; // ✅ Now safe
  


  // 🛠 Move this above the useEffect blocks
const fetchLogs = async () => {
  try {
    const res = await api.get(`/api/logs/movie/${id}/friends`);
    setFriendLogs(res.data); // ✅ this was broken — use setFriendLogs not setLogs
  } catch (err) {
    console.error("❌ Failed to fetch movie friends logs", err);
  }
};

// ✅ Leave this only ONCE
useEffect(() => {
  fetchLogs();
}, [id]);

  

  // Scroll after fetch is complete
  useEffect(() => {
    if (scrollReady) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setScrollReady(false);
    }
  }, [scrollReady]);

  // Fetch movie data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const TMDB_BASE = "https://api.themoviedb.org/3";

const [movieRes, creditsRes, videoRes, providersRes] = await Promise.all([
  axios.get(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}&language=en-US`),
  axios.get(`${TMDB_BASE}/movie/${id}/credits?api_key=${TMDB_KEY}&language=en-US`),
  axios.get(`${TMDB_BASE}/movie/${id}/videos?api_key=${TMDB_KEY}&language=en-US`),
  axios.get(`${TMDB_BASE}/movie/${id}/watch/providers?api_key=${TMDB_KEY}`),
]);


        setMovie(movieRes.data);
        setCredits(creditsRes.data);
        setTrailerKey(
          videoRes.data.results.find(v => v.type === "Trailer" && v.site === "YouTube")?.key || null
        );
        setProviders(providersRes.data.results || {});
        setScrollReady(true); // ✅ Trigger scroll after content is ready
      } catch (err) {
        console.error("Failed to fetch movie:", err);
      }
    };

    fetchData();
  }, [id]);
  
  useEffect(() => {
    if (editMode && editLogId) {
      setShowLogModal(true);
    }
  }, [editMode, editLogId]);
  

  useEffect(() => {
    if (!movie?.id) return;
    const token = localStorage.getItem("token");
    getWatchlistStatus(movie.id)
      .then((res) => setIsInWatchlist(res.data.inWatchlist))
      .catch(() => {});
  }, [movie]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100); // Delay a bit for content to be ready
    return () => clearTimeout(timeout);
  }, [id]);
  

  useEffect(() => {
    if (!movie?.id) return;
  
    const fetchPoster = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?._id;
        if (!userId) return;
  
        const { data } = await axios.get(`${backend}/api/posters/${movie.id}?userId=${userId}`);
        if (data?.posterOverride) {
          setPosterOverride(data.posterOverride);
        } else {
          setPosterOverride(null);
        }
      } catch (err) {
        setPosterOverride(null);
        console.warn("Custom poster fetch failed on MoviePage:", err);
      }
    };
  
    fetchPoster();
  }, [movie]);
  

  useEffect(() => {
    const region = Intl.DateTimeFormat().resolvedOptions().locale.split("-")[1];
    if (region && providers[region]) {
      setSelectedRegion(region);
    }
  }, [providers]);

  if (!movie || !credits) {
    return (
      <div style={{ color: "#fff", textAlign: "center", paddingTop: "100px" }}>
        <p>Loading movie...</p>
      </div>
    );
  }

  const director = credits.crew.find((p) => p.job === "Director");
  const starring = credits.cast.slice(0, 4);

  return (
<div
  style={{
    minHeight: '100vh',
    overflowX: 'hidden',
    backgroundColor: '#0e0e0e',
    paddingBottom: '60px', // for bottom navbar spacing
    color: '#fff'
  }}
>

      <MovieTopBar
        navigate={navigate}
        movie={movie}
        isInWatchlist={isInWatchlist}
        setIsInWatchlist={setIsInWatchlist}
        setShowPosterModal={setShowPosterModal}
        setShowAddToListModal={setShowAddToListModal}
      />

      {/* 🎞 Backdrop */}
      <div style={{ position: "relative", height: "300px", overflow: "hidden" }}>
        <img
          src={TMDB_IMG + movie.backdrop_path}
          alt="Backdrop"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.3), #0e0e0e 90%)",
            zIndex: 2,
          }}
        />
      </div>

      <MovieHeader
        movie={movie}
        posterOverride={posterOverride}
        handleLogClick={() => setShowLogModal(true)}
        handleWatchTrailer={() => {
          if (!trailerKey) return toast.error("No trailer available");
          setShowTrailer(true);
        }}
        handleSceneBotReview={() =>
          navigate("/scenebot", {
            state: {
              autoAsk: `What do you think about "${movie.title}"?`,
            },
          })
        }
      />

      {/* 📖 Overview */}
      <div style={{ marginTop: "10px", padding: "0 24px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Overview</h3>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14.5px", color: "#ddd", lineHeight: "1.7" }}>
          {movie.overview}
        </p>
      </div>

      {/* 🎬 Director & ⭐ Cast */}
      <div style={{ marginTop: "40px", padding: "0 24px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>Director</h3>
        {director ? (
          <div onClick={() => navigate(`/director/${director.id}`)} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "28px" }}>
            <img src={director.profile_path ? TMDB_AVATAR + director.profile_path : "/default-avatar.png"} alt={director.name} style={{ width: "85px", height: "135px", objectFit: "cover", borderRadius: "12px" }} />
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "15px" }}>{director.name}</p>
          </div>
        ) : (
          <p style={{ color: "#888", fontStyle: "italic" }}>No director found</p>
        )}

        <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>Starring</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {starring.map((actor) => (
            <div key={actor.id} onClick={() => navigate(`/actor/${actor.id}`)} style={{ cursor: "pointer", textAlign: "center" }}>
              <img
                src={actor.profile_path ? TMDB_AVATAR + actor.profile_path : "/default-avatar.png"}
                alt={actor.name}
                style={{ width: "75px", height: "135px", objectFit: "cover", borderRadius: "12px" }}
              />
              <p style={{ fontSize: "11.5px", marginTop: "6px", fontWeight: "500" }}>{actor.name}</p>
              <p style={{ fontSize: "10.5px", color: "#aaa" }}>{actor.character}</p>
            </div>
          ))}
        </div>
      </div>

{/* 👀 Watched by Friends */}
<div style={{ marginTop: "24px", padding: "0 24px" }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
    }}
  >
    <h3 style={{ fontSize: "18px" }}>Watched by Friends</h3>

    {friendLogs.length > 0 && (() => {
      const seen = new Set();
      const uniqueCount = friendLogs.filter((log) => {
        if (seen.has(log.user._id)) return false;
        seen.add(log.user._id);
        return true;
      }).length;

      return uniqueCount > 1 ? (
        <button
          onClick={() => navigate(`/movie/${movie.id}/friends`)}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontSize: 14,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          More →
        </button>
      ) : null;
    })()}
  </div>

  {friendLogs.length === 0 ? (
    <p style={{ color: "#888" }}>No friends have logged this film yet.</p>
  ) : (
    (() => {
      const seen = new Set();
      const uniqueLogs = [];

      for (const log of friendLogs) {
        if (!seen.has(log.user._id)) {
          uniqueLogs.push(log);
          seen.add(log.user._id);
        }
      }

      return (
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-start",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {uniqueLogs.slice(0, 5).map((log, index) => {
            const sameUserLogs = friendLogs.filter(
              (l) => l.user._id === log.user._id
            );

            const reviews = sameUserLogs.filter((l) => l.review);
            const hasReview = reviews.length > 0;

            const displayLog =
              sameUserLogs.find((l) => l.rating) ||
              sameUserLogs.find((l) => l.review) ||
              sameUserLogs.find((l) => l.rewatchCount > 0 || l.rewatch > 0) ||
              sameUserLogs[0];

            const hasRating = typeof displayLog.rating === "number";
            const hasRewatch =
              (typeof displayLog.rewatchCount === "number" &&
                displayLog.rewatchCount > 0) ||
              (typeof displayLog.rewatch === "number" &&
                displayLog.rewatch > 0);

            return (
              <div
                key={log._id + index}
                onClick={() => {
                  if (reviews.length === 1) {
                    navigate(`/review/${reviews[0]._id}`);
                  } else if (reviews.length > 1) {
                    navigate(`/movie/${id}/reviews/${log.user._id}`);
                  } else {
                    navigate(`/profile/${log.user._id}`);
                  }
                }}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  width: "56px",
                  fontSize: "11px",
                  color: "#ddd",
                }}
              >
                <img
                  src={
                    log.user?.avatar?.startsWith("http")
                      ? log.user.avatar
                      : "/default-avatar.png"
                  }
                  alt={log.user?.username}
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    marginBottom: "6px",
                  }}
                />

                {/* Icon Row */}
                {hasRating ? (
                  <StarRating rating={displayLog.rating} size={9} />
                ) : hasReview ? (
                  <FaRegComment
                    size={9}
                    color="#aaa"
                    style={{ marginTop: "2px" }}
                  />
                ) : hasRewatch ? (
                  <HiOutlineRefresh
                    size={9}
                    color="#aaa"
                    style={{ marginTop: "2px" }}
                  />
                ) : (
                  <div style={{ height: "9px" }} /> // Spacer fallback
                )}
              </div>
            );
          })}
        </div>
      );
    })()
  )}
</div>

{/* 📝 Popular Reviews */}
<div style={{ marginTop: "30px", padding: "0 24px" }}>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 6,
      marginBottom: 12,
    }}
  >
    <h3 style={{ fontSize: 18, margin: 0 }}>Popular Reviews</h3>
    <button
      onClick={() => navigate(`/movie/${id}/reviews`)}
      style={{
        background: "none",
        border: "none",
        color: "#888",
        fontSize: 14,
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      More →
    </button>
  </div>

  {popularReviews.length === 0 ? (
    <p style={{ color: "#888" }}>No reviews yet.</p>
  ) : (
    popularReviews.slice(0, 3).map((r) => {
      const isLikedByMe = r.likes?.includes(user?._id);
      return (
        <div
          key={r._id}
          style={{
            position: "relative",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid #222",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Avatar */}
            <img
              src={r.user.avatar || "/default-avatar.jpg"}
              alt="avatar"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/profile/${r.user._id}`)}
            />

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {/* Username, stars, time */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    color: "#ddd",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/profile/${r.user._id}`)}
                >
                  @{r.user.username}
                </strong>

                {r.rating && <StarRating rating={r.rating} size={12} />}

                {r.rewatchCount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <HiOutlineRefresh size={12} color="#aaa" />
                    <span style={{ fontSize: 10, color: "#aaa" }}>
                      {r.rewatchCount}x
                    </span>
                  </div>
                )}

                <span style={{ fontSize: 10, color: "#888" }}>
                  {getRelativeTime(r.createdAt)}
                </span>
              </div>

              {/* Review text */}
              {r.review && (
                <span
                  style={{
                    fontSize: 14,
                    color: "#ddd",
                    fontFamily: "Inter, sans-serif",
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {r.review}
                </span>
              )}

              {/* Optional gif/image */}
              {r.gif && (
                <img
                  src={r.gif}
                  alt="gif"
                  style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                />
              )}
              {r.image && (
                <img
                  src={r.image}
                  alt="img"
                  style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                />
              )}

              {/* Reply + Delete */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                <button
                  onClick={() =>
                    navigate(`/replies/${r._id}`, {
                      state: { parentCommentId: r._id, parentUsername: r.user.username },
                    })
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Reply
                </button>
              </div>
            </div>

            {/* Like */}
            <div
              onClick={() => handleLikeReview(r._id)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {isLikedByMe ? (
                <AiFillHeart size={16} color="#B327F6" />
              ) : (
                <AiOutlineHeart size={16} color="#888" />
              )}
              <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
                {r.likes?.length || 0}
              </span>
            </div>
          </div>
        </div>
      );
    })
  )}
</div>


      <MovieTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        credits={credits}
        navigate={navigate}
        movieId={movie.id}
        providers={providers}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        
      />

      {showTrailer && <MovieTrailer trailerKey={trailerKey} setShowTrailer={setShowTrailer} />}

      {showPosterModal && (
        <ChangePosterModal
          movieId={movie.id}
          onClose={() => {
            setShowPosterModal(false);
            window.location.reload();
          }}
        />
      )}

{showAddToListModal && (
  <ListPickerModal
    movie={{
      id: movie.id,
      title: movie.title,
      poster: posterOverride || `${TMDB_IMG}${movie.poster_path}`,
    }}
    onClose={() => setShowAddToListModal(false)}
  />
)}

{showLogModal && (
  <LogModal
    movie={movie}
    editLogId={editLogId}
    onClose={() => {
      setShowLogModal(false);
      navigate(`/movie/${id}`);  // Remove query params when closing
    }}
    refreshLogs={fetchLogs}
  />
)}

    </div>
  );
}
