import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { socket } from './socket'; // ✅ Socket.IO
import CreateListPage from "./pages/CreateListPage";
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import { getNotifications } from "./api/api";

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetCode from "./pages/VerifyResetCode";
import ResetPassword from "./pages/ResetPassword";
import LogModal from "./components/modals/LogModal";
import UploadAvatar from "./pages/UploadAvatar";
import FriendsActivityPage from "./pages/FriendsActivityPage";
import TrendingPage from "./pages/TrendingPage";
import SearchPage from './pages/SearchPage';
import ProfilePage from "./pages/ProfilePage";
import ReviewPage from "./components/review/ReviewPage";
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
import UploadAvatarPage from './pages/UploadAvatarPage';
import FilmReviewsPage from "./pages/FilmReviewsPage"; // ✅ check the correct relative path!
import ShareListPage from './pages/ShareListPage';
import RepliesPage from "./components/review/RepliesPage";
import ChangeReviewBackdropPage from "./pages/ChangeReviewBackdropPage";
import ShareReviewPage from "./pages/ShareReviewPage";
import ImportPage from "./pages/ImportPage";

function App() {
  const location = useLocation();
  const [hasUnreadCount, setHasUnreadCount] = useState(0);

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
        const res = await getNotifications(); // ✅ keep this
console.log("✅ Token test:", user?.token);
const unread = res.data.notifications?.filter((n) => !n.read) || [];
setHasUnreadCount(unread.length);

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
      setHasUnreadCount((prev) => prev + 1);
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

  const shouldShowNav = !(
    hideNavRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/share')
  ) && user;
  

  return (
    <div style={{ overflowX: "hidden", width: "100%", maxWidth: "100vw" }}>
      <Toaster position="top-right" />
      <div className="min-h-screen pb-16 bg-[#0e0e0e]">
        <Routes>
        <Route
  path="/login"
  element={
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  }
/>

<Route
  path="/signup"
  element={
    <PublicRoute>
      <SignupPage />
    </PublicRoute>
  } 
  ></Route>
  <Route
  path="/"
  element={
    <PrivateRoute>
      <HomePage />
    </PrivateRoute>
  }
/>

<Route
  path="/home"
  element={
    <PrivateRoute>
      <HomePage />
    </PrivateRoute>
  }
/>

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyResetCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/choose-avatar" element={<UploadAvatar />} />
          <Route path="/friends-activity" element={<FriendsActivityPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/profile/" element={<ProfilePage />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route path="/film-reviews/:movieId/:userId" element={<FilmReviewsPage />} />
          <Route path="/replies/:id" element={<RepliesPage />} />
          <Route path="/review/:id/change-backdrop" element={<ChangeReviewBackdropPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/choose-backdrop" element={<BackdropSearchPage />} />
          <Route path="/avatar-upload-test" element={<AvatarUploadTestPage />} />
          <Route path="/scenebot" element={<SceneBotPage />} />
          <Route path="/notifications" element={<NotificationsPage setHasUnread={setHasUnreadCount} />} />
          <Route path="/create-list" element={<CreateListPage />} />
          <Route path="/list/:id" element={<ListViewPage />} />
          <Route path="/list/:id/edit" element={<EditListPage />} />
          <Route path="/profile/:id/followers" element={<FollowersFollowingPage />} />
          <Route path="/profile/:id/following" element={<FollowersFollowingPage />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/add-to-list/:movieId" element={<AddToListPage />} />
          <Route path="/director/:id" element={<DirectorPage />} />
          <Route path="/actor/:id" element={<ActorPage />} />
          <Route path="/director/:id" element={<PersonPage isDirector={true} />} />
          <Route path="/upload-avatar" element={<UploadAvatarPage />} />
          <Route path="/share-review/:id" element={<ShareReviewPage />} />
          <Route path="/review/:id/replies" element={<RepliesPage />} />
          <Route path="/replies/:id" element={<RepliesPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/log/:logId" element={<LogModal />} />
          <Route path="/share/:type/:id" element={<ShareToFriendPage />} />
        </Routes>
      </div>
      {shouldShowNav && <BottomNav hasUnread={hasUnreadCount} />}
    </div>
  );
}

export default App;
