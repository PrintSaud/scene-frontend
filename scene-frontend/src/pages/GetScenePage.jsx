import { useEffect, useMemo } from "react";

import "../styles/GetScenePage.css";

const APP_STORE_URL =
  "https://apps.apple.com/";

const hideSceneNavigation = () => {
  const selectors = [
    "nav",
    ".navbar",
    ".bottom-nav",
    ".bottom-navbar",
    ".desktop-navbar",
    ".mobile-navbar",
    ".navigation-bar",
    ".navigation",
    "[data-navbar]",
    "[data-navigation]",
  ];

  const touched = [];

  document.body.classList.add(
    "scene-auth-no-nav"
  );

  selectors.forEach((selector) => {
    document
      .querySelectorAll(selector)
      .forEach((el) => {
        touched.push({
          el,
          display: el.style.display,
        });

        el.style.setProperty(
          "display",
          "none",
          "important"
        );
      });
  });

  return () => {
    document.body.classList.remove(
      "scene-auth-no-nav"
    );

    touched.forEach(
      ({ el, display }) => {
        el.style.display = display;
      }
    );
  };
};

export default function GetScenePage() {
  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user")
      );
    } catch {
      return null;
    }
  }, []);

  const platform = useMemo(() => {
    const ua =
      navigator.userAgent || "";

    if (
      /iPhone|iPad|iPod/i.test(ua)
    ) {
      return "ios";
    }

    if (/Android/i.test(ua)) {
      return "android";
    }

    return "desktop";
  }, []);

  useEffect(() => {
    return hideSceneNavigation();
  }, []);

  return (
    <main className="scene-get-root">
      <section className="scene-get-wrap">
        <div className="scene-get-icon">
          🎬
        </div>

        <h1 className="scene-get-title">
          Your Scene account is ready.
        </h1>

        <p className="scene-get-welcome">
          {user?.username
            ? `Welcome, @${user.username}. `
            : ""}
          Thanks for joining Scene.
        </p>

        <div className="scene-get-card">
          <div className="scene-get-platform-icon">
            🍎
          </div>

          <h2>
            Using an iPhone?
          </h2>

          <p>
            Scene is available now on iOS.
            Download the app and log in with
            the account you just created.
          </p>

          <a
            className="scene-get-ios-button"
            href={APP_STORE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Download on the App Store
          </a>
        </div>

        <div className="scene-get-card">
          <div className="scene-get-platform-icon">
            🤖
          </div>

          <h2>
            Using Android?
          </h2>

          <p>
            Scene for Android is currently
            under Google Play review. Your
            account is ready, and we’ll
            personally email you with the
            download link as soon as it is
            released.
          </p>

          <div className="scene-get-coming">
            Coming soon on Google Play
          </div>
        </div>

        {platform === "ios" && (
          <p className="scene-get-device">
            Scene is available on your device now.
          </p>
        )}

        {platform === "android" && (
          <p className="scene-get-device">
            You’re all set. We’ll email you
            when Scene is live on Google Play.
          </p>
        )}

        <p className="scene-get-footer">
          Thanks for joining us.
          <br />
          See you inside Scene 🎬
        </p>
      </section>
    </main>
  );
}
