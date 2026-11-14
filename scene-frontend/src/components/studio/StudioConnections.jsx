import { useEffect, useState } from 'react';

import {
  ArrowLeft, Globe, Youtube, Instagram,
  Linkedin, Facebook, Music2, Ghost,
  Link2, Plus, PenLine, Trash2, Check,
  ExternalLink, AlertCircle,
} from 'lucide-react';

import { StudioToolModal } from './StudioMembers';

import {
  readOrgLocal,
  writeOrgLocal,
} from './studioOrgLocalStore';

import '../../styles/StudioOrganizationTools.css';

const SECTION = 'connections';

const PLATFORMS = [
  {
    id: 'website',
    label: 'Website',
    color: '#b6b6b6',
    Icon: Globe,
    placeholder: 'https://yourwebsite.com',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    color: '#ff4545',
    Icon: Youtube,
    hosts: ['youtube.com', 'youtu.be'],
    placeholder: 'https://youtube.com/@yourchannel',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#e879b9',
    Icon: Instagram,
    hosts: ['instagram.com'],
    placeholder: 'https://instagram.com/yourprofile',
  },
  {
    id: 'x',
    label: 'X',
    color: '#ffffff',
    symbol: '𝕏',
    hosts: ['x.com', 'twitter.com'],
    placeholder: 'https://x.com/yourprofile',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#67e8e5',
    Icon: Music2,
    hosts: ['tiktok.com'],
    placeholder: 'https://tiktok.com/@yourprofile',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#68a9ff',
    Icon: Linkedin,
    hosts: ['linkedin.com'],
    placeholder: 'https://linkedin.com/company/yourorg',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#5899ff',
    Icon: Facebook,
    hosts: ['facebook.com', 'fb.com'],
    placeholder: 'https://facebook.com/yourpage',
  },
  {
    id: 'vimeo',
    label: 'Vimeo',
    color: '#46c7f4',
    symbol: 'v',
    hosts: ['vimeo.com'],
    placeholder: 'https://vimeo.com/yourprofile',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    color: '#f5e642',
    Icon: Ghost,
    hosts: ['snapchat.com'],
    placeholder: 'https://snapchat.com/add/yourprofile',
  },
  {
    id: 'custom',
    label: 'Custom Link',
    color: '#c084fc',
    Icon: Link2,
    placeholder: 'https://...',
  },
];

function platformFor(id) {
  return PLATFORMS.find(item => item.id === id)
    || PLATFORMS[PLATFORMS.length - 1];
}

function PlatformIcon({ platform }) {
  const { Icon, symbol, color } = platform;

  return (
    <div
      className="sot-platform-icon"
      style={{ '--platform-color': color }}
    >
      {Icon
        ? <Icon size={23}/>
        : <span>{symbol}</span>}
    </div>
  );
}

function validateLink(value, platform) {
  let raw = String(value || '').trim();

  if (!raw) return '';

  // Accept handles written as a normal website address.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    raw = `https://${raw}`;
  }

  try {
    const url = new URL(raw);

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !url.hostname.includes('.')
    ) {
      return '';
    }

    const host = url.hostname.toLowerCase();

    if (
      platform.hosts &&
      !platform.hosts.some(allowed =>
        host === allowed ||
        host.endsWith(`.${allowed}`)
      )
    ) {
      return '';
    }

    return url.href;
  } catch {
    return '';
  }
}

function displayUrl(value) {
  try {
    const url = new URL(value);

    return url.hostname.replace(/^www\./, '')
      + (url.pathname === '/' ? '' : url.pathname);
  } catch {
    return value;
  }
}

