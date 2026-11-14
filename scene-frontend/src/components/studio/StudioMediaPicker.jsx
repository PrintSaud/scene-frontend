import { useEffect, useMemo, useState } from 'react';
import {
  Search, X, Plus, Check, Clapperboard,
  AlertCircle, Film, Tv,
} from 'lucide-react';

import api from '../../api/api';

import filterMovies, {
  isQueryBanned,
} from '../../studioShared/utils/filterMovies';

import {
  isShowQueryBanned,
} from '../../studioShared/utils/filterShows';

import '../../styles/StudioMediaPicker.css';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';
const FALLBACK_POSTER = '/default-poster.jpg';

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
];

function getId(item, type) {
  const raw =
    (type === 'tv' ? item?.showTmdbId : null) ??
    item?.tmdbId ??
    item?.tmdb_id ??
    item?.id ??
    item?.movieId ??
    item?.movie?.tmdbId ??
    item?.movie?.id ??
    item?.show?.tmdbId ??
    item?.show?.id;

  const id = Number(raw);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeArray(value) {
  const candidates = [
    value,
    value?.results,
    value?.items,
    value?.movies,
    value?.shows,
    value?.data,
    value?.data?.results,
    value?.data?.items,
    value?.data?.shows,
    value?.data?.movies,
    value?.payload?.results,
    value?.payload?.items,
    value?.payload?.shows,
    value?.tv,
    value?.tv?.results,
  ];

  return candidates.find(Array.isArray) || [];
}

function getTitle(item, type) {
  const source =
    (type === 'tv' ? item?.show : item?.movie) ||
    item ||
    {};

  const arabic = String(
    source.original_language ||
    source.originalLanguage ||
    ''
  ).toLowerCase() === 'ar';

  if (type === 'tv') {
    if (arabic) {
      return (
        source.nameAr ||
        source.originalName ||
        source.original_name ||
        source.name ||
        source.nameEn ||
        source.title ||
        source.showName ||
        'Untitled Show'
      );
    }

    return (
      source.nameEn ||
      source.name ||
      source.title ||
      source.showName ||
      source.originalName ||
      source.original_name ||
      'Untitled Show'
    );
  }

  if (arabic) {
    return (
      source.titleAr ||
      source.arabicTitle ||
      source.original_title ||
      source.originalTitle ||
      source.title ||
      source.name ||
      'Untitled Movie'
    );
  }

  return (
    source.titleEn ||
    source.englishTitle ||
    source.title ||
    source.name ||
    source.original_title ||
    source.originalTitle ||
    'Untitled Movie'
  );
}

function getYear(item, type) {
  const source =
    (type === 'tv' ? item?.show : item?.movie) ||
    item ||
    {};

  const date =
    type === 'tv'
      ? source.firstAirDate ||
        source.first_air_date ||
        source.airDate ||
        item.firstAirDate ||
        item.first_air_date
      : source.releaseDate ||
        source.release_date ||
        item.releaseDate ||
        item.release_date;

  return String(date || '').slice(0, 4);
}

function posterValue(value) {
  if (typeof value === 'string') return value;

  return (
    value?.posterUrl ||
    value?.customPoster ||
    value?.url ||
    value?.imageUrl ||
    ''
  );
}

function getPoster(item, type) {
  const source =
    (type === 'tv' ? item?.show : item?.movie) ||
    item ||
    {};

  const raw = [
    item.posterOverride,
    item.customShowPoster,
    item.customPoster,
    item.displayPoster,
    item.posterUrl,
    item.poster,
    item.posterPath,
    item.poster_path,
    source.posterUrl,
    source.posterPath,
    source.poster_path,
    source.poster,
  ].map(posterValue).find(Boolean);

  if (!raw) return FALLBACK_POSTER;

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw === FALLBACK_POSTER) {
    return FALLBACK_POSTER;
  }

  if (raw.startsWith('/')) {
    return `${TMDB_IMAGE}${raw}`;
  }

  return FALLBACK_POSTER;
}

function normalizeMedia(item, type) {
  const id = getId(item, type);

  if (!id) return null;

  return {
    id,
    tmdbId: id,
    mediaType: type,
    title: getTitle(item, type),
    year: getYear(item, type),
    posterUrl: getPoster(item, type),
  };
}

