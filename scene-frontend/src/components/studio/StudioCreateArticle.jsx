import { useEffect, useRef, useState } from 'react';

import {
  ArrowLeft, Building2, Image as ImageIcon,
  Clapperboard, Plus, X, Eye, PenLine,
  AlertCircle, Globe, Check,
} from 'lucide-react';

import StudioMediaPicker, {
  StudioMediaPoster,
} from './StudioMediaPicker';

import StudioArticleEditor, {
  ArticleBlockPreview,
  ArticlePhoto,
  cleanArticleHTML,
  getArticleText,
  getArticlePhotos,
  isArticlePhoto,
  makeArticleBlock,
} from './StudioArticleEditor';

import { saveStudioDraft } from './studioDraftStore';
import StudioCoverCropper from './StudioCoverCropper';

// SCENE_STUDIO_ARTICLE_CROPPER_V1

import '../../styles/StudioCreateArticle.css';

// SCENE_ARTICLE_FEATURED_HEADING_V1
const DEFAULT_FEATURED_HEADING =
  'Featured movies & TV shows';

const MAX_TITLE = 150;
const MAX_DESCRIPTION = 280;

function OrganizationIdentity({ org }) {
  return (
    <div className="sa-identity">
      {org?.logoUrl ? (
        <img src={org.logoUrl} alt={`${org.name} logo`}/>
      ) : (
        <div className="sa-logo-fallback">
          <Building2 size={24}/>
        </div>
      )}

      <div className="sa-author">
        <strong dir="auto">{org?.name}</strong>
        <span>Publishing as your organization</span>
      </div>

      <div className="sa-public">
        <Globe size={14}/> Public
      </div>
    </div>
  );
}

