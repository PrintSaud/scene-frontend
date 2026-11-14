import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, AlertCircle, ImageOff } from 'lucide-react';

import { API_KEY } from '../GifSearchModal';

const GIPHY_API = 'https://api.giphy.com/v1/gifs';

const categories = [
  { label: 'Recently Used', key: 'recent' },
  { label: 'Trending', key: 'trending' },
  { label: 'Sad', key: 'sad' },
  { label: 'Celebrating', key: 'celebration' },
  { label: 'Laughing', key: 'laugh' },
  { label: 'Mind Blown', key: 'mind blown' },
];

function recentKey(orgId) {
  return `scene-studio-recent-gifs:${orgId || 'local'}`;
}

function readRecent(orgId) {
  try {
    const value = JSON.parse(
      localStorage.getItem(recentKey(orgId)) || '[]'
    );

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveRecent(orgId, item) {
  try {
    const existing = readRecent(orgId);

    const next = [
      item,
      ...existing.filter(g => g.url !== item.url),
    ].slice(0, 20);

    localStorage.setItem(
      recentKey(orgId),
      JSON.stringify(next)
    );
  } catch {
    // Local storage is optional.
  }
}

function normalizeGif(gif) {
  const original = gif?.images?.original;
  const preview = gif?.images?.fixed_width;

  const url = original?.url;
  const previewUrl = preview?.webp || preview?.url || url;

  if (!url || !previewUrl) return null;

  return {
    id: gif.id,
    title: gif.title || 'GIF',
    url,
    previewUrl,
    width: Number(original?.width) || 200,
    height: Number(original?.height) || 150,
  };
}

function GifTile({ item, onSelect }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      className="sgp-gif-tile"
      style={{
        aspectRatio: `${item.width || 200} / ${item.height || 150}`,
      }}
      aria-label={`Select ${item.title || 'GIF'}`}
      onClick={() => onSelect(item)}
      disabled={failed}
    >
      {!loaded && !failed && (
        <div
          className="sgp-skeleton sgp-image-skeleton"
          aria-hidden="true"
        />
      )}

      {!failed ? (
        <img
          src={item.previewUrl || item.url}
          alt={item.title || 'GIF'}
          className={loaded ? 'sgp-gif-image loaded' : 'sgp-gif-image'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="sgp-image-error">
          <ImageOff size={20}/>
          <span>GIF unavailable</span>
        </div>
      )}
    </button>
  );
}

export default function StudioGifPicker({
  orgId,
  onSelect,
  onClose,
}) {
  const [gifs, setGifs] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const inputRef = useRef(null);
  const closeRef = useRef(null);

  // Prevent background scrolling while the modal is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

    function handleEsc(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEsc);
      previousFocus?.focus?.();
    };
  }, []);

  // One request per category/search change.
  // Abort stale requests when typing quickly.
  useEffect(() => {
    const controller = new AbortController();
    const query = search.trim();

    setError('');
    setLoading(true);
    setGifs([]);

    if (!query && activeTab === 'recent') {
      setGifs(readRecent(orgId));
      setLoading(false);

      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      try {
        const isTrending = !query && activeTab === 'trending';

        const params = new URLSearchParams({
          api_key: API_KEY,
          limit: '30',
          rating: 'pg-13',
        });

        if (!isTrending) {
          params.set('q', query || activeTab);
        }

        const endpoint = isTrending ? 'trending' : 'search';

        const response = await fetch(
          `${GIPHY_API}/${endpoint}?${params}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('GIPHY request failed.');
        }

        const data = await response.json();

        if (!Array.isArray(data.data)) {
          throw new Error('Invalid GIPHY response.');
        }

        if (!controller.signal.aborted) {
          setGifs(
            data.data.map(normalizeGif).filter(Boolean)
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            'Could not load GIFs. Please try again.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, query ? 350 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, activeTab, orgId, retry]);

  function selectGif(item) {
    saveRecent(orgId, item);

    // Use the original GIF for the actual attachment.
    onSelect(item.url);
  }

  function selectCategory(key) {
    setSearch('');
    setActiveTab(key);
  }

  return createPortal(
    <div
      className="sgp-overlay"
      onClick={onClose}
    >
      <section
        className="sgp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sgp-title"
        onClick={event => event.stopPropagation()}
      >
        <header className="sgp-header">
          <div>
            <h2 id="sgp-title">Choose a GIF</h2>
            <p>Find the perfect reaction.</p>
          </div>

          <button
            type="button"
            ref={closeRef}
            className="sgp-close"
            aria-label="Close GIF search"
            onClick={onClose}
          >
            <X size={21}/>
          </button>
        </header>

        <div className="sgp-search">
          <Search size={19}/>

          <input
            ref={inputRef}
            type="search"
            aria-label="Search GIPHY"
            placeholder="Search GIPHY"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
            >
              <X size={16}/>
            </button>
          )}
        </div>

        <div
          className="sgp-categories"
          aria-label="GIF categories"
        >
          {categories.map(({ label, key }) => (
            <button
              key={key}
              type="button"
              className={
                activeTab === key && !search.trim()
                  ? 'active'
                  : ''
              }
              onClick={() => selectCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="sgp-scroll">

          {loading ? (
            <div className="sgp-columns" aria-busy="true">
              {[0, 1].map(column => (
                <div className="sgp-column" key={column}>
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      className="sgp-skeleton"
                      key={index}
                      style={{
                        aspectRatio:
                          (column + index) % 3 === 0
                            ? '1 / 1'
                            : (column + index) % 3 === 1
                            ? '4 / 3'
                            : '16 / 9',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="sgp-empty" role="alert">
              <AlertCircle size={25}/>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry(v => v + 1)}
              >
                Try again
              </button>
            </div>
          ) : gifs.length === 0 ? (
            <div className="sgp-empty">
              <Search size={25}/>
              <p>
                {activeTab === 'recent' && !search.trim()
                  ? 'Your recently used GIFs will appear here.'
                  : 'No GIFs found. Try another search.'}
              </p>
            </div>
          ) : (
            <div className="sgp-columns">
              {[0, 1].map(column => (
                <div className="sgp-column" key={column}>
                  {gifs
                    .filter((_, index) => index % 2 === column)
                    .map((item, index) => (
                      <GifTile
                        key={`${item.id}-${item.url}-${index}`}
                        item={item}
                        onSelect={selectGif}
                      />
                    ))}
                </div>
              ))}
            </div>
          )}

          <footer className="sgp-attribution">
            <img
              src="/rrpowered-by-giphy.png"
              alt="Powered by GIPHY"
              onError={event => {
                event.currentTarget.style.display = 'none';
              }}
            />
            <span>Powered by GIPHY</span>
          </footer>

        </div>
      </section>
    </div>,
    document.body
  );
}
