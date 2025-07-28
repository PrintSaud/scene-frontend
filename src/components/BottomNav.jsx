import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Bot, Bell, User } from "lucide-react";
import { useNotification } from "../context/NotificationContext"; // ✅ Import context

const navItems = [
  { icon: Home, route: "/", label: "Home" },
  { icon: Search, route: "/search", label: "Search" },
  { icon: Bot, route: "/scenebot", label: "SceneBot" },
  { icon: Bell, route: "/notifications", label: "Notifications" },
  { icon: User, route: "/profile", label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotification(); // ✅ Live count from context

  const hiddenRoutes = ["/upload-avatar"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  const showDot = unreadCount > 0 && location.pathname !== "/notifications";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        zIndex: 50,
        background: "rgba(12, 12, 12, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: "70px",
          padding: "0 12px",
        }}
      >
        {navItems.map(({ icon: Icon, route }, index) => {
          const isActive = location.pathname === route;

          return (
            <button
              key={index}
              onClick={() => navigate(route)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: isActive ? "#ffffff" : "#888888",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {route === "/notifications" ? (
                <div style={{ position: "relative" }}>
                  <Bell size={26} strokeWidth={isActive ? 2.4 : 1.8} />
                  {showDot && (
  <div
    style={{
      position: "absolute",
      top: -4,
      right: -4,
      width: 12,
      height: 12,
      backgroundColor: "#a855f7", // Scene purple
      borderRadius: "50%",
      boxShadow: "0 0 4px #a855f7", // optional glow for pop
    }}
  />
)}

                </div>
              ) : (
                <Icon size={26} strokeWidth={isActive ? 2.4 : 1.8} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

