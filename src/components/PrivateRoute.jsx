// components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  let user = null;

  try {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") {
      user = JSON.parse(stored);
    }
  } catch (err) {
    console.error("❌ Invalid user object in localStorage:", err);
  }

  return user?.token ? children : <Navigate to="/login" />;
}
