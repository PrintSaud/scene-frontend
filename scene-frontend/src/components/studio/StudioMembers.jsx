import {
  useEffect, useRef, useState,
} from 'react';

import { createPortal } from 'react-dom';

import {
  ArrowLeft, Users, UserPlus, User,
  Search, Plus, X, PenLine, Trash2,
  Check, AlertCircle, Tag,
} from 'lucide-react';

import api from '../../api/api';

import {
  readOrgLocal,
  writeOrgLocal,
} from './studioOrgLocalStore';

import '../../styles/StudioOrganizationTools.css';

const SECTION = 'members';
const MAX_TAG_LENGTH = 60;

const SUGGESTED_TAGS = [
  'Founder',
  'President',
  'Head of Events',
  'Creative Director',
  'Film Director',
  'Producer',
  'Actor',
  'Editor',
  'Member',
];

function normalizeUser(user) {
  const rawId = user?._id || user?.id;

  if (!rawId || !user?.username) return null;

  return {
    userId: String(rawId),
    name: String(
      user.name || user.displayName || user.username
    ),
    username: String(user.username),
    avatar: typeof user.avatar === 'string'
      ? user.avatar
      : '',
  };
}

// SCENE_MEMBER_IDENTITY_V3

function UserAvatar({ user }) {
  const avatar = typeof user?.avatar === 'string'
    ? user.avatar.trim()
    : '';

  // Remount the image only when its URL changes.
  // Avoid resetting a cached image after it has loaded.
  return (
    <MemberAvatarImage
      key={avatar || 'default-avatar'}
      src={avatar}
      username={user?.username}
    />
  );
}

function MemberAvatarImage({ src, username }) {
  const imageRef = useRef(null);

  const [status, setStatus] = useState(
    src ? 'loading' : 'failed'
  );

  useEffect(() => {
    if (!src) return;

    const image = imageRef.current;

    // Safari may already have the image cached.
    if (image?.complete) {
      setStatus(
        image.naturalWidth > 0 ? 'loaded' : 'failed'
      );
      return;
    }

    // Never leave the avatar as an endless skeleton
    // if an image request stalls.
    const timeout = window.setTimeout(() => {
      setStatus(previous =>
        previous === 'loading' ? 'failed' : previous
      );
    }, 15000);

    return () => window.clearTimeout(timeout);
  }, [src]);

  return (
    <div className="sot-user-avatar">

      {status === 'loading' && (
        <div
          className="sot-skeleton sot-avatar-skeleton"
          aria-hidden="true"
        />
      )}

      {status === 'failed' ? (
        <User size={23}/>
      ) : (
        <img
          ref={imageRef}
          src={src}
          alt={`${username || 'Scene user'} avatar`}
          className={status === 'loaded' ? 'loaded' : ''}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        />
      )}

    </div>
  );
}

function UserSkeletons() {
  return (
    <div className="sot-results" aria-busy="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="sot-user-row" key={index}>
          <div className="sot-skeleton sot-sk-avatar"/>

          <div className="sot-user-info">
            <div className="sot-skeleton sot-sk-name"/>
            <div className="sot-skeleton sot-sk-handle"/>
          </div>

          <div className="sot-skeleton sot-sk-action"/>
        </div>
      ))}
    </div>
  );
}

export function StudioToolModal({
  title,
  subtitle,
  onClose,
  children,
}) {
  const modalRef = useRef(null);
  const closeRef = useRef(null);
  const closeCallback = useRef(onClose);

  closeCallback.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = 'hidden';

    const modal = modalRef.current;

    const initial = modal?.querySelector(
      'input:not([type="hidden"]), textarea, select'
    );

    (initial || closeRef.current)?.focus();

    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCallback.current?.();
      }

      // Keep keyboard navigation inside the dialog.
      if (event.key === 'Tab' && modal) {
        const controls = Array.from(
          modal.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), ' +
            'select:not(:disabled), textarea:not(:disabled), ' +
            'a[href], [tabindex="0"]'
          )
        ).filter(node => node.getClientRects().length);

        const first = controls[0];
        const last = controls[controls.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="sot-overlay" onClick={onClose}>
      <section
        ref={modalRef}
        className="sot-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}
      >
        <header className="sot-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            ref={closeRef}
            type="button"
            className="sot-icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20}/>
          </button>
        </header>

        <div className="sot-modal-body">
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}

