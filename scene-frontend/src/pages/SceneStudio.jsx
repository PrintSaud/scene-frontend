import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Building2, Eye, FileText, Link2, List, LogOut, Newspaper, Plus, Users, PenLine, Clapperboard, AlertCircle, ExternalLink } from 'lucide-react';
import { organizationApi, getOrganizationToken, clearOrganizationToken } from '../api/organizationApi';
import '../styles/SceneStudio.css';

const sections = [{ id: 'dashboard', label: 'Dashboard', Icon: BarChart3 }, { id: 'content', label: 'Content', Icon: FileText }, { id: 'organization', label: 'My Org', Icon: Building2 }];
const contentItems = [
  { title: 'Publish an article', detail: 'Headline and article body; linked movie, TV show, and cover are optional.', Icon: Newspaper },
  { title: 'Create a post', detail: 'Share a video, link, announcement, or update.', Icon: PenLine },
  { title: 'Create a list', detail: 'Curate movies and shows, like regular Scene lists.', Icon: List },
  { title: 'Your productions', detail: 'Claim a title already in Scene. Manual submissions come later.', Icon: Clapperboard },
  { title: 'Connections', detail: 'Website, YouTube, Instagram, X, and other official links.', Icon: Link2 },
];
export default function SceneStudio() {
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    if (!getOrganizationToken()) { navigate('/studio/login', {replace:true}); return; }
    organizationApi.get('/api/organization-auth/me').then(({data}) => {
      if (active) setOrg(data.organization);
    }).catch(err => {
      if (!active) return;
      if ([401,403].includes(err.response?.status)) { clearOrganizationToken(); navigate('/studio/login', {replace:true}); }
      else setError('Could not load your organization. Please try refreshing.');
    }).finally(()=>{ if(active) setLoading(false); });
    return ()=>{ active = false; };
  }, [navigate]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await organizationApi.post('/api/organization-auth/logout'); }
    catch (err) { if (![401,403].includes(err.response?.status)) { setError('Could not confirm logout with the server. Please retry.'); setLoggingOut(false); return; } }
    clearOrganizationToken(); navigate('/studio/login', {replace:true});
  }

  return <main className="ss-app ss-workspace">
    <header className="ss-topbar"><div className="ss-brand"><div className="ss-icon ss-icon-small"><Building2 size={19}/></div><div><strong>Scene Studio</strong><small>Organization workspace</small></div></div><button className="ss-logout" type="button" onClick={logout} disabled={loggingOut}><LogOut size={17}/> {loggingOut?'Logging out…':'Log out'}</button></header>
    <div className="ss-layout">
      <nav className="ss-nav" aria-label="Studio navigation">{sections.map(({id,label,Icon})=><button key={id} className={tab===id?'ss-nav-button active':'ss-nav-button'} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <section className="ss-content" aria-live="polite">
        {loading ? <div className="ss-panel">Loading Scene Studio…</div> : error && !org ? <div className="ss-error" role="alert">{error}</div> : <>
          {error && <div className="ss-error" role="alert">{error}</div>}
          {tab === 'dashboard' && <>
            <div className="ss-section-head"><p className="ss-eyebrow">OVERVIEW</p><h1>Dashboard</h1><p className="ss-muted">Welcome back, {org?.name}. Here's your organization at a glance.</p></div>
            <div className="ss-stats">{[{title:'Profile visits',Icon:Eye},{title:'Article views',Icon:Newspaper},{title:'List views',Icon:List},{title:'Followers',Icon:Users}].map(({title,Icon})=><div className="ss-stat" key={title}><Icon size={21}/><strong>—</strong><span>{title}</span></div>)}</div>
            <div className="ss-panel"><h2>Analytics are coming</h2><p className="ss-muted">This is your real, protected organization workspace. Visit and engagement tracking will appear once their backend events are implemented. No made-up numbers.</p></div>
          </>}
          {tab === 'content' && <>
            <div className="ss-section-head"><p className="ss-eyebrow">PUBLISH & MANAGE</p><h1>Content</h1><p className="ss-muted">Everything your organization shares with the Scene community.</p></div>
            <div className="ss-info"><AlertCircle size={17}/><span>Content publishing is a preview until the corresponding APIs are implemented. Nothing here is publicly published yet.</span></div>
            <div className="ss-contents">{contentItems.map(({title,detail,Icon})=><div className="ss-content-item" key={title}><div className="ss-item-icon"><Icon size={21}/></div><div><strong>{title}</strong><p>{detail}</p></div><span className="ss-soon">Coming soon</span></div>)}</div>
          </>}
          {tab === 'organization' && <>
            <div className="ss-section-head"><p className="ss-eyebrow">ORGANIZATION PROFILE</p><h1>My Org</h1><p className="ss-muted">Your organization's identity on Scene.</p></div>
            <div className="ss-profile"><div className="ss-cover"/><div className="ss-profile-body">{org?.logoUrl ? <img className="ss-avatar" src={org.logoUrl} alt={`${org.name} logo`}/> : <div className="ss-avatar ss-avatar-empty"><Building2 size={32}/></div>}<h2>{org?.name}</h2><p className="ss-handle">@{org?.username}</p><p>{org?.bio}</p><div className="ss-status">Approved organization</div></div></div>
            <div className="ss-panel"><h2>Public profile preview</h2><p className="ss-muted">This is what your organization profile could look like. A public route and editable connections will follow when we implement publishing.</p></div>
          </>}
        </>}
      </section>
    </div>
  </main>;
}
