import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ArrowLeft, Building2, Image as ImageIcon,
  Plus, X, Eye, PenLine, Check, List,
  ChevronUp, ChevronDown, GripVertical,
  AlertCircle,
} from 'lucide-react';

import StudioMediaPicker, {
  StudioMediaPoster,
} from './StudioMediaPicker';

import StudioCoverCropper from './StudioCoverCropper';

import {
  ArticlePhoto,
  isArticlePhoto,
} from './StudioArticleEditor';

import { saveStudioDraft } from './studioDraftStore';

import '../../styles/StudioCreateArticle.css';
import '../../styles/StudioCreateList.css';

const MAX_LIST_NAME = 150;
const MAX_DESCRIPTION = 2000;

const mediaKey = item =>
  `${item.mediaType}:${item.tmdbId}`;

function ListAuthor({ org }) {
  return (
    <div className="sl-author">
      {org?.logoUrl ? (
        <img
          src={org.logoUrl}
          alt={`${org.name} logo`}
        />
      ) : (
        <div className="sl-author-fallback">
          <Building2 size={22}/>
        </div>
      )}

      <div>
        <strong dir="auto">{org?.name}</strong>
        <span>Creating as your organization</span>
      </div>
    </div>
  );
}

function ListTitles({
  items,
  ranked,
  onRemove,
  onMove,
  onReorder,
  disabled,
}) {
  const dragKey = useRef(null);
  const [dragOver, setDragOver] = useState('');

  function clearDrag() {
    dragKey.current = null;
    setDragOver('');
  }

  return (
    <div className="sl-titles">
      {items.map((item, index) => {
        const key = mediaKey(item);

        return (
          <div
            key={key}
            className={
              dragOver === key
                ? 'sl-title-row sl-drag-over'
                : 'sl-title-row'
            }
            onDragOver={event => {
              if (!disabled && dragKey.current) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDragOver(key);
              }
            }}
            onDrop={event => {
              if (!dragKey.current || disabled) return;

              event.preventDefault();

              onReorder(dragKey.current, key);
              clearDrag();
            }}
          >
            <button
              type="button"
              className="sl-drag-handle"
              aria-label={`Reorder ${item.title}`}
              title="Drag to reorder"
              draggable={!disabled}
              disabled={disabled}
              onDragStart={event => {
                dragKey.current = key;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', key);
              }}
              onDragEnd={clearDrag}
            >
              <GripVertical size={20}/>
            </button>

            {ranked && (
              <span className="sl-rank">
                {index + 1}
              </span>
            )}

            <StudioMediaPoster item={item}/>

            <div className="sl-title-info">
              <strong dir="auto">
                {item.title}
              </strong>

              <span>
                {item.mediaType === 'tv'
                  ? 'TV Show'
                  : 'Movie'}
                {item.year ? ` · ${item.year}` : ''}
              </span>
            </div>

            <div className="sl-move-controls">
              <button
                type="button"
                aria-label={`Move ${item.title} up`}
                title="Move up"
                disabled={disabled || index === 0}
                onClick={() => onMove(key, -1)}
              >
                <ChevronUp size={17}/>
              </button>

              <button
                type="button"
                aria-label={`Move ${item.title} down`}
                title="Move down"
                disabled={disabled || index === items.length - 1}
                onClick={() => onMove(key, 1)}
              >
                <ChevronDown size={17}/>
              </button>
            </div>

            <button
              type="button"
              className="sl-remove"
              aria-label={`Remove ${item.title}`}
              disabled={disabled}
              onClick={() => onRemove(item)}
            >
              <X size={17}/>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ListPreview({
  org,
  title,
  description,
  cover,
  items,
  ranked,
}) {
  return (
    <article className="sl-reader">

      {cover && (
        <div className="sl-reader-cover">
          <ArticlePhoto
            file={cover}
            cover
            alt="List cover"
          />
        </div>
      )}

      <div className="sl-reader-body">

        <h1 dir="auto">
          {title.trim() || 'Untitled list'}
        </h1>

        {description && (
          <p className="sl-reader-description" dir="auto">
            {description}
          </p>
        )}

        <ListAuthor org={org}/>

        <div className="sl-reader-meta">
          {items.length}
          {' '}
          {items.length === 1 ? 'title' : 'titles'}
          {ranked ? ' · Ranked list' : ''}
        </div>

        <div className="sl-preview-grid">

          {items.map((item, index) => (
            <div
              className="sl-preview-card"
              key={mediaKey(item)}
            >
              <div className="sl-preview-art">
                <StudioMediaPoster item={item}/>
              </div>

              <div className="sl-preview-details">

                {ranked && (
                  <span className="sl-preview-rank">
                    {index + 1}
                  </span>
                )}

                <div className="sl-preview-text">
                  <strong dir="auto">
                    {item.title}
                  </strong>

                  <span className="sl-preview-meta">
                    {item.mediaType === 'tv'
                      ? 'TV Show'
                      : 'Movie'}
                    {item.year ? ` · ${item.year}` : ''}
                  </span>
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </article>
  );
}

export default function StudioCreateList({
  org,
  initialDraft = null,
  onBack,
  onDirtyChange,
  onSaved,
}) {
  const original = initialDraft?.list;

  const [title, setTitle] = useState(
    original?.title || ''
  );

  const [description, setDescription] = useState(
    original?.description || ''
  );

  const [ranked, setRanked] = useState(
    original?.ranked ?? false
  );

  const [cover, setCover] = useState(
    original?.cover || null
  );

  const [coverOriginal, setCoverOriginal] = useState(
    original?.coverOriginal || original?.cover || null
  );

  const [cropSource, setCropSource] = useState(null);

  const [items, setItems] = useState(
    initialDraft?.attachedMedia || []
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const coverInput = useRef(null);
  const mountedRef = useRef(true);
  const savingRef = useRef(false);

  const baseline = useRef({
    title,
    description,
    ranked,
    cover,
    items,
  });

  const hasContent = Boolean(
    title.trim() ||
    description.trim() ||
    cover ||
    items.length
  );

  const dirty =
    title !== baseline.current.title ||
    description !== baseline.current.description ||
    ranked !== baseline.current.ranked ||
    cover !== baseline.current.cover ||
    items !== baseline.current.items;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;

    const warn = event => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);

    return () =>
      window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function goBack() {
    if (saving) return;

    if (
      dirty &&
      !window.confirm('Discard unsaved list changes?')
    ) return;

    onBack?.();
  }

  function selectCover(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!isArticlePhoto(file)) {
      setError(
        'Choose a JPG, PNG or WebP cover up to 10 MB.'
      );
      return;
    }

    setError('');
    setCropSource(file);
  }

  function applyCover(file) {
    setCoverOriginal(cropSource);
    setCover(file);
    setCropSource(null);
  }

  function removeCover() {
    setCover(null);
    setCoverOriginal(null);
    setCropSource(null);
  }

  function addTitle(item) {
    setItems(previous => {
      if (
        previous.some(
          entry => mediaKey(entry) === mediaKey(item)
        )
      ) return previous;

      return [...previous, item];
    });
  }

  function removeTitle(item) {
    setItems(previous =>
      previous.filter(
        entry => mediaKey(entry) !== mediaKey(item)
      )
    );
  }

  function moveTitle(key, direction) {
    setItems(previous => {
      const from = previous.findIndex(
        item => mediaKey(item) === key
      );

      const to = from + direction;

      if (
        from < 0 ||
        to < 0 ||
        to >= previous.length
      ) return previous;

      const next = [...previous];

      [next[from], next[to]] = [next[to], next[from]];

      return next;
    });
  }

  function reorderTitle(fromKey, toKey) {
    if (fromKey === toKey) return;

    setItems(previous => {
      const from = previous.findIndex(
        item => mediaKey(item) === fromKey
      );

      const to = previous.findIndex(
        item => mediaKey(item) === toKey
      );

      if (from < 0 || to < 0) return previous;

      const next = [...previous];
      const [item] = next.splice(from, 1);

      next.splice(to, 0, item);

      return next;
    });
  }

  async function saveDraft() {
    if (!hasContent || savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setError('');

    try {
      await saveStudioDraft(org, {
        id: initialDraft?.id,
        type: 'list',
        list: {
          title,
          description,
          ranked,
          cover,
          coverOriginal,
        },
        attachedMedia: items,
      });

      if (mountedRef.current) {
        onSaved?.();
      }
    } catch {
      if (mountedRef.current) {
        setError(
          'Could not save your list. Your changes are still here.'
        );
        setSaving(false);
      }
    } finally {
      savingRef.current = false;
    }
  }

  return (
    <div className="sl-page">

      <header className="sl-heading">

        <button
          type="button"
          className="sa-back"
          aria-label="Back"
          disabled={saving}
          onClick={goBack}
        >
          <ArrowLeft size={22}/>
        </button>

        <div className="sl-heading-copy">
          <h1>{preview ? 'List Preview' : 'Create List'}</h1>
          <p>
            {preview
              ? 'See how your list will look on Scene.'
              : 'Curate something worth watching.'}
          </p>
        </div>

        <div className="sl-heading-actions">

          <button
            type="button"
            className="sa-secondary"
            disabled={saving}
            onClick={() => setPreview(value => !value)}
          >
            {preview ? <PenLine size={16}/> : <Eye size={16}/>}
            {preview ? 'Edit' : 'Preview'}
          </button>

          <button
            type="button"
            className="sa-secondary"
            disabled={saving || !hasContent}
            onClick={saveDraft}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="sa-primary"
            disabled
            title={
              !title.trim() || !items.length
                ? 'A name and at least one title are required'
                : 'Publishing will be connected during the backend phase'
            }
          >
            Publish
          </button>

        </div>
      </header>

      {error && (
        <div className="sl-error" role="alert">
          <AlertCircle size={18}/>
          {error}
        </div>
      )}

      {preview ? (

        <ListPreview
          org={org}
          title={title}
          description={description}
          cover={cover}
          items={items}
          ranked={ranked}
        />

      ) : (

        <fieldset className="sl-fields" disabled={saving}>

          <input
            ref={coverInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={selectCover}
          />

          {/* OPTIONAL COVER */}

          <section className={
            cover ? 'sl-cover filled' : 'sl-cover empty'
          }>

            {cover && (
              <ArticlePhoto
                file={cover}
                cover
                alt="List cover preview"
              />
            )}

            <div className="sl-cover-controls">

              <div className="sl-cover-info">
                <div className="sl-cover-icon">
                  <ImageIcon size={25}/>
                </div>

                <div>
                  <strong>List cover</strong>
                  <span>Optional · Cinematic 3:1 cover</span>
                </div>
              </div>

              <div className="sl-cover-actions">

                <button
                  type="button"
                  className="sa-secondary"
                  onClick={() => coverInput.current?.click()}
                >
                  <ImageIcon size={16}/>
                  {cover ? 'Change Cover' : 'Add Cover'}
                </button>

                {cover && (
                  <>
                    <button
                      type="button"
                      className="sa-secondary"
                      onClick={() =>
                        setCropSource(coverOriginal || cover)
                      }
                    >
                      Adjust Crop
                    </button>

                    <button
                      type="button"
                      className="sl-remove"
                      aria-label="Remove cover"
                      onClick={removeCover}
                    >
                      <X size={19}/>
                    </button>
                  </>
                )}

              </div>
            </div>
          </section>

          {/* LIST DETAILS */}

          <section className="sl-panel">

            <ListAuthor org={org}/>

            <label className="sl-label" htmlFor="sl-name">
              List name
            </label>

            <input
              id="sl-name"
              className="sl-name-input"
              placeholder="Give your list a name..."
              dir="auto"
              maxLength={MAX_LIST_NAME}
              value={title}
              onChange={event => setTitle(event.target.value)}
            />

            <label className="sl-label" htmlFor="sl-description">
              Description <span>Optional</span>
            </label>

            <textarea
              id="sl-description"
              className="sl-description-input"
              placeholder="What's this list about?"
              dir="auto"
              rows={4}
              maxLength={MAX_DESCRIPTION}
              value={description}
              onChange={event =>
                setDescription(event.target.value)
              }
            />

            <div className="sl-char-count">
              {description.length}/{MAX_DESCRIPTION}
            </div>

            <div className="sl-ranked-row">

              <div>
                <strong>Ranked list</strong>
                <p>Display a ranking number beside each title.</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Ranked list"
                aria-checked={ranked}
                className={
                  ranked
                    ? 'sl-switch active'
                    : 'sl-switch'
                }
                onClick={() => setRanked(value => !value)}
              >
                <span/>
              </button>

            </div>

          </section>

          {/* MOVIES AND TV SHOWS */}

          <section className="sl-panel">

            <div className="sl-section-heading">

              <div>
                <h2>Movies & TV shows</h2>

                <p>
                  {items.length} selected · No title limit
                </p>
              </div>

              <button
                type="button"
                className="sl-add-titles"
                onClick={() =>
                  setPickerOpen(value => !value)
                }
              >
                {pickerOpen
                  ? <Check size={17}/>
                  : <Plus size={17}/>}
                {pickerOpen ? 'Done' : 'Add Titles'}
              </button>

            </div>

            {pickerOpen && (
              <div className="sl-picker">

                <StudioMediaPicker
                  existing={items}
                  onSelect={addTitle}
                  onDone={() => setPickerOpen(false)}
                />

              </div>
            )}

            {items.length > 0 ? (
              <>
                <ListTitles
                  items={items}
                  ranked={ranked}
                  disabled={saving}
                  onRemove={removeTitle}
                  onMove={moveTitle}
                  onReorder={reorderTitle}
                />

                <p className="sl-reorder-hint">
                  Drag the handles on desktop or use the arrows
                  to arrange your titles.
                </p>
              </>
            ) : !pickerOpen ? (
              <div className="sl-empty">

                <div className="sl-empty-icon">
                  <List size={32}/>
                </div>

                <h3>Your list starts here</h3>

                <p>
                  Add movies and TV shows to create
                  your perfect collection.
                </p>

                <button
                  type="button"
                  className="sa-secondary"
                  onClick={() => setPickerOpen(true)}
                >
                  <Plus size={17}/> Add Your First Title
                </button>

              </div>
            ) : null}

          </section>

        </fieldset>
      )}

      {cropSource && (
        <StudioCoverCropper
          file={cropSource}
          aspectRatio={3}
          outputWidth={1500}
          title="Adjust List Cover"
          onApply={applyCover}
          onClose={() => setCropSource(null)}
        />
      )}

      <footer className="sl-footer">
        <span>{items.length} titles</span>
        <span>Drafts saved locally · Publishing pending</span>
      </footer>

    </div>
  );
}
