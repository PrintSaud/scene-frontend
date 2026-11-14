import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Building2, Globe, Image as ImageIcon,
  Smile, Link2, Clapperboard, X, Search,
  Youtube, Instagram, ExternalLink, AlertCircle,
} from 'lucide-react';

import '../../styles/StudioCreatePost.css';
import StudioGifPicker from './StudioGifPicker';
import StudioPostGallery from './StudioPostGallery';
import { saveStudioDraft } from './studioDraftStore';

// SCENE_STUDIO_POST_GALLERY_V1
import StudioMediaPicker, { StudioMediaPoster } from './StudioMediaPicker';

// SCENE_STUDIO_MEDIA_V1

// SCENE_STUDIO_POST_V2

const MAX_LENGTH = 2000;
const MAX_VISUAL_ATTACHMENTS = 4;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function parseLink(value) {
  try {
    const url = new URL(value.trim());

    if (!['https:', 'http:'].includes(url.protocol)) {
      return null;
    }

    if (url.username || url.password) return null;

    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    let platform = 'Website';

    if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') {
      platform = 'YouTube';
    } else if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
      platform = 'Instagram';
    } else if (['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host)) {
      platform = 'X';
    } else if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      platform = 'TikTok';
    } else if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      platform = 'Vimeo';
    }

    let videoId = '';

    if (platform === 'YouTube') {
      if (host === 'youtu.be') {
        videoId = url.pathname.split('/')[1] || '';
      } else if (/^\/(shorts|embed|live)\//.test(url.pathname)) {
        videoId = url.pathname.split('/')[2] || '';
      } else {
        videoId = url.searchParams.get('v') || '';
      }

      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        videoId = '';
      }
    }

    return {
      url: url.href,
      host,
      platform,
      videoId,
      isRich: [
        'YouTube', 'Instagram', 'X', 'TikTok', 'Vimeo'
      ].includes(platform),
      thumbnail: videoId
        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        : '',
    };
  } catch {
    return null;
  }
}