function FeaturedMedia({
  items,
  onRemove,
  readOnly = false,
}) {
  if (!items.length) return null;

  return (
    <div className={
      readOnly ? 'sa-media-grid sa-reader-media' : 'sa-media-grid'
    }>
      {items.map(item => (
        <div
          className="sa-media-card"
          key={`${item.mediaType}:${item.tmdbId}`}
        >
          <div className="sa-media-art">
            <StudioMediaPoster item={item}/>

            {!readOnly && (
              <button
                type="button"
                className="sa-remove-media"
                aria-label={`Remove ${item.title}`}
                onClick={() => onRemove(item)}
              >
                <X size={15}/>
              </button>
            )}
          </div>

          <strong dir="auto" title={item.title}>
            {item.title}
          </strong>

          <span>
            {item.mediaType === 'tv' ? 'TV Show' : 'Movie'}
            {item.year ? ` · ${item.year}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function StudioCreateArticle({
  org,
  initialDraft = null,
  onBack,
  onDirtyChange,
  onSaved,
}) {
  const original = initialDraft?.article;

  const [title, setTitle] = useState(original?.title || '');
  const [description, setDescription] = useState(
    original?.description || ''
  );

  const [cover, setCover] = useState(original?.cover || null);

  const [coverOriginal, setCoverOriginal] = useState(
    original?.coverOriginal || original?.cover || null
  );

  const [cropSource, setCropSource] = useState(null);

  const [blocks, setBlocks] = useState(
    () => original?.blocks?.length
      ? original.blocks
      : [makeArticleBlock()]
  );

  const [attachedMedia, setAttachedMedia] = useState(
    initialDraft?.attachedMedia || []
  );

  const [pickerOpen, setPickerOpen] = useState(false);

  const [featuredHeading, setFeaturedHeading] = useState(
    original?.featuredHeading ?? DEFAULT_FEATURED_HEADING
  );

  const [headingEditing, setHeadingEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const coverInput = useRef(null);
  const mounted = useRef(true);
  const saveLock = useRef(false);

  // Track the initially loaded values for accurate
  // unsaved-change detection.
  const baseline = useRef({
    title,
    description,
    cover,
    blocks,
    attachedMedia,
    featuredHeading,
  });

  const words = blocks
    .filter(block => block.type !== 'photo')
    .map(block => getArticleText(block.html))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const photoCount = blocks.reduce(
    (total, block) => total + (
      block.type === 'photo'
        ? getArticlePhotos(block).length
        : 0
    ),
    0
  );

  const hasBody = words > 0;

  const hasContent = Boolean(
    title.trim() ||
    description.trim() ||
    cover ||
    hasBody ||
    photoCount ||
    attachedMedia.length
  );

  const dirty = initialDraft
    ? (
        title !== baseline.current.title ||
        description !== baseline.current.description ||
        cover !== baseline.current.cover ||
        blocks !== baseline.current.blocks ||
        attachedMedia !== baseline.current.attachedMedia ||
        featuredHeading !== baseline.current.featuredHeading
      )
    : hasContent;

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;

    const handler = event => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);

    return () =>
      window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function goBack() {
    if (saving) return;

    if (
      dirty &&
      !window.confirm('Discard unsaved article changes?')
    ) {
      return;
    }

    onBack?.();
  }

  function selectCover(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!isArticlePhoto(file)) {
      setError('Choose a JPG, PNG or WebP cover up to 10 MB.');
      return;
    }

    setError('');
    setCropSource(file);
  }

  function applyCover(croppedFile) {
    setCoverOriginal(cropSource);
    setCover(croppedFile);
    setCropSource(null);
    setError('');
  }

  function removeCover() {
    setCover(null);
    setCoverOriginal(null);
    setCropSource(null);
  }

  function addMedia(item) {
    setAttachedMedia(previous => {
      const exists = previous.some(media =>
        media.mediaType === item.mediaType &&
        media.tmdbId === item.tmdbId
      );

      return exists ? previous : [...previous, item];
    });
  }

  function removeMedia(item) {
    setAttachedMedia(previous =>
      previous.filter(media =>
        media.mediaType !== item.mediaType ||
        media.tmdbId !== item.tmdbId
      )
    );
  }

  async function saveDraft() {
    if (!hasContent || saveLock.current) return;

    saveLock.current = true;
    setSaving(true);
    setError('');

    try {
      await saveStudioDraft(org, {
        id: initialDraft?.id,
        type: 'article',
        article: {
          title,
          description,
          featuredHeading,
          cover,
          coverOriginal,
          blocks: blocks.map(block =>
            block.type === 'photo'
              ? block
              : {
                  ...block,
                  html: cleanArticleHTML(block.html),
                }
          ),
        },
        attachedMedia,
      });

      if (mounted.current) {
        onSaved?.();
      }
    } catch {
      if (mounted.current) {
        setError(
          'Could not save your article. Your work is still here. Please try again.'
        );
        setSaving(false);
      }
    } finally {
      saveLock.current = false;
    }
  }

  return (
    <main className="sa-page">

      <header className="sa-page-heading">

        <button
          type="button"
          className="sa-back"
          aria-label="Back"
          disabled={saving}
          onClick={goBack}
        >
          <ArrowLeft size={22}/>
        </button>

        <div className="sa-heading-text">
          <h1>
            {preview ? 'Article Preview' : 'Create Article'}
          </h1>

          <p>
            {preview
              ? 'See your story through your readers’ eyes.'
              : 'Write a long-form piece for your audience.'}
          </p>
        </div>

        <div className="sa-heading-actions">
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
              !title.trim() || !hasBody
                ? 'A title and article body are required'
                : 'Publishing will be connected during the backend phase'
            }
          >
            Publish
          </button>
        </div>

      </header>

      {error && (
        <div className="sa-error" role="alert">
          <AlertCircle size={18}/> {error}
        </div>
      )}

      {preview ? (
        <article className="sa-reader">

          {cover && (
            <div className="sa-reader-cover">
              <ArticlePhoto
                file={cover}
                cover
                alt="Article cover"
              />
            </div>
          )}

          <div className="sa-reader-heading">
            <h1 dir="auto">
              {title.trim() || 'Untitled article'}
            </h1>

            {description && (
              <p className="sa-reader-description" dir="auto">
                {description}
              </p>
            )}

            <OrganizationIdentity org={org}/>

            <div className="sa-reader-time">
              {Math.max(1, Math.ceil(words / 200))} min read
              {' · Article preview'}
            </div>
          </div>

          <div className="sa-reader-body">
            {blocks.map(block => (
              <ArticleBlockPreview
                key={block.id}
                block={block}
              />
            ))}
          </div>

          {attachedMedia.length > 0 && (
            <section className="sa-reader-featured">
              {featuredHeading.trim() && (
                <h2 dir="auto">
                  {featuredHeading}
                </h2>
              )}

              <FeaturedMedia
                items={attachedMedia}
                readOnly
              />
            </section>
          )}

        </article>
      ) : (
        <fieldset className="sa-fields" disabled={saving}>

          <input
            type="file"
            ref={coverInput}
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={selectCover}
          />

          <div className={
            cover
              ? 'sa-cover sa-cover-filled'
              : 'sa-cover sa-cover-empty'
          }>
            {cover && (
              <ArticlePhoto
                file={cover}
                cover
                alt="Article cover preview"
              />
            )}

            <div className="sa-cover-controls">
              <div className="sa-cover-details">
                <div className="sa-cover-icon">
                  <ImageIcon size={26}/>
                </div>

                <div>
                  <strong>Article cover</strong>
                  <span>
                    Optional · Landscape image recommended
                  </span>
                </div>
              </div>

              <div className="sa-cover-buttons">
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
                      onClick={() => setCropSource(
                        coverOriginal || cover
                      )}
                    >
                      Adjust Crop
                    </button>

                    <button
                      type="button"
                      className="sa-remove-cover"
                      aria-label="Remove cover"
                      onClick={removeCover}
                    >
                      <X size={18}/>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="sa-article-details">

            <OrganizationIdentity org={org}/>

            <label className="sa-field-label" htmlFor="sa-title">
              Article title
            </label>

            <input
              id="sa-title"
              className="sa-title-input"
              placeholder="Give your article a title..."
              value={title}
              dir="auto"
              maxLength={MAX_TITLE}
              onChange={event => setTitle(event.target.value)}
            />

            <label
              className="sa-field-label"
              htmlFor="sa-description"
            >
              Description
              <span>Optional</span>
            </label>

            <textarea
              id="sa-description"
              className="sa-description-input"
              placeholder="A short summary of your article..."
              value={description}
              dir="auto"
              maxLength={MAX_DESCRIPTION}
              rows={2}
              onChange={event => setDescription(event.target.value)}
            />

            <div className="sa-description-count">
              {description.length}/{MAX_DESCRIPTION}
            </div>

          </div>

          <StudioArticleEditor
            blocks={blocks}
            onChange={setBlocks}
            onError={setError}
            disabled={saving}
          />

          <div className="sa-featured">

            <div className="sa-section-header">

              <div className="sa-featured-label">
                <div className="sa-cover-icon">
                  <Clapperboard size={24}/>
                </div>

                <div>
                  <div className="sa-featured-heading-row">

                    {headingEditing ? (
                      <input
                        className="sa-featured-heading-input"
                        aria-label="Featured section heading"
                        placeholder="Enter a section heading..."
                        value={featuredHeading}
                        maxLength={100}
                        dir="auto"
                        autoFocus
                        onChange={event =>
                          setFeaturedHeading(event.target.value)
                        }
                        onKeyDown={event => {
                          if (
                            event.key === 'Enter' ||
                            event.key === 'Escape'
                          ) {
                            event.preventDefault();
                            setHeadingEditing(false);
                          }
                        }}
                      />
                    ) : (
                      <h2 dir="auto">
                        {featuredHeading.trim() ||
                          'Movies & TV shows'}
                      </h2>
                    )}

                    <button
                      type="button"
                      className="sa-heading-edit"
                      aria-label={
                        headingEditing
                          ? 'Finish editing heading'
                          : 'Edit section heading'
                      }
                      onClick={() =>
                        setHeadingEditing(value => !value)
                      }
                    >
                      {headingEditing
                        ? <Check size={16}/>
                        : <PenLine size={15}/>}
                    </button>

                  </div>

                  <p>
                    {featuredHeading.trim()
                      ? 'Connect your article to titles on Scene.'
                      : 'Heading hidden in the published article.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="sa-secondary sa-add-titles"
                onClick={() => setPickerOpen(value => !value)}
              >
                {pickerOpen ? <Check size={17}/> : <Plus size={17}/>}
                {pickerOpen ? 'Done' : 'Add Titles'}
              </button>

            </div>

            {attachedMedia.length > 0 && (
              <p className="sa-media-count">
                {attachedMedia.length} selected · No title limit
              </p>
            )}

            <FeaturedMedia
              items={attachedMedia}
              onRemove={removeMedia}
            />

            {pickerOpen && (
              <div className="sa-picker">
                <StudioMediaPicker
                  existing={attachedMedia}
                  onSelect={addMedia}
                  onDone={() => setPickerOpen(false)}
                />
              </div>
            )}

          </div>

        </fieldset>
      )}

      {cropSource && (
        <StudioCoverCropper
          key="article-cover-crop"
          file={cropSource}
          aspectRatio={3}
          outputWidth={1500}
          onApply={applyCover}
          onClose={() => setCropSource(null)}
        />
      )}

      <footer className="sa-footer">
        <span>
          {words} {words === 1 ? 'word' : 'words'}
          {' · '}
          {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
          {' · '}
          {attachedMedia.length} titles
        </span>

        <span>Drafts saved locally · Publishing pending</span>
      </footer>

    </main>
  );
}
