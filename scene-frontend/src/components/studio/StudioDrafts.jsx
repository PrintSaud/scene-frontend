import { useEffect, useState } from 'react';
import {
  ArrowLeft, FileText, Plus, Trash2,
  Clock, Image, Clapperboard, AlertCircle,
} from 'lucide-react';

import {
  getStudioDrafts,
  deleteStudioDraft,
} from './studioDraftStore';

import '../../styles/StudioDrafts.css';

function draftTitle(draft) {
  if (draft.type === 'production') {
    return draft.production?.title?.trim()
      || draft.production?.existingMovie?.title
      || 'Untitled production';
  }
  if (draft.type === 'list') {
    return draft.list?.title?.trim() || 'Untitled list';
  }
  if (draft.type === 'article') {
    return draft.article?.title?.trim() || 'Untitled article';
  }
  const text = String(draft.text || '').trim();

  return text
    ? text.replace(/\s+/g, ' ').slice(0, 90)
    : 'Untitled post';
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function StudioDrafts({
  org,
  onBack,
  onOpen,
  onNew,
  onNewArticle,
  onNewList,
}) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let active = true;

    getStudioDrafts(org)
      .then(items => {
        if (active) setDrafts(items);
      })
      .catch(() => {
        if (active) {
          setError('Unable to load your saved drafts.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [org]);

  async function removeDraft(draft) {
    if (!window.confirm('Delete this draft permanently?')) {
      return;
    }

    setDeleting(draft.id);
    setError('');

    try {
      await deleteStudioDraft(org, draft.id);

      setDrafts(previous =>
        previous.filter(item => item.id !== draft.id)
      );
    } catch {
      setError('Could not delete the draft. Please try again.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="sdr-page">

      <header className="sdr-heading">
        <button
          type="button"
          className="sdr-back"
          aria-label="Back to dashboard"
          onClick={onBack}
        >
          <ArrowLeft size={21}/>
        </button>

        <div>
          <h1>Drafts</h1>
          <p>Pick up where you left off.</p>
        </div>

        <div className="sdr-new-actions">
          <button
            type="button"
            className="sdr-new sdr-new-article"
            onClick={onNewList}
          >
            <Plus size={17}/> New List
          </button>
          <button
            type="button"
            className="sdr-new sdr-new-article"
            onClick={onNewArticle}
          >
            <Plus size={17}/> New Article
          </button>

          <button
            type="button"
            className="sdr-new"
            onClick={onNew}
          >
            <Plus size={17}/> New Post
          </button>
        </div>
      </header>

      <div className="sdr-local-note">
        <AlertCircle size={16}/>
        Drafts are saved on this browser for {org?.name}.
        They are not published or synced to other devices.
      </div>

      {error && (
        <div className="sdr-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="sdr-list" aria-busy="true">
          {[1, 2, 3].map(i => (
            <div className="sdr-skeleton" key={i}/>
          ))}
        </div>
      ) : drafts.length ? (
        <>
          <div className="sdr-count">
            {drafts.length} saved {drafts.length === 1
              ? 'draft'
              : 'drafts'}
          </div>

          <div className="sdr-list">
            {drafts.map(draft => (
              <article className="sdr-card" key={draft.id}>

                <button
                  type="button"
                  className="sdr-open"
                  onClick={() => onOpen(draft)}
                >
                  <div className="sdr-icon">
                    <FileText size={24}/>
                  </div>

                  <div className="sdr-card-body">
                    <span className="sdr-type">
                      {draft.type === 'production'
                        ? 'PRODUCTION'
                        : draft.type === 'list'
                        ? 'LIST'
                        : draft.type === 'article'
                        ? 'ARTICLE'
                        : 'POST'} · DRAFT
                    </span>

                    <strong dir="auto">
                      {draftTitle(draft)}
                    </strong>

                    <div className="sdr-meta">
                      <span>
                        <Clock size={12}/>
                        {formatDate(draft.updatedAt)}
                      </span>

                      {draft.visualMedia?.length > 0 && (
                        <span>
                          <Image size={12}/>
                          {draft.visualMedia.length}
                        </span>
                      )}

                      {draft.attachedMedia?.length > 0 && (
                        <span>
                          <Clapperboard size={12}/>
                          {draft.attachedMedia.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="sdr-edit">Continue</span>
                </button>

                <button
                  type="button"
                  className="sdr-delete"
                  aria-label={`Delete ${draftTitle(draft)}`}
                  disabled={deleting === draft.id}
                  onClick={() => removeDraft(draft)}
                >
                  <Trash2 size={17}/>
                </button>

              </article>
            ))}
          </div>
        </>
      ) : !error ? (
        <div className="sdr-empty">
          <div className="sdr-empty-icon">
            <FileText size={34}/>
          </div>

          <h2>Your ideas start here</h2>

          <p>
            Save an unfinished post or article and come back
            whenever you're ready to publish.
          </p>

          <button
            type="button"
            className="sdr-new"
            onClick={onNew}
          >
            <Plus size={17}/>
            Create a post
          </button>
        </div>
      ) : null}
    </div>
  );
}