export default function StudioCreatePost({
  org,
  onBack,
  onDirtyChange,
  initialDraft = null,
  onSaved,
}) {
  const [text, setText] = useState(
    initialDraft?.text || ''
  );

  const [savingDraft, setSavingDraft] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [panel, setPanel] = useState('');
  const [visualMedia, setVisualMedia] = useState(
    initialDraft?.visualMedia || []
  );
  const visualId = useRef(Date.now());
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [link, setLink] = useState(
    initialDraft?.link || null
  );
  const [urlInput, setUrlInput] = useState('');
  // SCENE_STUDIO_MULTI_MEDIA_V1
  const MAX_POST_MEDIA = 12;
  const [attachedMedia, setAttachedMedia] = useState(
    initialDraft?.attachedMedia || []
  );

  function addMedia(item) {
    setAttachedMedia(previous => {
      if (previous.length >= MAX_POST_MEDIA) {
        return previous;
      }

      const duplicate = previous.some(
        media =>
          media.mediaType === item.mediaType &&
          media.tmdbId === item.tmdbId
      );

      if (duplicate) return previous;

      return [...previous, item];
    });
  }

  function removeMedia(item) {
    setAttachedMedia(previous =>
      previous.filter(
        media =>
          media.mediaType !== item.mediaType ||
          media.tmdbId !== item.tmdbId
      )
    );
  }
  const [error, setError] = useState('');

  const photoInput = useRef(null);

  const hasContent = Boolean(
    text.trim() ||
    visualMedia.length > 0 ||
    link ||
    attachedMedia.length > 0
  );

  const dirty = initialDraft
    ? (
        text !== (initialDraft.text || '') ||
        visualMedia !== initialDraft.visualMedia ||
        link !== (initialDraft.link || null) ||
        attachedMedia !== initialDraft.attachedMedia
      )
    : hasContent;

  async function handleSaveDraft() {
    if (savingDraft || !hasContent) return;

    setSavingDraft(true);
    setError('');

    try {
      await saveStudioDraft(org, {
        id: initialDraft?.id,
        type: 'post',
        text,
        visualMedia,
        link,
        attachedMedia,
      });

      if (mountedRef.current) {
        onSaved?.();
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          'Could not save this draft. Your post is still here. ' +
          'Please try again or check browser storage.'
        );
        setSavingDraft(false);
      }
    }
  }

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;

    function beforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      window.removeEventListener(
        'beforeunload', beforeUnload
      );
    };
  }, [dirty]);

  function goBack() {
    if (
      dirty &&
      !window.confirm('Discard your unsaved post?')
    ) return;

    onBack?.();
  }

  function selectPhoto(event) {
    const files = Array.from(event.target.files || []);

    event.target.value = '';

    if (!files.length) return;

    const available =
      MAX_VISUAL_ATTACHMENTS - visualMedia.length;

    if (available <= 0) {
      setError('You can add up to 4 photos and GIFs.');
      return;
    }

    const validFiles = files.filter(file =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
      file.size <= MAX_PHOTO_BYTES
    );

    if (validFiles.length !== files.length) {
      setError(
        'Some files were skipped. Use JPG, PNG or WebP images up to 10 MB.'
      );
    } else if (validFiles.length > available) {
      setError('Only 4 visual attachments are allowed per post.');
    } else {
      setError('');
    }

    const additions = validFiles
      .slice(0, available)
      .map(file => ({
        id: `photo-${++visualId.current}`,
        type: 'photo',
        file,
      }));

    setVisualMedia(previous =>
      [...previous, ...additions].slice(
        0, MAX_VISUAL_ATTACHMENTS
      )
    );

    setPanel('');
  }

  function attachGif(gifUrl) {
    const existingGif = visualMedia.some(
      item => item.type === 'gif'
    );

    if (
      !existingGif &&
      visualMedia.length >= MAX_VISUAL_ATTACHMENTS
    ) {
      setError('Remove an attachment before adding a GIF.');
      setGifPickerOpen(false);
      return;
    }

    const nextGif = {
      id: `gif-${++visualId.current}`,
      type: 'gif',
      url: gifUrl,
    };

    setVisualMedia(previous => {
      if (previous.some(item => item.type === 'gif')) {
        return previous.map(item =>
          item.type === 'gif' ? nextGif : item
        );
      }

      if (previous.length >= MAX_VISUAL_ATTACHMENTS) {
        return previous;
      }

      return [...previous, nextGif];
    });

    setGifPickerOpen(false);
    setError('');
  }

  function removeVisualMedia(id) {
    setVisualMedia(previous =>
      previous.filter(item => item.id !== id)
    );
    setError('');
  }

  function togglePanel(next) {
    setError('');
    setUrlInput('');
    setPanel(current => current === next ? '' : next);
  }

  function addLink(event) {
    event.preventDefault();

    const parsed = parseLink(urlInput);

    if (!parsed) {
      setError('Please enter a valid HTTP or HTTPS link.');
      return;
    }

    setLink(parsed);
    setUrlInput('');
    setPanel('');
    setError('');
  }


  return (
    <div className="ssp-page">

      <div className="ssp-heading">
        <button
          type="button"
          className="ssp-back"
          aria-label="Back"
          onClick={goBack}
        >
          <ArrowLeft size={22}/>
        </button>

        <div className="ssp-heading-text">
          <h1>Create Post</h1>
          <p>Start a conversation with your community.</p>
        </div>

        <div className="ssp-heading-actions">
          <button
            type="button"
            className="ssp-save-draft"
            disabled={savingDraft || !hasContent}
            onClick={handleSaveDraft}
          >
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="ssp-publish"
            disabled
            title="Publishing API is not connected yet"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="ssp-composer">

        <div className="ssp-identity">
          {org?.logoUrl ? (
            <img
              className="ssp-logo"
              src={org.logoUrl}
              alt={`${org.name} logo`}
            />
          ) : (
            <div className="ssp-logo ssp-logo-placeholder">
              <Building2 size={25}/>
            </div>
          )}

          <div className="ssp-author">
            <strong>{org?.name}</strong>
            <span>Posting as your organization</span>
          </div>

          <span className="ssp-audience">
            <Globe size={14}/> Public
          </span>
        </div>

        <textarea
          className="ssp-textarea"
          aria-label="Post text"
          placeholder="What's happening in your Scene?"
          dir="auto"
          maxLength={MAX_LENGTH}
          value={text}
          onChange={event => setText(event.target.value)}
        />

        {visualMedia.length > 0 && (
          <StudioPostGallery
            items={visualMedia}
            maxItems={MAX_VISUAL_ATTACHMENTS}
            onRemove={removeVisualMedia}
          />
        )}

        {link && (
          <div className={
            link.isRich
              ? 'ssp-link-card ssp-rich-link'
              : 'ssp-link-card ssp-simple-link'
          }>

            {link.thumbnail && (
              <a
                className="ssp-link-video-art"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Watch video on YouTube"
              >
                <img
                  className="ssp-link-thumbnail"
                  src={link.thumbnail}
                  alt="YouTube video thumbnail"
                  onError={event => {
                    event.currentTarget.parentElement.style.display = 'none';
                  }}
                />

                <span className="ssp-video-play">
                  <Youtube size={34}/>
                </span>
              </a>
            )}

            <div className="ssp-link-body">

              {link.isRich && (
                <div
                  className="ssp-link-brand"
                  data-platform={link.platform}
                >
                  <span className="ssp-platform-icon">
                    {link.platform === 'YouTube' ? (
                      <Youtube size={22}/>
                    ) : link.platform === 'Instagram' ? (
                      <Instagram size={22}/>
                    ) : link.platform === 'X' ? (
                      <span className="ssp-x-logo">𝕏</span>
                    ) : link.platform === 'TikTok' ? (
                      <span className="ssp-tiktok-logo">♪</span>
                    ) : (
                      <Clapperboard size={22}/>
                    )}
                  </span>

                  <span>{link.platform}</span>
                </div>
              )}

              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ssp-link-open"
                dir="auto"
              >
                {link.platform === 'YouTube' && link.videoId
                  ? 'Watch video on YouTube'
                  : link.isRich
                  ? `View on ${link.platform}`
                  : link.url}

                <ExternalLink size={15}/>
              </a>

              {link.isRich && (
                <span className="ssp-link-host">
                  {link.host}
                </span>
              )}

              <button
                type="button"
                className="ssp-icon-button"
                aria-label="Remove link"
                onClick={() => setLink(null)}
              >
                <X size={18}/>
              </button>
            </div>
          </div>
        )}

        {attachedMedia.length > 0 && (
          <section className="smp-post-media">

            <div className="smp-post-media-header">
              <strong>Attached titles</strong>

              <span className="smp-post-media-count">
                {attachedMedia.length}/{MAX_POST_MEDIA}
              </span>
            </div>

            <div className="smp-post-media-grid">
              {attachedMedia.map(item => (
                <div
                  className="smp-post-media-card"
                  key={`${item.mediaType}:${item.tmdbId}`}
                >
                  <div className="smp-post-media-art">

                    <StudioMediaPoster item={item}/>

                    <button
                      type="button"
                      className="smp-post-media-remove"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeMedia(item)}
                    >
                      <X size={14}/>
                    </button>

                  </div>

                  <strong
                    className="smp-post-media-title"
                    dir="auto"
                    title={item.title}
                  >
                    {item.title}
                  </strong>

                  <span className="smp-post-media-meta">
                    {item.mediaType === 'tv'
                      ? 'TV Show'
                      : 'Movie'}
                    {item.year ? ` · ${item.year}` : ''}
                  </span>
                </div>
              ))}
            </div>

            {attachedMedia.length < MAX_POST_MEDIA ? (
              <button
                type="button"
                className="smp-post-add-more"
                onClick={() => {
                  setError('');
                  setPanel('media');
                }}
              >
                <Clapperboard size={18}/>
                Add more movies or TV shows
              </button>
            ) : (
              <div className="smp-post-limit">
                <AlertCircle size={15}/>
                Maximum of 12 titles reached.
                Remove a title to add another.
              </div>
            )}
          </section>
        )}

        <div className="ssp-visual-count">
          {visualMedia.length}/{MAX_VISUAL_ATTACHMENTS} visual attachments
        </div>

        <div className="ssp-toolbar">

          <input
            ref={photoInput}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={selectPhoto}
          />

          <div className="ssp-tools">
            <button
              type="button"
              title="Add photo"
              aria-label="Add photo"
              disabled={visualMedia.length >= MAX_VISUAL_ATTACHMENTS}
              onClick={() => photoInput.current?.click()}
            >
              <span className="ssp-tool-square">
                <ImageIcon size={22}/>
              </span>
              <span className="ssp-tool-label">
                Photo
              </span>
            </button>

            <button
              type="button"
              title="Add GIF"
              aria-label="Add GIF"
              aria-expanded={gifPickerOpen}
              disabled={
                visualMedia.length >= MAX_VISUAL_ATTACHMENTS &&
                !visualMedia.some(item => item.type === 'gif')
              }
              className={gifPickerOpen ? 'active' : ''}
              onClick={() => {
                setPanel('');
                setError('');
                setGifPickerOpen(true);
              }}
            >
              <span className="ssp-tool-square">
                <Smile size={22}/>
              </span>
              <span className="ssp-tool-label">
                GIF
              </span>
            </button>

            <button
              type="button"
              title="Add external link"
              aria-label="Add external link"
              aria-pressed={panel === 'link'}
              className={panel === 'link' ? 'active' : ''}
              onClick={() => togglePanel('link')}
            >
              <span className="ssp-tool-square">
                <Link2 size={22}/>
              </span>
              <span className="ssp-tool-label">
                Link
              </span>
            </button>

            <button
              type="button"
              title="Attach movie or TV show"
              aria-label="Attach movie or TV show"
              aria-pressed={panel === 'media'}
              className={panel === 'media' ? 'active' : ''}
              onClick={() => togglePanel('media')}
            >
              <span className="ssp-tool-square">
                <Clapperboard size={22}/>
              </span>
              <span className="ssp-tool-label">
                Movie / TV
              </span>
            </button>
          </div>

          <span className={
            text.length >= MAX_LENGTH
              ? 'ssp-counter ssp-counter-full'
              : 'ssp-counter'
          }>
            {text.length}/{MAX_LENGTH}
          </span>
        </div>

        {panel && (
          <div className="ssp-attachment-panel">
            <div className="ssp-panel-heading">
              <strong>
                {panel === 'link'
                  ? 'Add a link'
                  : 'Attach a movie or TV show'}
              </strong>

              <button
                type="button"
                className="ssp-icon-button"
                aria-label="Close attachment panel"
                onClick={() => setPanel('')}
              >
                <X size={18}/>
              </button>
            </div>

            {panel === 'link' && (
              <form onSubmit={addLink}>
                <p>
                  Share YouTube, Instagram, X, TikTok
                  or any external website.
                </p>

                <div className="ssp-input-row">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={event => setUrlInput(event.target.value)}
                    required
                  />
                  <button type="submit">
                    Attach
                  </button>
                </div>
              </form>
            )}

            {panel === 'media' && (
              <StudioMediaPicker
                existing={attachedMedia}
                maxItems={MAX_POST_MEDIA}
                onSelect={item => {
                  addMedia(item);
                  setError('');
                }}
                onDone={() => setPanel('')}
              />
            )}
          </div>
        )}

        {error && (
          <div className="ssp-error" role="alert">
            <AlertCircle size={16}/>
            {error}
          </div>
        )}
      </div>

      {gifPickerOpen && (
        <StudioGifPicker
          orgId={org?._id}
          onClose={() => setGifPickerOpen(false)}
          onSelect={attachGif}
        />
      )}

      <div className="ssp-bottom-note">
        <AlertCircle size={16}/>
        Composer preview. Publishing will be enabled
        when the organization posts API is connected.
      </div>
    </div>
  );
}
