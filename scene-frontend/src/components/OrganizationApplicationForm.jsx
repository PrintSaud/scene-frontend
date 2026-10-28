import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, FileText, ImageUp, LoaderCircle, Mail, Lock, UserRound, X } from "lucide-react";
import "../styles/OrganizationApplicationForm.css";

const MAX_LOGO = 3 * 1024 * 1024;
const MAX_DOCUMENT = 5 * 1024 * 1024;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{2,40}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OrganizationApplicationForm({ onBack }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logo, setLogo] = useState(null);
  const [document, setDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState("");

  useEffect(() => {
    if (!logo) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(logo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  function pickLogo(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_LOGO || !["image/png", "image/jpeg", "image/webp"].includes(selected.type)) {
      setError("Logo must be PNG, JPEG, or WebP and no larger than 3 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setLogo(selected);
  }

  function pickDocument(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_DOCUMENT || selected.type !== "application/pdf") {
      setError("Company document must be a PDF no larger than 5 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setDocument(selected);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || name.trim().length > 120 || !bio.trim() || bio.trim().length > 1000) {
      setError("Please enter a name (up to 120 characters) and bio (up to 1,000 characters).");
      return;
    }
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError("Username must be 3–30 letters, numbers, or underscores.");
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 12 || password.length > 72) {
      setError("Password must be 12–72 characters.");
      return;
    }
    if (!logo) {
      setError("Please upload your organization logo.");
      return;
    }

    const payload = new FormData();
    payload.append("name", name.trim());
    payload.append("username", normalizedUsername);
    payload.append("email", normalizedEmail);
    payload.append("bio", bio.trim());
    payload.append("password", password);
    payload.append("logo", logo, logo.name);
    if (document) payload.append("document", document, document.name);

    setSubmitting(true);
    try {
      // Do not set Content-Type manually: the browser must include the multipart boundary.
      const response = await api.post("/api/organizations/apply", payload, { timeout: 45000 });
      if (!response.data?.success || !response.data?.applicationId) {
        throw new Error("Unexpected application response. Please contact Scene support before trying again.");
      }
      setApplicationId(response.data.applicationId);
      setPassword("");
      toast.success("Application received!");
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error || err.response?.data?.message;
      const userMessage = status === 429
        ? "Too many attempts. Please try again later."
        : status === 503
          ? "Applications are temporarily unavailable. Please try again later."
          : message || "Could not submit your application. Please try again.";
      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setSubmitting(false);
    }
  }

  if (applicationId) {
    return (
      <div className="scene-signup-org-preview scene-org-apply">
        <div className="scene-org-apply-success-icon"><CheckCircle2 size={32} /></div>
        <span className="scene-signup-kicker">SCENE STUDIO</span>
        <h2>Application received.</h2>
        <p>Thank you for applying to join Scene Organizations. Your application is pending review. We'll contact you using the email you provided.</p>
        <div className="scene-signup-info"><CheckCircle2 size={19} /><span>Reference: {applicationId}</span></div>
        <button type="button" className="scene-signup-primary" onClick={onBack}>Back to Scene <ArrowRight size={17} /></button>
      </div>
    );
  }

  return (
    <div className="scene-signup-org-preview scene-org-apply">
      <button type="button" className="scene-signup-text-back" onClick={onBack}><ArrowLeft size={16} /> Back to signup</button>
      <div className="scene-signup-org-symbol"><Building2 size={26} /></div>
      <span className="scene-signup-kicker">SCENE STUDIO</span>
      <h2>For the people behind the stories.</h2>
      <p>Apply for your organization's official presence on Scene. Publish articles and curate film lists once your account is approved and those tools launch.</p>

      <form className="scene-signup-form scene-org-apply-form" onSubmit={handleSubmit}>
        <label className="scene-signup-field">
          <span>Organization name *</span>
          <div className="scene-signup-input-wrap"><Building2 size={17} /><input value={name} onChange={e => setName(e.target.value)} maxLength={120} placeholder="Studio or organization name" required /></div>
        </label>
        <label className="scene-signup-field">
          <span>Organization username *</span>
          <div className="scene-signup-input-wrap"><UserRound size={17} /><input value={username} onChange={e => setUsername(e.target.value)} minLength={3} maxLength={30} autoCapitalize="none" autoComplete="off" placeholder="organization_name" required /></div>
          <small className="scene-signup-message neutral">3–30 letters, numbers or underscores.</small>
        </label>
        <label className="scene-signup-field">
          <span>Official email *</span>
          <div className="scene-signup-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoCapitalize="none" autoComplete="email" maxLength={254} placeholder="contact@studio.com" required /></div>
        </label>
        <label className="scene-signup-field">
          <span>About your organization *</span>
          <textarea className="scene-org-apply-textarea" value={bio} onChange={e => setBio(e.target.value)} maxLength={1000} rows={3} placeholder="Tell the Scene community about your organization" required />
        </label>
        <label className="scene-signup-field">
          <span>Password *</span>
          <div className="scene-signup-input-wrap"><Lock size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={12} maxLength={72} placeholder="At least 12 characters" required /></div>
          <small className="scene-signup-message neutral">For future account activation. Logging in is not available yet.</small>
        </label>
        <div className="scene-org-apply-file-group">
          <span className="scene-org-apply-label">Organization logo *</span>
          <label className="scene-org-apply-file" htmlFor="scene-org-logo">
            {previewUrl ? <img className="scene-org-apply-logo-preview" src={previewUrl} alt="Selected organization logo" /> : <ImageUp size={24} />}
            <span>{logo ? logo.name : "Choose logo · PNG, JPEG, WebP · Max 3 MB"}</span>
          </label>
          <input id="scene-org-logo" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={pickLogo} hidden />
        </div>
        <div className="scene-org-apply-file-group">
          <span className="scene-org-apply-label">Company document · Optional</span>
          <label className="scene-org-apply-file" htmlFor="scene-org-document"><FileText size={23} /><span>{document ? document.name : "Choose PDF · Max 5 MB"}</span></label>
          <input id="scene-org-document" type="file" accept=".pdf,application/pdf" onChange={pickDocument} hidden />
          {document && <button type="button" className="scene-org-apply-clear" onClick={() => { setDocument(null); window.document.getElementById("scene-org-document").value = ""; }}><X size={14} /> Remove document</button>}
        </div>
        {error && <div className="scene-signup-error" role="alert">{error}</div>}
        <div className="scene-signup-info"><CheckCircle2 size={19}/><span>Applications are reviewed before activation. Your organization won't be able to publish or log in immediately.</span></div>
        <button className="scene-signup-primary" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="scene-org-apply-spin" size={17} /> Submitting...</> : <>Submit application <ArrowRight size={17}/></>}</button>
      </form>
    </div>
  );
}