function ConnectionEditor({
  platform,
  existing,
  onSave,
  onRemove,
  onClose,
}) {
  const [url, setUrl] = useState(existing?.url || '');
  const [label, setLabel] = useState(existing?.label || '');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();

    const validated = validateLink(url, platform);

    if (!validated) {
      setError(
        platform.hosts
          ? `Enter a valid HTTPS link for ${platform.label}.`
          : 'Enter a valid HTTPS website address.'
      );
      return;
    }

    onSave({
      id: existing?.id ||
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`,
      platform: platform.id,
      label: label.trim() || platform.label,
      url: validated,
    });
  }

  return (
    <form className="sot-connection-editor" onSubmit={submit}>

      <div className="sot-connection-selected">
        <PlatformIcon platform={platform}/>

        <div>
          <strong>{platform.label}</strong>
          <span>Add your official link.</span>
        </div>
      </div>

      {platform.id === 'custom' && (
        <>
          <label className="sot-field-label" htmlFor="sot-link-label">
            Link name
          </label>

          <input
            id="sot-link-label"
            className="sot-input"
            placeholder="e.g. Film festival tickets"
            value={label}
            maxLength={60}
            dir="auto"
            onChange={event => setLabel(event.target.value)}
          />
        </>
      )}

      <label className="sot-field-label" htmlFor="sot-link-url">
        URL
      </label>

      <input
        id="sot-link-url"
        className="sot-input"
        type="text"
        inputMode="url"
        placeholder={platform.placeholder}
        value={url}
        required
        dir="ltr"
        onChange={event => {
          setUrl(event.target.value);
          setError('');
        }}
      />

      {error && (
        <div className="sot-error" role="alert">
          {error}
        </div>
      )}

      <div className="sot-modal-actions">

        {existing && (
          <button
            type="button"
            className="sot-danger"
            onClick={() => onRemove(existing)}
          >
            <Trash2 size={16}/> Remove
          </button>
        )}

        <button
          type="button"
          className="sot-secondary"
          onClick={onClose}
        >
          Cancel
        </button>

        <button type="submit" className="sot-primary">
          <Check size={17}/>
          {existing ? 'Save Changes' : 'Add Connection'}
        </button>
      </div>

    </form>
  );
}

export default function StudioConnections({ org, onBack }) {
  const [links, setLinks] = useState([]);
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      setLinks(readOrgLocal(org, SECTION));
      setError('');
    } catch {
      setLinks([]);
      setError('Could not load your local connections.');
    }
  }, [org]);

  function saveLinks(next) {
    try {
      writeOrgLocal(org, SECTION, next);
      setLinks(next);
      setError('');
      setSelection(null);
    } catch {
      setError('Could not save your connection changes.');
    }
  }

  function addOrEdit(entry) {
    const previous = links.find(
      link => link.id === entry.id
    );

    // One account per suggested platform.
    // Custom links can be added multiple times.
    if (
      !previous &&
      entry.platform !== 'custom' &&
      links.some(link => link.platform === entry.platform)
    ) {
      setError('This platform is already connected.');
      return;
    }

    const next = previous
      ? links.map(link =>
          link.id === entry.id ? entry : link
        )
      : [...links, entry];

    saveLinks(next);
  }

  function removeLink(link) {
    if (!window.confirm(`Remove ${link.label}?`)) return;

    saveLinks(
      links.filter(item => item.id !== link.id)
    );
  }

  return (
    <div className="sot-page">

      <header className="sot-page-heading">
        <button
          type="button"
          className="sot-back"
          aria-label="Back to My Org"
          onClick={onBack}
        >
          <ArrowLeft size={22}/>
        </button>

        <div className="sot-heading-copy">
          <h1>Connections</h1>
          <p>Connect your organization to the world.</p>
        </div>
      </header>

      {error && (
        <div className="sot-error" role="alert">
          <AlertCircle size={17}/> {error}
        </div>
      )}

      <div className="sot-section-heading">
        <h2>Your connections</h2>
        <span>{links.length} added</span>
      </div>

      {links.length ? (
        <div className="sot-card-list">

          {links.map(link => (
            <div
              key={link.id}
              className="sot-connection-card"
            >
              <PlatformIcon
                platform={platformFor(link.platform)}
              />

              <div className="sot-connection-info">
                <strong dir="auto">{link.label}</strong>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                >
                  {displayUrl(link.url)}
                  <ExternalLink size={12}/>
                </a>
              </div>

              <button
                type="button"
                className="sot-icon-button"
                aria-label={`Edit ${link.label}`}
                onClick={() => setSelection({
                  platform: platformFor(link.platform),
                  existing: link,
                })}
              >
                <PenLine size={18}/>
              </button>
            </div>
          ))}

        </div>
      ) : (
        <div className="sot-empty sot-empty-compact">
          <div className="sot-empty-icon">
            <Link2 size={30}/>
          </div>
          <h3>No connections yet</h3>
          <p>
            Add your official links from the platforms below.
          </p>
        </div>
      )}

      <div className="sot-section-heading sot-suggested-heading">
        <div>
          <h2>Suggested platforms</h2>
          <p>Choose where your organization can be found.</p>
        </div>
      </div>

      <div className="sot-platform-grid">

        {PLATFORMS.map(platform => {
          const existing =
            platform.id === 'custom'
              ? null
              : links.find(
                  link => link.platform === platform.id
                );

          return (
            <button
              key={platform.id}
              type="button"
              className="sot-platform-card"
              onClick={() => setSelection({
                platform,
                existing,
              })}
            >
              <PlatformIcon platform={platform}/>

              <div>
                <strong>{platform.label}</strong>
                <span>
                  {existing
                    ? 'Added'
                    : 'Add official link'}
                </span>
              </div>

              {existing
                ? <Check size={18} color="#c084fc"/>
                : <Plus size={18}/>}
            </button>
          );
        })}

      </div>

      <div className="sot-local-note">
        <AlertCircle size={15}/>
        Links are saved locally and are not publicly visible yet.
      </div>

      {selection && (
        <StudioToolModal
          title={
            selection.existing
              ? 'Edit Connection'
              : 'Add Connection'
          }
          subtitle={`Manage your ${selection.platform.label} link.`}
          onClose={() => setSelection(null)}
        >
          {error && (
            <div className="sot-error" role="alert">
              {error}
            </div>
          )}

          <ConnectionEditor
            key={selection.existing?.id || selection.platform.id}
            platform={selection.platform}
            existing={selection.existing}
            onSave={addOrEdit}
            onRemove={removeLink}
            onClose={() => setSelection(null)}
          />
        </StudioToolModal>
      )}

    </div>
  );
}
