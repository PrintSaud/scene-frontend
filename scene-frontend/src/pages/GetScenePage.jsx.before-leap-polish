import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const APP_STORE_URL =
  "https://apps.apple.com/sa/app/scene-movie-tv/id6753978530";

export default function GetScenePage() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user")
      );
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    document.body.classList.add(
      "hide-navbar"
    );

    return () => {
      document.body.classList.remove(
        "hide-navbar"
      );
    };
  }, []);

  const platform = useMemo(() => {
    const ua =
      navigator.userAgent || "";

    if (
      /iPhone|iPad|iPod/i.test(ua)
    ) {
      return "ios";
    }

    if (
      /Android/i.test(ua)
    ) {
      return "android";
    }

    return "desktop";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "52px",
            marginBottom: "14px",
          }}
        >
          🎬
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            lineHeight: 1.15,
          }}
        >
          Your Scene account is ready.
        </h1>

        <p
          style={{
            color: "#9a9aa2",
            fontSize: "16px",
            lineHeight: 1.65,
            margin:
              "16px auto 28px",
          }}
        >
          {user?.username
            ? `Welcome, @${user.username}. `
            : ""}
          Thanks for joining Scene.
        </p>

        <div
          style={{
            background:
              "rgba(255,255,255,0.035)",
            border:
              "1px solid rgba(255,255,255,0.09)",
            borderRadius: "18px",
            padding: "22px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "10px",
            }}
          >
            🍎
          </div>

          <h2
            style={{
              margin:
                "0 0 8px",
              fontSize: "20px",
            }}
          >
            Using an iPhone?
          </h2>

          <p
            style={{
              color: "#aaa",
              fontSize: "14px",
              lineHeight: 1.55,
              margin:
                "0 0 18px",
            }}
          >
            Scene is available now on
            iOS. Download the app and
            log in with the account you
            just created.
          </p>

          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              padding:
                "13px 18px",
              borderRadius: "12px",
              background: "#B327F6",
              color: "#fff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "15px",
            }}
          >
            Download on the App Store
          </a>
        </div>

        <div
          style={{
            background:
              "rgba(255,255,255,0.025)",
            border:
              "1px solid rgba(255,255,255,0.07)",
            borderRadius: "18px",
            padding: "22px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "10px",
            }}
          >
            🤖
          </div>

          <h2
            style={{
              margin:
                "0 0 8px",
              fontSize: "20px",
            }}
          >
            Using Android?
          </h2>

          <p
            style={{
              color: "#aaa",
              fontSize: "14px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Scene for Android is
            currently under Google Play
            review. Your account is
            ready, and we'll personally
            email you with the download
            link as soon as it is
            released.
          </p>

          <div
            style={{
              marginTop: "16px",
              color: "#777",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            Coming soon on Google Play
          </div>
        </div>

        {platform === "android" && (
          <p
            style={{
              color: "#B327F6",
              marginTop: "18px",
              fontSize: "13px",
            }}
          >
            We detected an Android
            device — you're all set.
            We'll email you when Scene
            is live.
          </p>
        )}

        {platform === "ios" && (
          <p
            style={{
              color: "#B327F6",
              marginTop: "18px",
              fontSize: "13px",
            }}
          >
            You're on iOS — Scene is
            available now.
          </p>
        )}

        <p
          style={{
            color: "#666",
            marginTop: "24px",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          Thanks for joining us.
          <br />
          See you inside Scene 🎬
        </p>
      </div>
    </div>
  );
}
