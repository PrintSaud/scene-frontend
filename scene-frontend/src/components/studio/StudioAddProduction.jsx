import { useEffect, useRef, useState } from 'react';

import {
  ArrowLeft, Building2, Clapperboard, Search,
  Plus, X, Image as ImageIcon, UserRound,
  Film, Globe, Clock, Eye, PenLine, AlertCircle,
  Play, Check, ExternalLink,
  ChevronUp, ChevronDown, Trash2,
} from 'lucide-react';

import api from '../../api/api';

import StudioCoverCropper from './StudioCoverCropper';

import {
  ArticlePhoto,
  isArticlePhoto,
} from './StudioArticleEditor';

import {
  StudioMediaPoster,
} from './StudioMediaPicker';

import { saveStudioDraft } from './studioDraftStore';

import '../../styles/StudioCreateArticle.css';
import '../../styles/StudioCreateList.css';
import '../../styles/StudioAddProduction.css';

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy',
  'Crime', 'Documentary', 'Drama', 'Family',
  'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Science Fiction',
  'Thriller', 'War', 'Western',
];

const COUNTRY_CODES = (
  'AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ ' +
  'BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR BN BG BF BI ' +
  'CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ ' +
  'DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF ' +
  'GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM HN HK HU ' +
  'IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG ' +
  'LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM ' +
  'NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA ' +
  'RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY ' +
  'TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VA VE VN VG VI WF EH YE ZM ZW'
).split(/\s+/);

const displayNames = new Intl.DisplayNames(
  ['en'], { type: 'region' }
);

