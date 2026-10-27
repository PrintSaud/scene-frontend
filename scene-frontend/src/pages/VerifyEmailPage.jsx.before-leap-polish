import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [resending, setResending] =
    useState(false);

  const [cooldown, setCooldown] =
    useState(0);

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
    document.body.classList.add(
      "hide-navbar"
    );

    return () => {
      document.body.classList.remove(
        "hide-navbar"
      );
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCooldown((current) =>
        Math.max(current - 1, 0)
      );
    }, 1000);

    return () =>
      clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    setError("");

    const cleanCode =
      code.trim();

    if (
      !/^\d{6}$/.test(cleanCode)
    ) {
      setError(
        "Enter a valid 6-digit code."
      );
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

      /*
       * Match the app behavior:
       * if verification returns an updated user/token,
       * save them before continuing.
       */
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
        /*
         * Keep the existing signup user if the
         * backend verification route does not
         * return a replacement user/token.
         */
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
        "Email verified! Welcome to Scene 🎬"
      );

      /*
       * IMPORTANT:
       * Do NOT enter the unfinished web app.
       * Send LEAP signups to the app handoff.
       */
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
        "Invalid code. Try again."
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
        "Could not resend code. Try again later.";

      setError(message);

      toast.error(
        "Could not resend code."
      );
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const digitsOnly =
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setCode(digitsOnly);

    if (error) {
      setError("");
    }
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      <h1 className="scene-logo">
        Verify Your Email
      </h1>

      <p
        style={{
          color: "#aaa",
          marginBottom: "24px",
          lineHeight: 1.6,
          maxWidth: "440px",
        }}
      >
        We've sent a 6-digit code to{" "}
        <b style={{ color: "#fff" }}>
          {user?.email || "your email"}
        </b>
        .
        <br />
        Enter it below to activate your
        Scene account.
      </p>

      {error && (
        <p
          style={{
            color: "#ff4d4d",
            marginBottom: "12px",
            fontWeight: "500",
            maxWidth: "440px",
          }}
        >
          {error}
        </p>
      )}

      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        value={code}
        onChange={handleCodeChange}
        maxLength={6}
        className="login-input"
        style={{
          textAlign: "center",
          letterSpacing: "8px",
          fontSize: "20px",
          maxWidth: "440px",
        }}
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
        onClick={handleVerify}
        className="login-button"
        style={{
          marginTop: "18px",
          maxWidth: "440px",
        }}
        disabled={isLoading}
      >
        {isLoading
          ? "Verifying..."
          : "Verify Email"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={
          resending ||
          cooldown > 0
        }
        style={{
          marginTop: "16px",
          border: "none",
          background: "transparent",
          color: "#B327F6",
          cursor:
            resending ||
            cooldown > 0
              ? "default"
              : "pointer",
          opacity:
            resending ||
            cooldown > 0
              ? 0.6
              : 1,
          fontSize: "14px",
          fontWeight: "600",
          textDecoration: "underline",
        }}
      >
        {resending
          ? "Sending..."
          : cooldown > 0
          ? `Resend in ${cooldown}s`
          : "Resend Code"}
      </button>
    </div>
  );
}
