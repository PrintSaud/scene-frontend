import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";
import "../styles/VerifyEmailPage.css";

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

  document.body.classList.add("scene-auth-no-nav");

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
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

    touched.forEach(({ el, display }) => {
      el.style.display = display;
    });
  };
};

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("user")
      );
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    return hideSceneNavigation();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((current) =>
        Math.max(current - 1, 0)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    setError("");

    const cleanCode = code.trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Enter a valid 6-digit code.");
      return;
    }

    if (!user?.email) {
      setError(
        "We couldn't find your signup email. Please sign up again."
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post(
        "/api/auth/verify-email-code",
        {
          email: user.email,
          code: cleanCode,
        }
      );

      if (
        res.data?.user &&
        res.data?.token
      ) {
        const fullUser = {
          ...res.data.user,
          token: res.data.token,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(fullUser)
        );

        localStorage.setItem(
          "token",
          res.data.token
        );
      } else {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...user,
            isVerified: true,
            emailVerified: true,
          })
        );
      }

      toast.success(
        "Welcome to Scene! 🎬"
      );

      navigate(
        "/get-scene",
        { replace: true }
      );
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Verification failed.";

      setError(message);

      toast.error(
        "Verification failed. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (
      resending ||
      cooldown > 0
    ) {
      return;
    }

    if (!user?.email) {
      setError(
        "We couldn't find your signup email. Please sign up again."
      );
      return;
    }

    setResending(true);
    setError("");

    try {
      await api.post(
        "/api/auth/resend-email-code",
        {
          email: user.email,
        }
      );

      setCooldown(30);

      toast.success(
        "New code sent to your inbox!"
      );
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Could not resend code.";

      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="scene-verify-root">
      <section className="scene-verify-card">
        <h1 className="scene-verify-title">
          Verify Your Email
        </h1>

        <p className="scene-verify-instructions">
          We’ve sent a 6-digit code to
          <span className="scene-verify-email">
            {user?.email || " your inbox"}
          </span>
          .
          <br />
          Enter it below to activate your account.
        </p>

        {error && (
          <p className="scene-verify-error">
            {error}
          </p>
        )}

        <input
          className="scene-verify-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter code"
          value={code}
          onChange={(e) => {
            setCode(
              e.target.value
                .replace(/\D/g, "")
                .slice(0, 6)
            );
            setError("");
          }}
          maxLength={6}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !isLoading
            ) {
              handleVerify();
            }
          }}
        />

        <button
          className="scene-verify-button"
          onClick={handleVerify}
          disabled={isLoading}
        >
          {isLoading
            ? "Verifying..."
            : "Verify"}
        </button>

        <button
          className="scene-verify-resend"
          type="button"
          onClick={handleResend}
          disabled={
            resending ||
            cooldown > 0
          }
        >
          {resending
            ? "Sending..."
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Resend Code"}
        </button>
      </section>
    </main>
  );
}