function uniqueMedia(items) {
  const seen = new Set();

  return items.filter(item => {
    if (!item) return false;

    // Movies and TV can share a numeric TMDB ID.
    const key = `${item.mediaType}:${item.tmdbId}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

/* ================================================
   AUTHORITATIVE SCENE SEARCH
   ================================================ */

export async function searchStudioMedia(
  query,
  type = 'all',
  signal
) {
  const cleanQuery = String(query || '').trim();

  if (cleanQuery.length < 2) return [];

  const wantMovies = type === 'all' || type === 'movie';
  const wantShows = type === 'all' || type === 'tv';

  const movieAllowed =
    wantMovies && !isQueryBanned(cleanQuery);

  const showAllowed =
    wantShows && !isShowQueryBanned(cleanQuery);

  if (!movieAllowed && !showAllowed) {
    throw new Error('This search is not allowed.');
  }

  async function fetchMovies() {
    const response = await api.get('/api/search/movies', {
      params: {
        q: cleanQuery,
        sort: 'relevance',
      },
      signal,
    });

    const candidates = normalizeArray(response.data);

    // Preserve database manual allow overrides.
    const forceAllowed = candidates.filter(
      item => item?.__sceneForceAllow === true
    );

    // Only normal candidates pass through the movie filter.
    const normal = filterMovies(
      candidates.filter(
        item => item?.__sceneForceAllow !== true
      )
    );

    return uniqueMedia(
      [...forceAllowed, ...normal]
        .map(item => normalizeMedia(item, 'movie'))
    ).slice(0, 30);
  }

  async function fetchShows() {
    const response = await api.get('/api/search/shows', {
      params: { q: cleanQuery },
      signal,
    });

    // Same authoritative TV behavior as AddShowModal.
    // Do not re-filter server-approved show overrides.
    return uniqueMedia(
      normalizeArray(response.data)
        .map(item => normalizeMedia(item, 'tv'))
    ).slice(0, 30);
  }

  const tasks = [];

  if (movieAllowed) {
    tasks.push(fetchMovies());
  }

  if (showAllowed) {
    tasks.push(fetchShows());
  }

  const responses = await Promise.allSettled(tasks);

  if (signal?.aborted) return [];

  const failed = responses.filter(
    item => item.status === 'rejected'
  );

  // Do not silently claim there are no results if
  // one of the requested search endpoints failed.
  if (failed.length) {
    throw new Error(
      'Unable to search all requested titles. Please try again.'
    );
  }

  return uniqueMedia(
    responses.flatMap(result => result.value)
  ).slice(0, 60);
}

/* ================================================
   POSTER WITH IMAGE SKELETON
   ================================================ */

export function StudioMediaPoster({ item }) {
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(
    item.posterUrl || FALLBACK_POSTER
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setSrc(item.posterUrl || FALLBACK_POSTER);
  }, [item.posterUrl]);

  return (
    <div className="smp-poster">
      {!loaded && !failed && (
        <div className="smp-skeleton smp-poster-skeleton"/>
      )}

      {failed ? (
        <div className="smp-poster-empty">
          {item.mediaType === 'tv'
            ? <Tv size={22}/>
            : <Film size={22}/>}
        </div>
      ) : (
        <img
          src={src}
          alt={item.title || 'Poster'}
          className={loaded ? 'loaded' : ''}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (src !== FALLBACK_POSTER) {
              setSrc(FALLBACK_POSTER);
            } else {
              setFailed(true);
            }
          }}
        />
      )}
    </div>
  );
}

/* ================================================
   SEARCH RESULT SKELETONS
   ================================================ */

function MediaSkeletons() {
  return (
    <div className="smp-results" aria-busy="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="smp-skeleton-row" key={index}>
          <div className="smp-skeleton smp-skeleton-poster"/>

          <div className="smp-skeleton-info">
            <div
              className="smp-skeleton smp-skeleton-title"
              style={{ width: `${50 + index * 7}%` }}
            />

            <div className="smp-skeleton smp-skeleton-subtitle"/>
          </div>

          <div className="smp-skeleton smp-skeleton-circle"/>
        </div>
      ))}
    </div>
  );
}

/* ================================================
   REUSABLE PICKER
   ================================================ */

export default function StudioMediaPicker({
  onSelect,
  existing = [],
  initialType = 'all',
  maxItems = Infinity,
  onDone,
}) {
  const [query, setQuery] = useState('');

  const hasLimit = Number.isFinite(maxItems);
  const limitReached =
    hasLimit && existing.length >= maxItems;
  const [type, setType] = useState(initialType);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const existingKeys = useMemo(() => {
    return new Set(
      existing.map(item =>
        `${item.mediaType}:${item.tmdbId || item.id}`
      )
    );
  }, [existing]);

  useEffect(() => {
    const controller = new AbortController();
    const term = query.trim();

    setError('');
    setResults([]);

    if (term.length < 2) {
      setLoading(false);
      return () => controller.abort();
    }

    // Start skeletons immediately, including debounce time.
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const items = await searchStudioMedia(
          term,
          type,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setResults(items);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Search failed.');
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
  }, [query, type, retry]);

  function updateQuery(value) {
    setQuery(value);
    setResults([]);
    setError('');
    setLoading(value.trim().length >= 2);
  }

  function changeType(value) {
    if (value === type) return;

    setType(value);
    setResults([]);
    setError('');
    setLoading(query.trim().length >= 2);
  }

  return (
    <div className="smp-picker">

      {(hasLimit || onDone) && (
        <div className="smp-selection-header">

          <div>
            <strong>
              {existing.length} selected
            </strong>

            {hasLimit && (
              <span>
                {' '}of {maxItems} titles
              </span>
            )}
          </div>

          {onDone && (
            <button
              type="button"
              className="smp-done"
              onClick={onDone}
            >
              Done <Check size={15}/>
            </button>
          )}
        </div>
      )}

      {limitReached && (
        <div className="smp-selection-limit">
          <AlertCircle size={16}/>
          You've reached the {maxItems}-title limit.
          Remove a title to add another.
        </div>
      )}

      <div className="smp-search">
        <Search size={19}/>

        <input
          autoFocus
          type="search"
          dir="auto"
          value={query}
          placeholder="Search movies and TV shows..."
          aria-label="Search movies and TV shows"
          onChange={event => updateQuery(event.target.value)}
        />

        {query && (
          <button
            type="button"
            className="smp-clear"
            aria-label="Clear media search"
            onClick={() => updateQuery('')}
          >
            <X size={17}/>
          </button>
        )}
      </div>

      <div className="smp-tabs" aria-label="Media type">
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={type === value ? 'active' : ''}
            aria-pressed={type === value}
            onClick={() => changeType(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="smp-results-scroll">

        {loading ? (
          <MediaSkeletons/>
        ) : error ? (
          <div className="smp-empty" role="alert">
            <AlertCircle size={26}/>
            <p>{error}</p>

            {error !== 'This search is not allowed.' && (
              <button
                type="button"
                className="smp-retry"
                onClick={() => setRetry(value => value + 1)}
              >
                Try again
              </button>
            )}
          </div>
        ) : query.trim().length < 2 ? (
          <div className="smp-empty">
            <Clapperboard size={32}/>

            <strong>
              Find something worth sharing
            </strong>

            <p>Search for a movie or TV show to attach.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="smp-empty">
            <Search size={30}/>

            <strong>No results found</strong>

            <p>Try a different movie or TV show title.</p>
          </div>
        ) : (
          <div className="smp-results">
            {results.map(item => {
              const key =
                `${item.mediaType}:${item.tmdbId}`;

              const added = existingKeys.has(key);

              return (
                <button
                  type="button"
                  key={key}
                  className="smp-result"
                  disabled={added || limitReached}
                  onClick={() => {
                    if (!added && !limitReached) {
                      onSelect?.(item);
                    }
                  }}
                >
                  <StudioMediaPoster item={item}/>

                  <div className="smp-result-info">
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

                  <div className={
                    added
                      ? 'smp-add smp-added'
                      : 'smp-add'
                  }>
                    {added
                      ? <Check size={18}/>
                      : <Plus size={18}/>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
