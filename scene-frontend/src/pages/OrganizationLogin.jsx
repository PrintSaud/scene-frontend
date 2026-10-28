import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, LockKeyhole, Mail } from 'lucide-react';
import { organizationApi, saveOrganizationToken } from '../api/organizationApi';
import '../styles/SceneStudio.css';

const POSTER_ROWS = [
  ['/qJ2tW6WMUDux911r6m7haRef0WH.jpg', '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg'],
  ['/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', '/fC2HDm5t0kHl7mTm7jxMR31b7by.jpg', '/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg'],
  ['/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg']
];

function StudioPosterWall() {
  return <div className="ss-auth-wall" aria-hidden="true">
    {POSTER_ROWS.map((row, i) => <div className={`ss-auth-poster-row ss-auth-poster-row-${i+1}`} key={i}>
      {[...row,...row].map((poster,j) => <img key={`${i}-${j}`} src={`https://image.tmdb.org/t/p/w342${poster}`} loading="lazy" alt="" draggable="false" />)}
    </div>)}
  </div>;
}

export default function OrganizationLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      const { data } = await organizationApi.post('/api/organization-auth/login', { email: email.trim().toLowerCase(), password });
      if (!data?.token || data?.organization?.status !== 'approved') throw new Error('Invalid organization login response.');
      saveOrganizationToken(data.token);
      navigate('/studio', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to sign in.');
    } finally { setLoading(false); }
  }

  return <main className="ss-app ss-login-screen ss-auth-login">
    <div className="ss-auth-grid" aria-hidden="true" />
    <StudioPosterWall />
    <div className="ss-auth-overlay" aria-hidden="true" />
    <button type="button" className="ss-back" onClick={() => navigate('/signup')}><ArrowLeft size={17}/> Back to Scene</button>
    <section className="ss-auth-hero">
      <img className="ss-auth-brand" src="/landing/scene-logo.png" alt="Scene" />
      <div className="ss-auth-hero-copy">
        <span>SCENE STUDIO</span>
        <h2>For the people <em>behind the stories.</em></h2>
        <p>Give your organization a home on Scene.</p>
      </div>
    </section>
    <form className="ss-login-card" onSubmit={submit}>
      <div className="ss-icon"><Building2 size={25}/></div>
      <p className="ss-eyebrow">SCENE STUDIO</p>
      <h1>Welcome back.</h1>
      <p className="ss-muted">Sign in to your approved organization workspace.</p>
      <label className="ss-label">Organization email<div className="ss-input-wrap"><Mail size={17}/><input type="email" required autoComplete="email" placeholder="organization@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div></label>
      <label className="ss-label">Password<div className="ss-input-wrap"><LockKeyhole size={17}/><input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></div></label>
      {error && <div className="ss-error" role="alert">{error}</div>}
      <button disabled={loading} className="ss-primary" type="submit">{loading ? 'Signing in…' : 'Sign in to Studio'} <ArrowRight size={17}/></button>
      <p className="ss-muted ss-small">Organization access requires approval. Applications are submitted through Scene signup.</p>
    </form>
  </main>;
}
