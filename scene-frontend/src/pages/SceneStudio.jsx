import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Building2, Eye, FileText, Link2, List, LogOut, Newspaper, Plus, Users, PenLine, Clapperboard, AlertCircle, ExternalLink } from 'lucide-react';
import { organizationApi, getOrganizationToken, clearOrganizationToken } from '../api/organizationApi';
import '../styles/SceneStudio.css';
import '../styles/SceneStudioDashboard.css';
import StudioCreatePost from '../components/studio/StudioCreatePost';
import StudioDrafts from '../components/studio/StudioDrafts';
import StudioMembers from '../components/studio/StudioMembers';
import StudioConnections from '../components/studio/StudioConnections';

// SCENE_STUDIO_ORG_TOOLS_V1
import StudioCreateArticle from '../components/studio/StudioCreateArticle';
import StudioCreateList from '../components/studio/StudioCreateList';
import StudioAddProduction from '../components/studio/StudioAddProduction';

// SCENE_STUDIO_LISTS_V1

// SCENE_STUDIO_ARTICLES_V1

// SCENE_STUDIO_DRAFTS_V1

const sections = [{ id: 'dashboard', label: 'Dashboard', Icon: BarChart3 }, { id: 'content', label: 'Content', Icon: FileText }, { id: 'organization', label: 'My Org', Icon: Building2 }];
// SCENE_STUDIO_DASHBOARD_V1
const dashboardActions = [
  {
    title: 'Create Post',
    target: 'Create a post',
    description: 'Share an update with your community.',
    Icon: PenLine,
  },
  {
    title: 'Write Article',
    target: 'Publish an article',
    description: 'Tell stories worth reading.',
    Icon: Newspaper,
  },
  {
    title: 'Create List',
    target: 'Create a list',
    description: 'Curate movies and TV shows.',
    Icon: List,
  },
  {
    title: 'Add Production',
    target: 'Your productions',
    description: 'Showcase your original work.',
    Icon: Clapperboard,
  },
];

