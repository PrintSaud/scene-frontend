import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/SignupPage.css";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import { TbUpload } from "react-icons/tb";
import { ArrowLeft, ArrowRight, Mail, Lock, UserRound, Building2, Film, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CropperModal from "../components/CropperModal";
import defaultAvatar from "../assets/default-avatar.jpg";
import OrganizationApplicationForm from "../components/OrganizationApplicationForm";

const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const POSTER_ROWS = [
  ["/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg"],
  ["/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", "/fC2HDm5t0kHl7mTm7jxMR31b7by.jpg", "/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg"],
  ["/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg"]
];

function SignupPosterWall() {
  return <div className="scene-signup-wall" aria-hidden="true">
    {POSTER_ROWS.map((row, idx) => <div className={`scene-signup-poster-row scene-signup-poster-row-${idx + 1}`} key={idx}>
      {[...row, ...row].map((poster, i) => <img key={`${poster}-${i}`} src={`${TMDB_POSTER_BASE}${poster}`} alt="" draggable="false" loading="lazy" />)}
    </div>)}
  </div>;
}


export default function SignupPage() {
  const navigate = useNavigate();
  const [showOrgPreview, setShowOrgPreview] = useState(false);
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
    <main className="scene-signup-v2">
      <div className="scene-signup-grid" aria-hidden="true" />
      <div className="scene-signup-ambient" aria-hidden="true" />
      <SignupPosterWall />
      <button type="button" className="scene-signup-back" onClick={() => navigate("/")}> 
        <ArrowLeft size={18} /> Back to Scene
      </button>

      <div className="scene-signup-layout">
        <section className="scene-signup-hero">
          <img className="scene-signup-brand" src="/landing/scene-logo.png" alt="Scene" />
          <div className="scene-signup-hero-copy">
            <span className="scene-signup-eyebrow">YOUR WATCHING LIFE</span>
            <h1>Every story starts <em>somewhere.</em></h1>
            <p>Discover what to watch. Remember everything you love. Share your Scene with the world.</p>
          </div>
        </section>

        <section className="scene-signup-right">
          <div className="scene-signup-card">
            {!showOrgPreview ? (
              <>
                <header className="scene-signup-card-header">
                  <span className="scene-signup-kicker">SCENE</span>
                  <h2>Join the Scene.</h2>
                  <p>Your next favorite story starts here.</p>
                </header>
                {error && <div className="scene-signup-error" role="alert">{error}</div>}
                <form className="scene-signup-form" onSubmit={handleSignup}>
                  <div className="scene-signup-avatar-line">
                    <label htmlFor="avatar-upload" className="scene-signup-avatar">
                      {avatarPreview ? <img src={avatarPreview} alt="Your avatar" /> : <TbUpload size={22} />}
                    </label>
                    <div><strong>Profile photo</strong><span>Choose your avatar · Optional</span></div>
                    <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleAvatarChange} />
                  </div>

                  <label className="scene-signup-field">
                    <span>Username</span>
                    <div className="scene-signup-input-wrap"><UserRound size={17} />
                      <input type="text" placeholder="Choose your username" autoCapitalize="none" autoComplete="username" value={username} onChange={handleUsernameChange} required />
                    </div>
                    {!usernameValid && <small className="scene-signup-message error">3–20 letters, numbers or underscores only</small>}
                    {usernameValid && !!username && usernameTaken && <small className="scene-signup-message error">Username is already taken</small>}
                    {usernameValid && !!username && !usernameTaken && <small className="scene-signup-message neutral">Availability will be confirmed when you sign up.</small>}
                  </label>

                  <label className="scene-signup-field">
                    <span>Email address</span>
                    <div className="scene-signup-input-wrap"><Mail size={17} />
                      <input type="email" placeholder="you@example.com" autoCapitalize="none" autoComplete="email" value={email} onChange={handleEmailChange} required />
                      {emailCheckBusy && <small>Checking…</small>}
                    </div>
                    {!emailValid && <small className="scene-signup-message error">Invalid email format</small>}
                    {emailValid && !!email && emailTaken && <small className="scene-signup-message error">Email already in use</small>}
                    {emailDeliverable === true && !emailTaken && <small className="scene-signup-message success">Email verified</small>}
                  </label>

                  <label className="scene-signup-field">
                    <span>Password</span>
                    <div className="scene-signup-input-wrap"><Lock size={17} />
                      <input type="password" placeholder="Create a password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} required />
                    </div>
                  </label>

                  <div className="scene-signup-language">
                    <span>Preferred language</span>
                    <div className="scene-signup-language-options">
                      <button type="button" className={selectedLanguage === "en" ? "selected" : ""} onClick={() => setSelectedLanguage("en")}>English</button>
                      <button type="button" className={selectedLanguage === "ar" ? "selected" : ""} onClick={() => setSelectedLanguage("ar")}>العربية</button>
                    </div>
                  </div>

                  <button type="submit" className="scene-signup-primary" disabled={isLoading || emailCheckBusy}>
                    {isLoading ? <FaSpinner className="scene-signup-spinner" /> : <>Create my account <ArrowRight size={17} /></>}
                  </button>
                </form>

                <div className="scene-signup-divider"><span /> <small>PART OF A CINEMA COMMUNITY?</small> <span /></div>
                <button className="scene-signup-org-button" type="button" onClick={() => setShowOrgPreview(true)}>
                  <Building2 size={18} /> <span>Join Scene as an Organization</span><ArrowRight size={17} />
                </button>
                <p className="scene-signup-org-hint">Cinema clubs · Film societies · Studios · Festivals</p>
                <div className="scene-signup-login">Already have an account? <button type="button" onClick={() => navigate("/login")}>Log in</button></div>
              </>
            ) : (
              <OrganizationApplicationForm onBack={() => setShowOrgPreview(false)} />
            )}
          </div>
          <p className="scene-signup-footer">Movies · TV · Reviews · Friends · AI</p>
        </section>
      </div>

      {showCropper && rawAvatarFile && <CropperModal file={rawAvatarFile} onClose={() => setShowCropper(false)} onCropComplete={handleCropped} shape="circle" aspectRatio={1} />}
    </main>
  );
}
