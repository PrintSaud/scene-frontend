import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function PublicRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  // ✅ Only redirect if user AND they're not on /login or /signup
  const publicPaths = ["/login", "/signup", "/forgot-password"];
  const isTryingToAccessAuthPage = publicPaths.includes(location.pathname);

  if (user && !isTryingToAccessAuthPage) {
    return <Navigate to="/home" />;
  }

  return children;
}