const COUNTRIES = COUNTRY_CODES
  .map(code => ({
    code,
    name: displayNames.of(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const ROLES = [
  'Production Company',
  'Co-producer',
  'Producer',
  'Director',
  'Distributor',
  'Film Club',
  'Other',
];

const PLATFORMS = [
  'YouTube',
  'Vimeo',
  'Official Website',
  'Other',
];

const MAX_ALTERNATIVE_ARTWORK = 12;

function id() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random()}`;
}

function makePerson() {
  return {
    id: id(),
    name: '',
    character: '',
    photo: null,
  };
}

function makeForm(original) {
  return {
    mode: original?.mode || '',
    existingMovie: original?.existingMovie || null,
    title: original?.title || '',
    tagline: original?.tagline || '',
    overview: original?.overview || '',
    releaseYear: original?.releaseYear || '',
    runtime: original?.runtime || '',
    country: original?.country || '',
    genres: original?.genres || [],
    format: original?.format || 'Short Film',
    role: original?.role || 'Production Company',

    director: original?.director || makePerson(),
    cast: original?.cast || Array.from(
      { length: 4 }, makePerson
    ),

    poster: original?.poster || null,
    posterOriginal: original?.posterOriginal || null,
    backdrop: original?.backdrop || null,
    backdropOriginal: original?.backdropOriginal || null,

    alternativePosters: original?.alternativePosters || [],
    alternativeBackdrops: original?.alternativeBackdrops || [],

    watchPlatform: original?.watchPlatform || 'YouTube',
    watchUrl: original?.watchUrl || '',
    trailerUrl: original?.trailerUrl || '',
  };
}

function safeUrl(value) {
  if (!value?.trim()) return '';

  try {
    const url = new URL(value.trim());

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password
    ) return '';

    return url.href;
  } catch {
    return '';
  }
}

function normalizeMovie(movie) {
  const tmdbId = movie.tmdbId || movie.id;
  if (!tmdbId || !movie.title) return null;

  const poster = movie.posterPath || movie.poster_path || '';

  return {
    tmdbId,
    mediaType: 'movie',
    title: movie.title,
    posterPath: poster,
    poster_path: poster,
    year: movie.year ||
      (movie.releaseDate || movie.release_date || '').slice(0, 4),
  };
}

/* Existing Scene movie search, not a new TMDB client. */

function MovieSearch({ selected, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const term = query.trim();

    setResults([]);
    setError('');

    if (!term) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(
          '/api/search/movies',
          {
            params: { query: term, q: term },
            signal: controller.signal,
          }
        );

        const rows = Array.isArray(data)
          ? data
          : data?.results || data?.movies || data?.data;

        if (!Array.isArray(rows)) {
          throw new Error('Unexpected movie search response');
        }

        const seen = new Set();

        const movies = rows
          .map(normalizeMovie)
          .filter(movie => {
            if (!movie || seen.has(movie.tmdbId)) {
              return false;
            }

            seen.add(movie.tmdbId);
            return true;
          });

        if (!controller.signal.aborted) {
          setResults(movies);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Movie search failed. Please try again.');
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
  }, [query]);

  return (
    <div className="sprod-search">

      <div className="sprod-search-input">
        <Search size={20}/>
        <input
          placeholder="Search movies on Scene..."
          aria-label="Search movies"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="sprod-error">{error}</p>}

      {loading ? (
        <div className="sprod-search-grid" aria-busy="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="sprod-movie-skeleton"
            />
          ))}
        </div>
      ) : (
        <div className="sprod-search-grid">
          {results.map(movie => (
            <button
              key={movie.tmdbId}
              type="button"
              className={
                selected?.tmdbId === movie.tmdbId
                  ? 'sprod-search-result active'
                  : 'sprod-search-result'
              }
              onClick={() => onSelect(movie)}
            >
              <StudioMediaPoster item={movie}/>
              <strong dir="auto">{movie.title}</strong>
              <span>{movie.year}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && query.trim() &&
        !results.length && !error && (
          <p className="sprod-muted">
            No movies found. You can submit a new movie instead.
          </p>
        )}
    </div>
  );
}

function Section({ title, subtitle, Icon, children }) {
  return (
    <section className="sprod-panel">
      <div className="sprod-section-head">

        <div className="sprod-icon">
          <Icon size={23}/>
        </div>

        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({
  label, optional, children,
}) {
  return (
    <label className="sprod-field">
      <span>
        {label}
        {optional && <small>Optional</small>}
      </span>

      {children}
    </label>
  );
}

function PersonEditor({
  person,
  director = false,
  onChange,
  onError,
}) {
  const input = useRef(null);

  return (
    <div className="sprod-person">

      <button
        type="button"
        className="sprod-person-photo"
        title="Choose person photo"
        aria-label={`Choose ${director ? 'director' : 'actor'} photo`}
        onClick={() => input.current?.click()}
      >
        {person.photo ? (
          <ArticlePhoto file={person.photo}/>
        ) : (
          <UserRound size={31}/>
        )}

        <span className="sprod-photo-plus">
          <Plus size={12}/>
        </span>
      </button>

      <input
        type="file"
        ref={input}
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';

          if (!file) return;

          if (!isArticlePhoto(file)) {
            onError('Choose a photo up to 10 MB.');
            return;
          }

          onError('');
          onChange({ photo: file });
        }}
      />

      <div className="sprod-person-fields">
        <input
          placeholder={director ? 'Director name' : 'Actor name'}
          aria-label={director ? 'Director name' : 'Actor name'}
          dir="auto"
          value={person.name}
          onChange={e => onChange({ name: e.target.value })}
        />

        {!director && (
          <input
            placeholder="Character name (optional)"
            aria-label="Character name"
            dir="auto"
            value={person.character}
            onChange={e => onChange({
              character: e.target.value,
            })}
          />
        )}
      </div>

      {person.photo && (
        <button
          type="button"
          className="sprod-icon-button"
          aria-label="Remove person photo"
          onClick={() => onChange({ photo: null })}
        >
          <X size={16}/>
        </button>
      )}

    </div>
  );
}

function ArtworkEditor({
  label,
  ratio,
  file,
  original,
  onChoose,
  onAdjust,
  onRemove,
}) {
  const input = useRef(null);

  return (
    <div className="sprod-artwork">

      <input
        type="file"
        ref={input}
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onChoose(file);
        }}
      />

      <div
        className="sprod-artwork-frame"
        style={{ aspectRatio: ratio }}
      >
        {file ? (
          <ArticlePhoto file={file}/>
        ) : (
          <button
            type="button"
            className="sprod-upload"
            onClick={() => input.current?.click()}
          >
            <ImageIcon size={29}/>
            <strong>Upload {label}</strong>
            <span>JPG, PNG or WebP</span>
            <span>Up to 10 MB</span>
          </button>
        )}
      </div>

      {file && (
        <div className="sprod-artwork-actions">

          <button
            type="button"
            className="sa-secondary"
            onClick={() => input.current?.click()}
          >
            Change
          </button>

          <button
            type="button"
            className="sa-secondary"
            onClick={() => onAdjust(original || file)}
          >
            Adjust Crop
          </button>

          <button
            type="button"
            className="sprod-icon-button"
            aria-label={`Remove ${label}`}
            onClick={onRemove}
          >
            <X size={17}/>
          </button>

        </div>
      )}
    </div>
  );
}

function AlternativeArtwork({
  label, items, onChange, onError, ratio,
}) {
  const input = useRef(null);

  function addFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    const available = Math.max(
      0,
      MAX_ALTERNATIVE_ARTWORK - items.length
    );

    const valid = files.filter(isArticlePhoto);
    const chosen = valid.slice(0, available);

    if (chosen.length !== files.length) {
      onError(
        'Some images were skipped. Maximum 12 images, ' +
        'JPG, PNG or WebP up to 10 MB each.'
      );
    } else {
      onError('');
    }

    onChange([
      ...items,
      ...chosen.map(file => ({
        id: id(),
        file,
      })),
    ]);
  }

  return (
    <div className="sprod-alternatives">

      <div className="sprod-alternative-heading">
        <strong>{label}</strong>
        <span>{items.length}/{MAX_ALTERNATIVE_ARTWORK}</span>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={addFiles}
      />

      <div className={
        ratio < 1
          ? 'sprod-alt-grid posters'
          : 'sprod-alt-grid backdrops'
      }>
        {items.map(item => (
          <div
            className="sprod-alt-image"
            key={item.id}
          >
            <ArticlePhoto file={item.file}/>

            <button
              type="button"
              aria-label="Remove artwork"
              className="sprod-remove-overlay"
              onClick={() => onChange(
                items.filter(x => x.id !== item.id)
              )}
            >
              <X size={14}/>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="sprod-add-artwork"
        disabled={items.length >= MAX_ALTERNATIVE_ARTWORK}
        onClick={() => input.current?.click()}
      >
        <Plus size={17}/> Add {label}
      </button>

    </div>
  );
}

function PersonPreview({ person, director }) {
  return (
    <div className="sprod-credit-preview">

      <div className="sprod-credit-photo">
        {person.photo ? (
          <ArticlePhoto file={person.photo}/>
        ) : (
          <UserRound size={35}/>
        )}
      </div>

      <strong dir="auto">{person.name}</strong>

      <span dir="auto">
        {director ? 'Director' : person.character || 'Actor'}
      </span>
    </div>
  );
}

function MoviePreview({ form, org }) {
  const country = COUNTRIES.find(
    item => item.code === form.country
  )?.name;

  const watch = safeUrl(form.watchUrl);
  const trailer = safeUrl(form.trailerUrl);
  // SCENE_PRODUCTION_FULL_CAST_V2
  const fullCast = form.cast.filter(p => p.name.trim());
  const starring = fullCast.slice(0, 4);
  const additionalCast = fullCast.slice(4);

  return (
    <article className="sprod-preview">

      {form.backdrop && (
        <div className="sprod-preview-backdrop">
          <ArticlePhoto file={form.backdrop} cover/>
        </div>
      )}

      <div className="sprod-preview-body">

        <div className="sprod-movie-identity">

          <div className="sprod-preview-poster">
            {form.mode === 'existing' && form.existingMovie ? (
              <StudioMediaPoster item={form.existingMovie}/>
            ) : form.poster ? (
              <ArticlePhoto file={form.poster}/>
            ) : (
              <Film size={36}/>
            )}
          </div>

          <div className="sprod-movie-copy">

            <h1 dir="auto">
              {form.title ||
                form.existingMovie?.title ||
                'Untitled movie'}
            </h1>

            <p className="sprod-muted">
              {[
                form.releaseYear || form.existingMovie?.year,
                form.runtime ? `${form.runtime} min` : '',
                country,
              ].filter(Boolean).join(' · ')}
            </p>

            {form.tagline && (
              <p className="sprod-tagline" dir="auto">
                {form.tagline}
              </p>
            )}

            <div className="sprod-genres">
              {form.genres.map(genre => (
                <span key={genre}>{genre}</span>
              ))}
            </div>

            <div className="sprod-watch-buttons">

              {watch && (
                <a
                  className="sa-primary"
                  href={watch}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play size={17}/> Watch Film
                </a>
              )}

              {trailer && (
                <a
                  className="sa-secondary"
                  href={trailer}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play size={16}/> Trailer
                </a>
              )}

            </div>
          </div>
        </div>

        <div className="sprod-preview-org">
          {org?.logoUrl
            ? <img src={org.logoUrl} alt=""/>
            : <Building2 size={23}/>}

          <div>
            <strong dir="auto">{org?.name}</strong>
            <span>{form.role}</span>
          </div>
        </div>

        {form.overview && (
          <section className="sprod-preview-section">
            <h2>Overview</h2>
            <p dir="auto">{form.overview}</p>
          </section>
        )}

        {form.director?.name?.trim() && (
          <section className="sprod-preview-section">
            <h2>Director</h2>

            <div className="sprod-credit-grid">
              <PersonPreview
                person={form.director}
                director
              />
            </div>
          </section>
        )}

        {!!starring.length && (
          <section className="sprod-preview-section">
            <h2>Starring</h2>

            <div className="sprod-credit-grid">
              {starring.map(person => (
                <PersonPreview
                  key={person.id}
                  person={person}
                />
              ))}
            </div>
          </section>
        )}

        {!!additionalCast.length && (
          <section className="sprod-preview-section">
            <h2>Full Cast</h2>

            <div className="sprod-credit-grid">
              {fullCast.map(person => (
                <PersonPreview
                  key={person.id}
                  person={person}
                />
              ))}
            </div>
          </section>
        )}

        {!!form.alternativePosters.length && (
          <section className="sprod-preview-section">
            <h2>Posters</h2>

            <div className="sprod-alt-grid posters">
              {form.alternativePosters.map(item => (
                <ArticlePhoto
                  key={item.id}
                  file={item.file}
                />
              ))}
            </div>
          </section>
        )}

        {!!form.alternativeBackdrops.length && (
          <section className="sprod-preview-section">
            <h2>Backdrops</h2>

            <div className="sprod-alt-grid backdrops">
              {form.alternativeBackdrops.map(item => (
                <ArticlePhoto
                  key={item.id}
                  file={item.file}
                />
              ))}
            </div>
          </section>
        )}

        <div className="sprod-preview-note">
          Movie preview only. Logging, ratings and reviews
          will be connected during backend integration.
        </div>

      </div>
    </article>
  );
}

export default function StudioAddProduction({
  org,
  initialDraft = null,
  onBack,
  onDirtyChange,
  onSaved,
}) {
  const [form, setForm] = useState(
    () => makeForm(initialDraft?.production)
  );

  const [crop, setCrop] = useState(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const baseline = useRef(form);
  const saveLock = useRef(false);
  const mounted = useRef(true);

  const dirty = baseline.current !== form;

  const hasContent = Boolean(
    form.mode === 'existing'
      ? form.existingMovie
      : form.title.trim() ||
        form.tagline.trim() ||
        form.overview.trim() ||
        form.runtime ||
        form.releaseYear ||
        form.country ||
        form.genres.length ||
        form.poster ||
        form.backdrop ||
        form.alternativePosters.length ||
        form.alternativeBackdrops.length ||
        form.director.name.trim() ||
        form.cast.some(p => p.name.trim() || p.photo) ||
        form.watchUrl ||
        form.trailerUrl
  );

  const ready = form.mode === 'existing'
    ? Boolean(form.existingMovie)
    : Boolean(
        form.title.trim() &&
        form.overview.trim() &&
        form.country &&
        form.genres.length &&
        Number(form.runtime) > 0 &&
        /^\d{4}$/.test(String(form.releaseYear)) &&
        form.director.name.trim() &&
        form.poster
      );

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
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

  function update(changes) {
    setForm(previous => ({
      ...previous,
      ...changes,
    }));
  }

  function chooseMode(mode) {
    update({ mode });
    setPreview(false);
    setError('');
  }

  function updateDirector(changes) {
    setForm(previous => ({
      ...previous,
      director: {
        ...previous.director,
        ...changes,
      },
    }));
  }

  function updateActor(actorId, changes) {
    setForm(previous => ({
      ...previous,
      cast: previous.cast.map(actor =>
        actor.id === actorId
          ? { ...actor, ...changes }
          : actor
      ),
    }));
  }

  function addActor() {
    setForm(previous => ({
      ...previous,
      cast: [...previous.cast, makePerson()],
    }));
  }

  function removeActor(actorId) {
    setForm(previous => ({
      ...previous,
      cast: previous.cast.filter(
        actor => actor.id !== actorId
      ),
    }));
  }

  function moveActor(actorId, direction) {
    setForm(previous => {
      const from = previous.cast.findIndex(
        actor => actor.id === actorId
      );

      const to = from + direction;

      if (
        from < 0 ||
        to < 0 ||
        to >= previous.cast.length
      ) return previous;

      const cast = [...previous.cast];

      [cast[from], cast[to]] = [cast[to], cast[from]];

      return { ...previous, cast };
    });
  }

  function toggleGenre(genre) {
    setForm(previous => ({
      ...previous,
      genres: previous.genres.includes(genre)
        ? previous.genres.filter(g => g !== genre)
        : [...previous.genres, genre],
    }));
  }

  function openCrop(field, file) {
    if (!isArticlePhoto(file)) {
      setError('Choose a JPG, PNG or WebP image up to 10 MB.');
      return;
    }

    setError('');

    setCrop({
      field,
      file,
      ratio: field === 'poster' ? 2 / 3 : 16 / 9,
    });
  }

  function applyCrop(file) {
    update({
      [crop.field]: file,
      [`${crop.field}Original`]: crop.file,
    });

    setCrop(null);
  }

  function goBack() {
    if (saving) return;

    if (
      dirty &&
      !window.confirm('Discard unsaved production changes?')
    ) return;

    onBack?.();
  }

  async function saveDraft() {
    if (!hasContent || saveLock.current) return;

    saveLock.current = true;
    setSaving(true);
    setError('');

    try {
      await saveStudioDraft(org, {
        id: initialDraft?.id,
        type: 'production',
        production: form,
      });

      if (mounted.current) onSaved?.();

    } catch {
      if (mounted.current) {
        setError(
          'Could not save the production. Your changes are still here.'
        );

        setSaving(false);
      }
    } finally {
      saveLock.current = false;
    }
  }

  return (
    <main className="sprod-page">

      <header className="sprod-heading">

        <button
          className="sa-back"
          type="button"
          aria-label="Back"
          disabled={saving}
          onClick={goBack}
        >
          <ArrowLeft size={22}/>
        </button>

        <div className="sprod-heading-copy">
          <h1>
            {preview ? 'Movie Preview' : 'Add Production'}
          </h1>
          <p>Showcase the movies your organization creates.</p>
        </div>

        <div className="sprod-heading-actions">

          {form.mode && (
            <button
              type="button"
              className="sa-secondary"
              disabled={saving}
              onClick={() => setPreview(value => !value)}
            >
              {preview ? <PenLine size={16}/> : <Eye size={16}/>}
              {preview ? 'Edit' : 'Preview'}
            </button>
          )}

          <button
            type="button"
            className="sa-secondary"
            disabled={!hasContent || saving}
            onClick={saveDraft}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="sa-primary"
            disabled
            title={
              ready
                ? 'Submission API is not connected yet'
                : 'Complete the required movie information'
            }
          >
            Submit Movie
          </button>

        </div>

      </header>

      {error && (
        <div className="sprod-error" role="alert">
          <AlertCircle size={17}/> {error}
        </div>
      )}

      {preview ? (
        <MoviePreview form={form} org={org}/>
      ) : (

        <fieldset className="sprod-fields" disabled={saving}>

          <div className="sprod-mode-grid">

            <button
              type="button"
              className={
                form.mode === 'existing'
                  ? 'sprod-mode active'
                  : 'sprod-mode'
              }
              onClick={() => chooseMode('existing')}
            >
              <div className="sprod-icon">
                <Search size={24}/>
              </div>

              <div>
                <strong>Find an existing movie</strong>
                <span>Connect a movie already on Scene.</span>
              </div>

              {form.mode === 'existing' && <Check size={19}/>}
            </button>

            <button
              type="button"
              className={
                form.mode === 'new'
                  ? 'sprod-mode active'
                  : 'sprod-mode'
              }
              onClick={() => chooseMode('new')}
            >
              <div className="sprod-icon">
                <Clapperboard size={24}/>
              </div>

              <div>
                <strong>Create a new movie</strong>
                <span>Submit a production not yet on Scene.</span>
              </div>

              {form.mode === 'new' && <Check size={19}/>}
            </button>

          </div>

          {form.mode === 'existing' && (

            <Section
              title="Find your movie"
              subtitle="Search Scene's existing movie catalog."
              Icon={Search}
            >
              <MovieSearch
                selected={form.existingMovie}
                onSelect={movie => update({
                  existingMovie: movie,
                })}
              />

              {form.existingMovie && (
                <div className="sprod-selected-movie">
                  <StudioMediaPoster item={form.existingMovie}/>

                  <div>
                    <strong>{form.existingMovie.title}</strong>
                    <p>{form.existingMovie.year}</p>
                  </div>

                  <button
                    type="button"
                    className="sprod-icon-button"
                    aria-label="Remove selected movie"
                    onClick={() => update({
                      existingMovie: null,
                    })}
                  >
                    <X size={18}/>
                  </button>
                </div>
              )}

              <Field label="Your organization's role">
                <select
                  value={form.role}
                  onChange={e => update({
                    role: e.target.value,
                  })}
                >
                  {ROLES.map(role => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </Field>

              <p className="sprod-muted">
                Existing movies retain their original identity,
                ratings and reviews. Organization credits will
                require verification.
              </p>
            </Section>

          )}

          {form.mode === 'new' && (

            <div className="sprod-layout">

              <div className="sprod-main-column">

                <Section
                  title="Movie details"
                  subtitle="The information viewers will see on Scene."
                  Icon={Clapperboard}
                >
                  <Field label="Movie title">
                    <input
                      value={form.title}
                      dir="auto"
                      maxLength={200}
                      placeholder="Enter the movie title..."
                      onChange={e => update({
                        title: e.target.value,
                      })}
                    />
                  </Field>

                  <Field label="Tagline" optional>
                    <input
                      value={form.tagline}
                      dir="auto"
                      maxLength={200}
                      placeholder="A few words that tell your story..."
                      onChange={e => update({
                        tagline: e.target.value,
                      })}
                    />
                  </Field>

                  <div className="sprod-two-col">

                    <Field label="Release year">
                      <input
                        type="number"
                        min="1888"
                        max="2100"
                        placeholder="2026"
                        value={form.releaseYear}
                        onChange={e => update({
                          releaseYear: e.target.value,
                        })}
                      />
                    </Field>

                    <Field label="Duration (minutes)">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="18"
                        value={form.runtime}
                        onChange={e => update({
                          runtime: e.target.value,
                        })}
                      />
                    </Field>

                    <Field label="Country of production">
                      <select
                        value={form.country}
                        onChange={e => update({
                          country: e.target.value,
                        })}
                      >
                        <option value="">Select country</option>

                        {COUNTRIES.map(country => (
                          <option
                            value={country.code}
                            key={country.code}
                          >
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Movie format">
                      <select
                        value={form.format}
                        onChange={e => update({
                          format: e.target.value,
                        })}
                      >
                        {[
                          'Short Film',
                          'Feature Film',
                          'Documentary',
                          'Other',
                        ].map(format => (
                          <option key={format}>{format}</option>
                        ))}
                      </select>
                    </Field>

                  </div>

                  <div className="sprod-field">
                    <span>Genres</span>

                    <div className="sprod-genre-picker">
                      {GENRES.map(genre => (
                        <button
                          key={genre}
                          type="button"
                          aria-pressed={form.genres.includes(genre)}
                          className={
                            form.genres.includes(genre)
                              ? 'active'
                              : ''
                          }
                          onClick={() => toggleGenre(genre)}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field label="Overview">
                    <textarea
                      rows={5}
                      dir="auto"
                      maxLength={5000}
                      placeholder="What is your movie about?"
                      value={form.overview}
                      onChange={e => update({
                        overview: e.target.value,
                      })}
                    />
                  </Field>

                  <Field label="Organization role">
                    <select
                      value={form.role}
                      onChange={e => update({
                        role: e.target.value,
                      })}
                    >
                      {ROLES.map(role => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </Field>

                </Section>

                <Section
                  title="Director"
                  subtitle="The director behind the movie."
                  Icon={UserRound}
                >
                  <PersonEditor
                    person={form.director}
                    director
                    onChange={updateDirector}
                    onError={setError}
                  />
                </Section>

                <Section
                  title="Cast"
                  subtitle="The first four credited actors appear in Starring."
                  Icon={UserRound}
                >
                  <div className="sprod-cast-summary">
                    <span>
                      {form.cast.filter(actor =>
                        actor.name.trim()
                      ).length} cast members
                    </span>

                    <button
                      type="button"
                      className="sa-secondary"
                      onClick={addActor}
                    >
                      <Plus size={16}/> Add Actor
                    </button>
                  </div>

                  <div className="sprod-person-list">
                    {form.cast.map((actor, index) => {
                      const creditedBefore = form.cast
                        .slice(0, index)
                        .filter(item => item.name.trim())
                        .length;

                      const isStarring =
                        Boolean(actor.name.trim()) &&
                        creditedBefore < 4;

                      return (
                        <div
                          className="sprod-cast-card"
                          key={actor.id}
                        >
                          <div className="sprod-cast-controls">
                            <div className="sprod-cast-label">
                              <span>Actor {index + 1}</span>

                              {isStarring && (
                                <span className="sprod-starring-label">
                                  Starring
                                </span>
                              )}
                            </div>

                            <div className="sprod-cast-buttons">
                              <button
                                type="button"
                                aria-label="Move actor up"
                                title="Move up"
                                disabled={index === 0}
                                onClick={() =>
                                  moveActor(actor.id, -1)
                                }
                              >
                                <ChevronUp size={17}/>
                              </button>

                              <button
                                type="button"
                                aria-label="Move actor down"
                                title="Move down"
                                disabled={
                                  index === form.cast.length - 1
                                }
                                onClick={() =>
                                  moveActor(actor.id, 1)
                                }
                              >
                                <ChevronDown size={17}/>
                              </button>

                              <button
                                type="button"
                                aria-label="Remove actor"
                                title="Remove actor"
                                onClick={() =>
                                  removeActor(actor.id)
                                }
                              >
                                <Trash2 size={15}/>
                              </button>
                            </div>
                          </div>

                          <PersonEditor
                            person={actor}
                            onChange={changes =>
                              updateActor(actor.id, changes)
                            }
                            onError={setError}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="sprod-add-artwork sprod-add-actor"
                    onClick={addActor}
                  >
                    <Plus size={18}/> Add Another Actor
                  </button>

                  <p className="sprod-muted">
                    Add as many actors as needed. Reorder the
                    cast to choose your first four starring actors.
                    Photos and character names are optional.
                    Unnamed actors will not appear in movie credits.
                  </p>
                </Section>

                <Section
                  title="Where to watch"
                  subtitle="Optional links to your full movie and trailer."
                  Icon={Play}
                >
                  <Field label="Watch platform" optional>
                    <select
                      value={form.watchPlatform}
                      onChange={e => update({
                        watchPlatform: e.target.value,
                      })}
                    >
                      {PLATFORMS.map(platform => (
                        <option key={platform}>{platform}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Full movie URL" optional>
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://youtube.com/..."
                      value={form.watchUrl}
                      onChange={e => update({
                        watchUrl: e.target.value,
                      })}
                    />
                  </Field>

                  {form.watchUrl && !safeUrl(form.watchUrl) && (
                    <p className="sprod-inline-error">
                      Enter a valid HTTPS movie link.
                    </p>
                  )}

                  <Field label="Trailer URL" optional>
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://youtube.com/..."
                      value={form.trailerUrl}
                      onChange={e => update({
                        trailerUrl: e.target.value,
                      })}
                    />
                  </Field>

                  {form.trailerUrl && !safeUrl(form.trailerUrl) && (
                    <p className="sprod-inline-error">
                      Enter a valid HTTPS trailer link.
                    </p>
                  )}

                  <p className="sprod-muted">
                    Full movie links enable Watch Film.
                    Scene opens the external platform.
                  </p>
                </Section>

              </div>

              <aside className="sprod-artwork-column">

                <Section
                  title="Poster"
                  subtitle="Your main movie poster."
                  Icon={ImageIcon}
                >
                  <ArtworkEditor
                    label="poster"
                    ratio={2 / 3}
                    file={form.poster}
                    original={form.posterOriginal}
                    onChoose={file => openCrop('poster', file)}
                    onAdjust={file => openCrop('poster', file)}
                    onRemove={() => update({
                      poster: null,
                      posterOriginal: null,
                    })}
                  />
                </Section>

                <Section
                  title="Backdrop"
                  subtitle="Optional · Cinematic background."
                  Icon={ImageIcon}
                >
                  <ArtworkEditor
                    label="backdrop"
                    ratio={16 / 9}
                    file={form.backdrop}
                    original={form.backdropOriginal}
                    onChoose={file => openCrop('backdrop', file)}
                    onAdjust={file => openCrop('backdrop', file)}
                    onRemove={() => update({
                      backdrop: null,
                      backdropOriginal: null,
                    })}
                  />
                </Section>

                <Section
                  title="More artwork"
                  subtitle="Additional images for the movie's Media tab."
                  Icon={ImageIcon}
                >
                  <AlternativeArtwork
                    label="Posters"
                    ratio={2 / 3}
                    items={form.alternativePosters}
                    onChange={items => update({
                      alternativePosters: items,
                    })}
                    onError={setError}
                  />

                  <AlternativeArtwork
                    label="Backdrops"
                    ratio={16 / 9}
                    items={form.alternativeBackdrops}
                    onChange={items => update({
                      alternativeBackdrops: items,
                    })}
                    onError={setError}
                  />
                </Section>

              </aside>

            </div>

          )}

        </fieldset>

      )}

      {crop && (
        <StudioCoverCropper
          file={crop.file}
          aspectRatio={crop.ratio}
          outputWidth={crop.field === 'poster' ? 800 : 1600}
          title={
            crop.field === 'poster'
              ? 'Adjust Movie Poster'
              : 'Adjust Movie Backdrop'
          }
          onApply={applyCrop}
          onClose={() => setCrop(null)}
        />
      )}

      <footer className="sprod-footer">
        <AlertCircle size={15}/>
        Production drafts are saved locally.
        Movie submissions will be connected in the backend phase.
      </footer>

    </main>
  );
}