function MemberTagEditor({
  user,
  initialTag = '',
  editing = false,
  onSave,
  onRemove,
  onBack,
}) {
  const [tag, setTag] = useState(initialTag);

  return (
    <div className="sot-tag-editor">

      <div className="sot-user-row sot-selected-user">
        <UserAvatar user={user}/>

        <div className="sot-user-info">
          <strong className="sot-username" dir="ltr">@{user.username}</strong>
        </div>

        <Check size={20} color="#c084fc"/>
      </div>

      <label className="sot-field-label" htmlFor="sot-tag">
        <Tag size={15}/> Member tag
        <span>Optional</span>
      </label>

      <input
        id="sot-tag"
        className="sot-input"
        placeholder="e.g. Head of Events"
        dir="auto"
        value={tag}
        maxLength={MAX_TAG_LENGTH}
        onChange={event => setTag(event.target.value)}
      />

      <div className="sot-field-hint">
        Give this person a position or title in your organization.
        This tag does not grant account permissions.
      </div>

      <div className="sot-tag-suggestions">
        {SUGGESTED_TAGS.map(value => (
          <button
            key={value}
            type="button"
            className={tag === value ? 'active' : ''}
            onClick={() => setTag(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="sot-modal-actions">

        {editing && (
          <button
            type="button"
            className="sot-danger"
            onClick={onRemove}
          >
            <Trash2 size={16}/> Remove
          </button>
        )}

        <button
          type="button"
          className="sot-secondary"
          onClick={onBack}
        >
          {editing ? 'Cancel' : 'Back'}
        </button>

        <button
          type="button"
          className="sot-primary"
          onClick={() => onSave(tag.trim())}
        >
          <Check size={17}/>
          {editing ? 'Save Changes' : 'Add Member'}
        </button>

      </div>
    </div>
  );
}

export default function StudioMembers({ org, onBack }) {
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      setMembers(readOrgLocal(org, SECTION));
      setError('');
    } catch {
      setMembers([]);
      setError('Could not load your local member configuration.');
    }
  }, [org]);

  // Real Scene user search.
  useEffect(() => {
    if (!modalOpen || selected || editing) return;

    const controller = new AbortController();
    const term = query.trim().replace(/^@/, '');

    setResults([]);
    setSearchError('');

    if (term.length < 2) {
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(
          '/api/users/search',
          {
            params: { query: term },
            signal: controller.signal,
          }
        );

        const users = Array.isArray(data)
          ? data
          : data?.users || data?.results;

        if (!Array.isArray(users)) {
          throw new Error('Unexpected user search response.');
        }

        const seen = new Set();

        const normalized = users
          .map(normalizeUser)
          .filter(user => {
            if (!user || seen.has(user.userId)) {
              return false;
            }

            seen.add(user.userId);
            return true;
          });

        if (!controller.signal.aborted) {
          setResults(normalized);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setSearchError(
            'Could not search Scene users. Please try again.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [modalOpen, selected, editing, query]);

  function saveMembers(next) {
    try {
      writeOrgLocal(org, SECTION, next);
      setMembers(next);
      setError('');
      return true;
    } catch {
      setError('Could not save the member changes locally.');
      return false;
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(null);
    setEditing(false);
    setQuery('');
    setResults([]);
    setSearchError('');
  }

  function openAdd() {
    setSelected(null);
    setEditing(false);
    setQuery('');
    setModalOpen(true);
  }

  function openEdit(member) {
    setSelected(member);
    setEditing(true);
    setModalOpen(true);
  }

  function saveMember(tag) {
    if (!selected) return;

    const existing = members.some(
      member => member.userId === selected.userId
    );

    if (!editing && existing) return;

    const entry = {
      ...selected,
      tag,
    };

    const next = editing
      ? members.map(member =>
          member.userId === selected.userId
            ? entry
            : member
        )
      : [...members, entry];

    if (saveMembers(next)) {
      closeModal();
    }
  }

  function removeMember(member) {
    if (!window.confirm(
      `Remove ${member.name} from your member configuration?`
    )) return;

    const next = members.filter(
      item => item.userId !== member.userId
    );

    if (saveMembers(next)) {
      closeModal();
    }
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
          <h1>Members</h1>
          <p>The people behind {org?.name}.</p>
        </div>

        <button
          type="button"
          className="sot-primary"
          onClick={openAdd}
        >
          <UserPlus size={18}/> Add Member
        </button>
      </header>

      <div className="sot-summary">
        <div className="sot-management-icon">
          <Users size={25}/>
        </div>

        <div>
          <strong>{members.length}</strong>
          <span>
            {members.length === 1 ? 'Member' : 'Members'}
          </span>
        </div>
      </div>

      {error && (
        <div className="sot-error" role="alert">
          <AlertCircle size={17}/> {error}
        </div>
      )}

      <div className="sot-section-heading">
        <h2>Your team</h2>
      </div>

      {members.length ? (
        <div className="sot-card-list">
          {members.map(member => (
            <div
              key={member.userId}
              className="sot-member-card"
            >
              <UserAvatar user={member}/>

              <div className="sot-user-info">
                <strong className="sot-username" dir="ltr">@{member.username}</strong>

                {member.tag && (
                  <div className="sot-member-tag" dir="auto">
                    {member.tag}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="sot-icon-button"
                title="Edit member"
                aria-label={`Edit ${member.username}`}
                onClick={() => openEdit(member)}
              >
                <PenLine size={18}/>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="sot-empty">
          <div className="sot-empty-icon">
            <Users size={34}/>
          </div>

          <h3>Great stories start with great teams</h3>

          <p>
            Find your teammates on Scene and give them
            a place in your organization.
          </p>

          <button
            type="button"
            className="sot-primary"
            onClick={openAdd}
          >
            <Plus size={17}/> Add Your First Member
          </button>
        </div>
      )}

      <div className="sot-local-note">
        <AlertCircle size={15}/>
        User search is live. Member changes are saved locally
        until invitations and memberships are connected.
      </div>

      {modalOpen && (
        <StudioToolModal
          title={
            editing
              ? 'Edit Member'
              : selected
              ? 'Member Details'
              : 'Add Member'
          }
          subtitle={
            selected
              ? 'Customize their organization tag.'
              : 'Find an existing Scene user.'
          }
          onClose={closeModal}
        >
          {error && (
            <div className="sot-error" role="alert">
              {error}
            </div>
          )}

          {selected ? (
            <MemberTagEditor
              key={selected.userId}
              user={selected}
              initialTag={selected.tag || ''}
              editing={editing}
              onSave={saveMember}
              onRemove={() => removeMember(selected)}
              onBack={() => {
                if (editing) closeModal();
                else setSelected(null);
              }}
            />
          ) : (
            <>
              <div className="sot-search">
                <Search size={20}/>

                <input
                  type="search"
                  placeholder="Search by username..."
                  aria-label="Search Scene users"
                  value={query}
                  onChange={event => {
                    setQuery(event.target.value);
                    setResults([]);
                    setSearchError('');
                    setLoading(
                      event.target.value.trim().length >= 2
                    );
                  }}
                />

                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                  >
                    <X size={17}/>
                  </button>
                )}
              </div>

              <div className="sot-search-results">

                {loading ? (
                  <UserSkeletons/>
                ) : searchError ? (
                  <div className="sot-search-empty" role="alert">
                    <AlertCircle size={26}/>
                    <p>{searchError}</p>
                  </div>
                ) : query.trim().replace(/^@/, '').length < 2 ? (
                  <div className="sot-search-empty">
                    <Users size={30}/>
                    <strong>Find your team on Scene</strong>
                    <p>Enter a username to start searching.</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="sot-search-empty">
                    <Search size={28}/>
                    <strong>No users found</strong>
                    <p>Try another username.</p>
                  </div>
                ) : (
                  <div className="sot-results">
                    {results.map(user => {
                      const added = members.some(
                        member => member.userId === user.userId
                      );

                      return (
                        <button
                          key={user.userId}
                          type="button"
                          className="sot-user-row sot-user-result"
                          disabled={added}
                          onClick={() => setSelected(user)}
                        >
                          <UserAvatar user={user}/>

                          <div className="sot-user-info">
                            <strong className="sot-username" dir="ltr">@{user.username}</strong>
                          </div>

                          <div className={
                            added
                              ? 'sot-add-user added'
                              : 'sot-add-user'
                          }>
                            {added
                              ? <Check size={19}/>
                              : <Plus size={19}/>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            </>
          )}
        </StudioToolModal>
      )}

    </div>
  );
}
