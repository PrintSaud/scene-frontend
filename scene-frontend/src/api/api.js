import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL?.trim(),
});


// ✅ Automatically add token only when needed
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  // 🔐 Skip adding token for public auth routes
  const isPublicAuthRoute =
    config.url.includes("/auth/login") ||
    config.url.includes("/auth/signup") ||
    config.url.includes("/auth/forgot-password") ||
    config.url.includes("/auth/reset-password");

  if (!isPublicAuthRoute && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


//
// 🧠 AUTH
//
export const login = (data) => api.post("/api/auth/login", data);
export const signup = (data) => api.post("/api/auth/register", data);
export const getMe = () => api.get("/api/auth/me");
export const logout = () => api.post("/api/auth/logout");

//
// 🎞️ LOGS (Reviews / Ratings / Replies / Reactions)
//
export const createLog = (data) => {
  const user = JSON.parse(localStorage.getItem("user"));
  return api.post("/api/logs/full", data);
};
export const getRepliesForLog = (logId) =>
    api.get(`/api/logs/${logId}/replies`).then((res) => res.data);
  
export const getLogsFeed = () => api.get("/api/logs/feed");
export const getLogById = (logId) => api.get(`/api/logs/${logId}`);
export const addLogReply = (logId, data) => api.post(`/api/logs/${logId}/reply`, data);
export const reactToLog = (logId, emoji) => api.post(`/api/logs/${logId}/react`, { emoji });
export const deleteReply = (logId, replyId) => api.delete(`/api/logs/${logId}/replies/${replyId}`);

export const suggestMovieToFriends = (recipientId, fromUserId, movieId) =>
  api.post(`/api/users/${recipientId}/notify/share`, {
    fromUserId,
    movieId
  });
  export const suggestReviewToFriends = (reviewId, recipients) =>
    api.post(`/api/logs/${reviewId}/share`, { recipients });
  

// Likes for reviews/logs
export const likeLog = (logId) => api.post(`/api/logs/${logId}/like`);

export const deleteLog = (logId) => api.delete(`/api/logs/${logId}`);
export const editLog = (logId, data) => api.patch(`/api/logs/${logId}`, data);



// Likes for replies
export const likeReply = (logId, replyId) => api.post(`/api/logs/${logId}/replies/${replyId}/like`);

//
// 📋 WATCHLIST
//
export const getWatchlistStatus = (movieId) => api.get(`/api/watchlist/status/${movieId}`);
export const toggleWatchlist = (movieId) => api.post(`/api/watchlist/toggle`, { movieId });
export const getWatchlist = (userId) => api.get(`/api/watchlist/${userId}`);

//
// 📚 LISTS
//

// 📚 LISTS
export const getUserLists = (userId) => api.get(`/api/lists/user/${userId}`);
export const createList = (data) => api.post("/api/lists", data);
export const editList = (listId, data) => api.patch(`/api/lists/${listId}`, data);
export const deleteList = (listId) => api.delete(`/api/lists/${listId}`);
export const getListById = (listId) => api.get(`/api/lists/${listId}`);
export const getMyLists = () => api.get("/api/lists/my");
export const getSavedLists = () => api.get("/api/lists/saved");
export const getPopularLists = () => api.get("/api/lists/popular");
export const getFriendsLists = () => api.get("/api/lists/friends");
export const toggleSaveList = (listId) => api.post(`/api/lists/${listId}/save`);
export const likeList = (listId) => api.post(`/api/lists/${listId}/like`);
export const suggestListToFriends = (listId, recipients) =>
  api.post(`/api/lists/${listId}/share`, { recipients });

//
// 🖼️ POSTERS
//
// api.js
export const getCustomPostersBatch = async (userId, movieIds) => {
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const res = await api.post(
    "/api/posters/batch",
    { userId, movieIds },   // ✅ match backend
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};


//
// 🗳️ POLLS
//
export const getPolls = () => api.get("/api/polls");
export const votePoll = (pollId, choice) => api.post(`/api/polls/${pollId}/vote`, { choice });

//
// 🔔 NOTIFICATIONS
//
export const getNotifications = () => api.get("/api/notifications");
export const markAllNotificationsRead = () => api.patch("/api/notifications/markAll");
export const markNotificationRead = (id) => api.patch(`/api/notifications/${id}/read`);
export const deleteNotification = (id) => api.delete(`/api/notifications/${id}`);

//
// 🤖 SCENEBOT
//
export const sceneBotAsk = (message) => api.post("/api/scenebot", { message });

//
// 🎬 MOVIE EXTRAS (Change Poster, Backdrop, etc.)
//
export const changePoster = (movieId, { posterUrl }) => api.post(`/api/posters/${movieId}`, { posterUrl });
export const updateBackdrop = (userId, backdropUrl) => api.patch(`/api/users/${userId}/backdrop`, { backdrop: backdropUrl });

//
// 🧑‍🤝‍🧑 USER
//
export const getUserProfile = (userId) => api.get(`/api/users/${userId}`);
export const followUser = (userId, targetId) => api.post(`/api/users/${userId}/follow/${targetId}`);
export const updateProfile = (userId, data) => api.patch(`/api/users/${userId}`, data);

//
// 🔍 SEARCH
//
export const searchMoviesByTitle = (query) => api.get(`/api/movies/search?q=${query}`);

export default api;
