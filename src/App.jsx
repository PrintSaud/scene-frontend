import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { socket } from './socket'; // ✅ Socket.IO
import CreateListPage from "./pages/CreateListPage";

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetCode from "./pages/VerifyResetCode";
import ResetPassword from "./pages/ResetPassword";
import UploadAvatar from "./pages/UploadAvatar";
import FriendsActivityPage from "./pages/FriendsActivityPage";
import TrendingPage from "./pages/TrendingPage";
import SearchPage from './pages/SearchPage';
import ProfilePage from "./pages/ProfilePage";
import ReviewPage from "./pages/ReviewPage";
import BackdropSearchPage from "./pages/BackdropSearchPage";
import AvatarUploadTestPage from "./pages/AvatarUploadTestPage";
import EditProfilePage from "./pages/EditProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import BottomNav from './components/BottomNav';
import SceneBotPage from "./pages/SceneBotPage";
import ListViewPage from "./pages/ListViewPage";
import EditListPage from "./pages/EditListPage";
import FollowersFollowingPage from "./pages/FollowersFollowingPage";
import MoviePage from "./pages/MoviePage";
import AddToListPage from "./pages/AddToListPage";
import ShareToFriendPage from "./pages/ShareToFriendPage";
import DirectorPage from "./pages/DirectorPage";
import ActorPage from "./pages/ActorPage"; 
import PersonPage from "./pages/PersonPage";

function App() {
  const location = useLocation();
  const [hasUnread, setHasUnread] = useState(false);
  const backend = import.meta.env.VITE_BACKEND;

  let user = null;
  try {
    const stored = localStorage.getItem('user');
    user = stored ? JSON.parse(stored) : null;
  } catch {
    user = null;
  }

  // 🔁 Check unread notifications on mount
  useEffect(() => {
    if (!user?.token) return;
    const checkUnread = async () => {
      try {
        const res = await axios.get(`${backend}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setHasUnread(res.data.unreadCount > 0);
      } catch (err) {
        console.error("❌ Failed to check unread notifs:", err);
      }
    };
    checkUnread();
  }, []);

  // 📡 Real-time notifications via Socket.IO
  useEffect(() => {
    if (!user?._id) return;

    socket.connect();
    socket.emit("join", user._id);

    socket.off("notification").on("notification", (notif) => {
      console.log("📩 New real-time notif:", notif);
      setHasUnread(true);
    });

    return () => socket.disconnect();
  }, [user?._id]);

  const hideNavRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/verify-code',
    '/reset-password',
    '/choose-avatar',
  ];
  const shouldShowNav = !hideNavRoutes.includes(location.pathname) && user;

  return (
    <div style={{ overflowX: "hidden", width: "100%", maxWidth: "100vw" }}>
      <Toaster position="top-right" />
      <div className="min-h-screen pb-16 bg-[#0e0e0e]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyResetCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/choose-avatar" element={<UploadAvatar />} />
          <Route path="/friends-activity" element={<FriendsActivityPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/profile/" element={<ProfilePage />} />
          <Route path="/review/:logId" element={<ReviewPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/choose-backdrop" element={<BackdropSearchPage />} />
          <Route path="/avatar-upload-test" element={<AvatarUploadTestPage />} />
          <Route path="/scenebot" element={<SceneBotPage />} />
          <Route path="/notifications" element={<NotificationsPage setHasUnread={setHasUnread} />} />
          <Route path="/create-list" element={<CreateListPage />} />
          <Route path="/list/:id" element={<ListViewPage />} />
          <Route path="/list/:id/edit" element={<EditListPage />} />
          <Route path="/profile/:id/followers" element={<FollowersFollowingPage />} />
          <Route path="/profile/:id/following" element={<FollowersFollowingPage />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/add-to-list/:movieId" element={<AddToListPage />} />
          <Route path="/share/:movieId" element={<ShareToFriendPage />} />
          <Route path="/director/:id" element={<DirectorPage />} />
          <Route path="/actor/:id" element={<ActorPage />} />
          <Route path="/director/:id" element={<PersonPage isDirector={true} />} />
        </Routes>
      </div>
      {shouldShowNav && <BottomNav hasUnread={hasUnread} />}
    </div>
  );
}

export default App;
