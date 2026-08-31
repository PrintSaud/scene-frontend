import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/SignupPage.css";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import { TbUpload } from "react-icons/tb";
import CropperModal from "../components/CropperModal";
import defaultAvatar from "../assets/default-avatar.jpg";

const SCENE_PURPLE = "#B327F6";

export default function SignupPage() {
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [rawAvatarFile, setRawAvatarFile] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedLanguage, setSelectedLanguage] =
    useState("en");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [usernameValid, setUsernameValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);

  const [emailValid, setEmailValid] = useState(true);
  const [emailTaken, setEmailTaken] = useState(false);

  const [emailCheckBusy, setEmailCheckBusy] = useState(false);
  const [emailDeliverable, setEmailDeliverable] = useState(null);

  useEffect(() => {
    document.body.classList.add("hide-navbar");

    return () => {
      document.body.classList.remove("hide-navbar");
    };
  }, []);

  const isValidUsername = (u) =>
    /^[a-zA-Z0-9_]{3,20}$/.test(u);

  const validateEmailFormat = (e) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleUsernameChange = async (e) => {
    const val = e.target.value;

    setUsername(val);
    setUsernameTaken(false);

    const clean = val.trim();
    const valid = isValidUsername(clean);

    setUsernameValid(
      clean.length === 0 ? true : valid
    );

    if (!valid || !clean) return;

    try {
      const res = await api.get(
        "/api/auth/check-username",
        {
          params: {
            username: clean,
          },
        }
      );

      setUsernameTaken(
        !res.data?.available
      );
    } catch {
      setUsernameTaken(false);
    }
  };

  const handleEmailChange = async (e) => {
    const val = e.target.value;

    setEmail(val);
    setEmailTaken(false);
    setEmailDeliverable(null);

    const clean =
      val.trim().toLowerCase();

    const valid =
      validateEmailFormat(clean);

    setEmailValid(
      clean.length === 0 ? true : valid
    );

    if (!valid || !clean) return;

    try {
      const res = await api.get(
        "/api/auth/check-email",
        {
          params: {
            email: clean,
          },
        }
      );

      setEmailTaken(
        !res.data?.available
      );
    } catch {
      setEmailTaken(false);
    }
  };

  const verifyDeliverability = async (
    emailToCheck
  ) => {
    try {
      setEmailCheckBusy(true);
      setEmailDeliverable(null);

      const { data } = await api.post(
        "/api/auth/validate-email",
        {
          email: emailToCheck,
        }
      );

      setEmailDeliverable(
        !!data?.ok
      );

      if (data?.didYouMean) {
        toast(
          `Did you mean ${data.didYouMean}?`
        );
      }

      return !!data?.ok;
    } catch {
      /*
       * Don't completely block LEAP signups
       * if the optional validator itself is
       * temporarily unreachable.
       */
      setEmailDeliverable(null);
      return true;
    } finally {
      setEmailCheckBusy(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setRawAvatarFile(file);
    setShowCropper(true);
  };

  const handleCropped = (croppedBlob) => {
    if (avatarPreview) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    const previewURL =
      URL.createObjectURL(
        croppedBlob
      );

    setAvatar(croppedBlob);
    setAvatarPreview(previewURL);
    setShowCropper(false);
  };

  const showError = (msg) => {
    setError(msg);
    setIsLoading(false);
    toast.error(msg);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    const cleanUsername =
      username.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    if (
      !isValidUsername(
        cleanUsername
      )
    ) {
      return showError(
        "Invalid username format."
      );
    }

    if (usernameTaken) {
      return showError(
        "Username already taken."
      );
    }

    if (
      !validateEmailFormat(
        cleanEmail
      )
    ) {
      return showError(
        "Invalid email."
      );
    }

    if (emailTaken) {
      return showError(
        "Email already in use."
      );
    }

    if (password.length < 4) {
      return showError(
        "Password too short."
      );
    }

    const okDeliver =
      await verifyDeliverability(
        cleanEmail
      );

    if (!okDeliver) {
      return showError(
        "We couldn't verify that email can receive mail. Please use a different email."
      );
    }

    try {
      /*
       * SAME Scene registration backend
       * used by the mobile app.
       */
      const res = await api.post(
        "/api/auth/register",
        {
          username:
            cleanUsername,

          email:
            cleanEmail,

          password,

          language:
            selectedLanguage,
        }
      );

      if (
        !res.data?.user ||
        !res.data?.token
      ) {
        throw new Error(
          "Invalid signup response"
        );
      }

      const mergedUser = {
        ...res.data.user,
        token:
          res.data.token,

        language:
          res.data.user?.language ||
          selectedLanguage,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(
          mergedUser
        )
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "language",
        mergedUser.language
      );

      /*
       * Avatar behavior matches mobile:
       * selected avatar OR Scene fallback.
       */
      const formData =
        new FormData();

      if (avatar) {
        formData.append(
          "avatar",
          avatar,
          "avatar.png"
        );
      } else {
        const defaultResponse =
          await fetch(
            defaultAvatar
          );

        if (
          !defaultResponse.ok
        ) {
          throw new Error(
            "Failed to load default avatar"
          );
        }

        const defaultBlob =
          await defaultResponse.blob();

        formData.append(
          "avatar",
          defaultBlob,
          "default-avatar.jpg"
        );
      }

      await api.post(
        `/api/upload/avatar/${mergedUser._id}`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",

            Authorization:
              `Bearer ${res.data.token}`,
          },
        }
      );

      toast.success(
        "Account created! Check your inbox to verify."
      );

      window.location.href =
        "/verify-email";
    } catch (err) {
      console.error(
        "Signup failed:",
        err
      );

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Signup failed. Try again.";

      const lower =
        String(message)
          .toLowerCase();

      if (
        lower.includes(
          "username"
        )
      ) {
        setUsernameTaken(true);
      }

      if (
        lower.includes(
          "email"
        )
      ) {
        setEmailTaken(true);
      }

      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="scene-signup-root">
      <section className="scene-signup-panel">
        <h1 className="scene-signup-title">
          Join Scene 🎬
        </h1>

        <p className="scene-signup-subtitle">
          Your movies, shows, reviews and friends — all in one place.
        </p>

        {error && (
          <div className="scene-signup-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSignup}
          className="scene-signup-form"
        >
          <label
            htmlFor="avatar-upload"
            className="scene-signup-avatar"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Your avatar"
                className="scene-signup-avatar-image"
              />
            ) : (
              <div className="scene-signup-avatar-placeholder">
                <TbUpload size={20} />
                <span>
                  Upload Avatar
                </span>
                <small>
                  Optional
                </small>
              </div>
            )}
          </label>

          <input
            type="file"
            id="avatar-upload"
            hidden
            accept="image/*"
            onChange={handleAvatarChange}
          />

          <div className="scene-signup-field">
            <input
              type="text"
              placeholder="Username"
              autoCapitalize="none"
              autoComplete="username"
              value={username}
              onChange={handleUsernameChange}
              className="scene-signup-input"
            />

            {!usernameValid && (
              <p className="scene-signup-message error">
                3–20 letters, numbers or underscores only
              </p>
            )}

            {usernameValid &&
              username &&
              usernameTaken && (
                <p className="scene-signup-message error">
                  Username is already taken
                </p>
              )}

            {usernameValid &&
              username &&
              !usernameTaken && (
                <p className="scene-signup-message success">
                  Username looks good
                </p>
              )}
          </div>

          <div className="scene-signup-field">
            <div className="scene-signup-input-wrap">
              <input
                type="email"
                placeholder="Email"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                className="scene-signup-input"
              />

              {emailCheckBusy && (
                <span className="scene-signup-checking">
                  checking…
                </span>
              )}
            </div>

            {!emailValid && (
              <p className="scene-signup-message error">
                Invalid email format
              </p>
            )}

            {emailValid &&
              email &&
              emailTaken && (
                <p className="scene-signup-message error">
                  Email already in use
                </p>
              )}

            {emailDeliverable ===
              true &&
              !emailTaken && (
                <p className="scene-signup-message success">
                  Email looks good
                </p>
              )}
          </div>

          <div className="scene-signup-field">
            <input
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              className="scene-signup-input"
            />
          </div>

          <div className="scene-signup-language">
            <div className="scene-signup-language-title">
              🌐 Choose Language
            </div>

            <div className="scene-signup-language-buttons">
              <button
                type="button"
                onClick={() =>
                  setSelectedLanguage(
                    "en"
                  )
                }
                className={
                  selectedLanguage ===
                  "en"
                    ? "scene-language-button active"
                    : "scene-language-button"
                }
              >
                English
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedLanguage(
                    "ar"
                  )
                }
                className={
                  selectedLanguage ===
                  "ar"
                    ? "scene-language-button active"
                    : "scene-language-button"
                }
              >
                العربية
              </button>
            </div>
          </div>

          <div className="scene-signup-selected">
            Selected:{" "}
            {selectedLanguage ===
            "en"
              ? "English"
              : "العربية"}
          </div>

          <button
            type="submit"
            className="scene-signup-submit"
            disabled={
              isLoading ||
              emailCheckBusy
            }
          >
            {isLoading ? (
              <FaSpinner className="scene-signup-spinner" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="scene-signup-login">
          <span>
            Already have an account?
          </span>

          <a href="/login">
            Log in
          </a>
        </div>
      </section>

      {showCropper &&
        rawAvatarFile && (
          <CropperModal
            file={rawAvatarFile}
            onClose={() =>
              setShowCropper(
                false
              )
            }
            onCropComplete={
              handleCropped
            }
            shape="circle"
            aspectRatio={1}
          />
        )}
    </main>
  );
}