const managementActions = [
  {
    title: 'Add Members',
    target: 'members',
    description: 'Bring your team into Scene.',
    Icon: Users,
  },
  {
    title: 'Add Connections',
    target: 'connections',
    description: 'Connect with other organizations.',
    Icon: Link2,
  },
];

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
  const [postReturnTab, setPostReturnTab] = useState('dashboard');
  const [postDirty, setPostDirty] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [orgAction, setOrgAction] = useState('');

  function openDrafts() {
    setCreateOpen(false);
    setEditingDraft(null);
    setTab('drafts');
  }

  function openSavedDraft(draft) {
    setEditingDraft(draft);
    setPostReturnTab('drafts');
    setPostDirty(false);
    setTab(
      draft.type === 'production'
        ? 'create-production'
        : draft.type === 'list'
        ? 'create-list'
        : draft.type === 'article'
        ? 'create-article'
        : 'create-post'
    );
  }

  function changeStudioTab(next) {
    if (
      ['create-post', 'create-article', 'create-list', 'create-production'].includes(tab) &&
      postDirty &&
      !window.confirm('Discard your unsaved post?')
    ) return;

    setPostDirty(false);
    setTab(next);
  }
  const [createOpen, setCreateOpen] = useState(false);

  // SCENE_STUDIO_DASHBOARD_V2
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');

  const analyticsPeriods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];
  const [selectedAction, setSelectedAction] = useState('');

  function openContent(target) {
    setSelectedAction(target);
    setCreateOpen(false);

    if (target === 'members' || target === 'connections') {
      setOrgAction(target);
      setTab('organization');
      return;
    }

    if ([
      'Your productions',
      'Add Production',
      'Add a production',
      'create-production'
    ].includes(target)) {
      setEditingDraft(null);
      setPostReturnTab(
        tab === 'content' ? 'content' : 'dashboard'
      );
      setPostDirty(false);
      setTab('create-production');
      return;
    }

    if (target === 'Create a list') {
      setEditingDraft(null);
      setPostReturnTab(
        tab === 'content' ? 'content' : 'dashboard'
      );
      setPostDirty(false);
      setTab('create-list');
      return;
    }

    if (target === 'Publish an article') {
      setEditingDraft(null);
      setPostReturnTab(
        tab === 'content' ? 'content' : 'dashboard'
      );
      setPostDirty(false);
      setTab('create-article');
      return;
    }

    if (target === 'Create a post') {
      setEditingDraft(null);
      setPostReturnTab(
        tab === 'content' ? 'content' : 'dashboard'
      );
      setPostDirty(false);
      setTab('create-post');
      return;
    }

    setTab('content');
  }
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
      <nav className="ss-nav" aria-label="Studio navigation">{sections.map(({id,label,Icon})=><button key={id} className={
      (tab === id ||
        (['create-post', 'create-article', 'create-list', 'create-production', 'drafts'].includes(tab) && id === 'content'))
        ? 'ss-nav-button active'
        : 'ss-nav-button'
    } aria-current={tab===id?'page':undefined} onClick={() => {
            setCreateOpen(false);
            setSelectedAction('');
            setOrgAction('');
            changeStudioTab(id);
          }}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <section className="ss-content" aria-live="polite">
        {loading ? <div className="ss-panel">Loading Scene Studio…</div> : error && !org ? <div className="ss-error" role="alert">{error}</div> : <>
          {error && <div className="ss-error" role="alert">{error}</div>}
          {tab === 'drafts' && (
          <StudioDrafts
            org={org}
            onBack={() => setTab('dashboard')}
            onOpen={openSavedDraft}
            onNewList={() => {
              setEditingDraft(null);
              setPostReturnTab('drafts');
              setPostDirty(false);
              setTab('create-list');
            }}
            onNewArticle={() => {
              setEditingDraft(null);
              setPostReturnTab('drafts');
              setPostDirty(false);
              setTab('create-article');
            }}
            onNew={() => {
              setEditingDraft(null);
              setPostReturnTab('drafts');
              setPostDirty(false);
              setTab('create-post');
            }}
          />
        )}

        {tab === 'create-production' && (
          <StudioAddProduction
            key={editingDraft?.id || 'new-production'}
            org={org}
            initialDraft={editingDraft}
            onDirtyChange={setPostDirty}
            onBack={() => {
              setPostDirty(false);
              setTab(postReturnTab);
            }}
            onSaved={() => {
              setPostDirty(false);
              setEditingDraft(null);
              setTab('drafts');
            }}
          />
        )}

        {tab === 'create-list' && (
          <StudioCreateList
            key={editingDraft?.id || 'new-list'}
            org={org}
            initialDraft={editingDraft}
            onDirtyChange={setPostDirty}
            onBack={() => {
              setPostDirty(false);
              setTab(postReturnTab);
            }}
            onSaved={() => {
              setPostDirty(false);
              setEditingDraft(null);
              setTab('drafts');
            }}
          />
        )}

        {tab === 'create-article' && (
          <StudioCreateArticle
            key={editingDraft?.id || 'new-article'}
            org={org}
            initialDraft={editingDraft}
            onDirtyChange={setPostDirty}
            onBack={() => {
              setPostDirty(false);
              setTab(postReturnTab);
            }}
            onSaved={() => {
              setPostDirty(false);
              setEditingDraft(null);
              setTab('drafts');
            }}
          />
        )}

        {tab === 'create-post' && (
          <StudioCreatePost
            key={editingDraft?.id || 'new-post'}
            org={org}
            initialDraft={editingDraft}
            onSaved={() => {
              setPostDirty(false);
              setEditingDraft(null);
              setTab('drafts');
            }}
            onDirtyChange={setPostDirty}
            onBack={() => {
              setPostDirty(false);
              setTab(postReturnTab);
            }}
          />
        )}

          {tab === 'dashboard' && (
          <div className="ssd-dashboard">

            <div className="ssd-page-heading">
              <div>
                <span className="ssd-eyebrow">
                  YOUR ORGANIZATION
                </span>
                <h1>Dashboard</h1>
                <p>Welcome back, {org?.name}.</p>
              </div>

              <div className="ssd-create-wrap">
                <button
                  type="button"
                  className="ssd-drafts-button"
                  onClick={openDrafts}
                >
                  <FileText size={17}/>
                  Drafts
                </button>
                <button
                  type="button"
                  className="ssd-create-button"
                  aria-expanded={createOpen}
                  aria-controls="ssd-create-options"
                  onClick={() => setCreateOpen(v => !v)}
                >
                  <Plus size={19}/>
                  Create
                </button>

                {createOpen && (
                  <div
                    className="ssd-create-menu"
                    id="ssd-create-options"
                  >
                    {dashboardActions.map(
                      ({title, target, Icon}) => (
                        <button
                          key={target}
                          type="button"
                          onClick={() => openContent(target)}
                        >
                          <Icon size={18}/>
                          {title}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="ssd-hero">
              <div className="ssd-hero-art">
                <div className="ssd-hero-glow"/>
                <span className="ssd-hero-label">
                  SCENE STUDIO
                </span>
                <Clapperboard
                  className="ssd-hero-watermark"
                  size={160}
                  strokeWidth={0.8}
                />
              </div>

              <div className="ssd-hero-body">
                <div className="ssd-org-identity">
                  {org?.logoUrl ? (
                    <img
                      className="ssd-logo"
                      src={org.logoUrl}
                      alt={`${org.name} logo`}
                    />
                  ) : (
                    <div className="ssd-logo ssd-logo-empty">
                      <Building2 size={32}/>
                    </div>
                  )}

                  <div className="ssd-org-text">
                    <h2>{org?.name}</h2>
                    <span className="ssd-org-type">Organization</span>
                  </div>

                  <button
                    type="button"
                    className="ssd-view-button"
                    onClick={() => {
                      setCreateOpen(false);
                      setTab('organization');
                    }}
                  >
                    <ExternalLink size={15}/>
                    View Org
                  </button>
                </div>

                {org?.bio && (
                  <p className="ssd-org-bio" dir="auto">
                    {org.bio}
                  </p>
                )}

                <div className="ssd-hero-footer">
                  Your stories. Your productions.
                  Your community.
                </div>
              </div>
            </div>

            <div className="ssd-section-title">
              <h2>Overview</h2>

              <select
                className="ssd-period-select"
                aria-label="Analytics time period"
                value={analyticsPeriod}
                onChange={e => setAnalyticsPeriod(e.target.value)}
              >
                {analyticsPeriods.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ssd-stats-grid">
              {[
                {title:'Profile visits', Icon:Eye},
                {title:'Followers', Icon:Users},
                {title:'Article views', Icon:Newspaper},
                {title:'List views', Icon:List},
              ].map(({title, Icon}) => (
                <div className="ssd-stat-card" key={title}>
                  <div className="ssd-stat-icon">
                    <Icon size={20}/>
                  </div>
                  <strong>—</strong>
                  <span>{title}</span>
                </div>
              ))}
            </div>

            <div className="ssd-analytics-note">
              <AlertCircle size={14}/>
              Analytics for {
                analyticsPeriods.find(
                  p => p.value === analyticsPeriod
                )?.label.toLowerCase()
              } will appear when tracking is enabled.
            </div>

            <div className="ssd-section-title">
              <h2>Quick actions</h2>
            </div>

            <div className="ssd-action-grid">
              {[...dashboardActions, ...managementActions].map(
                ({title, target, description, Icon}) => (
                  <button
                    key={target}
                    type="button"
                    className="ssd-action-card"
                    onClick={() => openContent(target)}
                  >
                    <div className="ssd-action-icon">
                      <Icon size={23}/>
                    </div>
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                    <Plus
                      className="ssd-action-plus"
                      size={18}
                    />
                  </button>
                )
              )}
            </div>

            <div className="ssd-section-title">
              <h2>Recent activity</h2>
            </div>

            <div className="ssd-activity">
              <div className="ssd-activity-icon">
                <FileText size={25}/>
              </div>
              <h3>Your story starts here</h3>
              <p>
                Recent publishing activity will appear here
                when content publishing is available.
              </p>
              <button
                type="button"
                className="ssd-view-button"
                onClick={() => {
                  setSelectedAction('');
                  setTab('content');
                }}
              >
                Explore Content
              </button>
            </div>
          </div>
        )}

          {tab === 'content' && <>
            {/* SCENE_STUDIO_CONTENT_V2 */}

            <div className="ss-section-head">
              <p className="ss-eyebrow">
                PUBLISH & MANAGE
              </p>

              <h1>Content</h1>

              <p className="ss-muted">
                Everything your organization shares with
                the Scene community.
              </p>
            </div>

            <div className="sscv-section-title">
              Create content
            </div>

            <div className="ss-contents sscv-list">

              {[
                {
                  title: 'Create a post',
                  detail: 'Share photos, GIFs, links, announcements and updates.',
                  Icon: PenLine,
                  screen: 'create-post',
                  ready: true,
                },
                {
                  title: 'Write an article',
                  detail: 'Tell stories with rich text, photo galleries, an optional cover and featured titles.',
                  Icon: Newspaper,
                  screen: 'create-article',
                  ready: true,
                },
                {
                  title: 'Create a list',
                  detail: 'Curate your favorite movies and TV shows.',
                  Icon: List,
                  screen: 'create-list',
                  ready: true,
                },
                {
                  title: 'Add a production',
                  detail: "Showcase your organization's original films and shows.",
                  Icon: Clapperboard,
                  screen: 'create-production',
                  ready: true,
                },
              ].map(({ title, detail, Icon, screen, ready }) => (

                <div
                  className="ss-content-item sscv-card"
                  key={screen}
                >

                  <div className="ss-item-icon">
                    <Icon size={23}/>
                  </div>

                  <div className="sscv-copy">
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>

                  {ready ? (
                    <button
                      type="button"
                      className="sscv-create"
                      onClick={() => {
                        setEditingDraft(null);
                        setPostReturnTab('content');
                        setPostDirty(false);
                        setTab(screen);
                      }}
                    >
                      <Plus size={17}/>
                      Create
                    </button>
                  ) : (
                    <span className="ss-soon">
                      Coming soon
                    </span>
                  )}

                </div>
              ))}

            </div>

            <div className="sscv-section-title sscv-management-title">
              Manage your organization
            </div>

            <div className="ss-contents sscv-list">

              {[
                {
                  title: 'Members',
                  detail: 'Add teammates, edit member tags and manage your team.',
                  Icon: Users,
                  target: 'members',
                },
                {
                  title: 'Connections',
                  detail: 'Manage your official website and social platform links.',
                  Icon: Link2,
                  target: 'connections',
                },
              ].map(({ title, detail, Icon, target }) => (

                <div
                  className="ss-content-item sscv-card"
                  key={target}
                >

                  <div className="ss-item-icon">
                    <Icon size={23}/>
                  </div>

                  <div className="sscv-copy">
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>

                  <button
                    type="button"
                    className="sscv-manage"
                    onClick={() => {
                      setOrgAction(target);
                      setTab('organization');
                    }}
                  >
                    Manage
                    <span aria-hidden="true">›</span>
                  </button>

                </div>
              ))}

            </div>

            <div className="sscv-footer-note">
              <AlertCircle size={15}/>

              <span>
                Create content and save drafts in Studio.
                Public publishing will be available when
                the publishing backend is connected.
              </span>
            </div>

          </>}
          {tab === 'organization' && <>
            <div className="ss-section-head"><p className="ss-eyebrow">ORGANIZATION PROFILE</p><h1>My Org</h1><p className="ss-muted">Your organization's identity on Scene.</p></div>
            {orgAction === 'members' && (
              <StudioMembers
                key={org?._id || org?.username}
                org={org}
                onBack={() => setOrgAction('')}
              />
            )}

            {orgAction === 'connections' && (
              <StudioConnections
                key={org?._id || org?.username}
                org={org}
                onBack={() => setOrgAction('')}
              />
            )}

            {!orgAction && (
              <>
                <div className="sot-management-grid">
                  <button
                    type="button"
                    className="sot-management-card"
                    onClick={() => setOrgAction('members')}
                  >
                    <div className="sot-management-icon">
                      <Users size={23}/>
                    </div>
                    <div>
                      <strong>Members</strong>
                      <span>Manage the people behind your organization.</span>
                    </div>
                    <Plus size={18}/>
                  </button>

                  <button
                    type="button"
                    className="sot-management-card"
                    onClick={() => setOrgAction('connections')}
                  >
                    <div className="sot-management-icon">
                      <Link2 size={23}/>
                    </div>
                    <div>
                      <strong>Connections</strong>
                      <span>Manage your official website and social links.</span>
                    </div>
                    <Plus size={18}/>
                  </button>
                </div>

            <div className="ss-profile"><div className="ss-cover"/><div className="ss-profile-body">{org?.logoUrl ? <img className="ss-avatar" src={org.logoUrl} alt={`${org.name} logo`}/> : <div className="ss-avatar ss-avatar-empty"><Building2 size={32}/></div>}<h2>{org?.name}</h2><p>{org?.bio}</p><div className="ss-status">Approved organization</div></div></div>
            <div className="ss-panel"><h2>Public profile preview</h2><p className="ss-muted">This is what your organization profile could look like. A public route and editable connections will follow when we implement publishing.</p></div>
                </>
            )}
          </>}
        </>}
      </section>
    </div>
  </main>;
}
