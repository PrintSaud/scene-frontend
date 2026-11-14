import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  X,
  ImageOff,
} from 'lucide-react';

function GalleryCard({ item, index, onRemove }) {
  const [src, setSrc] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  // SCENE_GALLERY_NATURAL_RATIO_V3
  const [orientation, setOrientation] = useState('landscape');
  const [ratio, setRatio] = useState(16 / 9);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setOrientation('landscape');
    setRatio(16 / 9);

    if (item.type === 'photo') {
      const url = URL.createObjectURL(item.file);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    }

    setSrc(item.url || '');
  }, [item.file, item.url, item.type]);

  return (
    <div
      className={
        orientation === 'portrait'
          ? 'spg-card spg-portrait'
          : 'spg-card spg-landscape'
      }
      style={{
        '--spg-ratio': ratio,
        '--spg-desktop-width': `${380 * ratio}px`,
        '--spg-mobile-width': `${300 * ratio}px`,
      }}
    >
      <div className="spg-image">
        {!loaded && !failed && (
          <div
            className="spg-skeleton"
            aria-hidden="true"
          />
        )}

        {failed ? (
          <div className="spg-image-error">
            <ImageOff size={24}/>
            <span>Image unavailable</span>
          </div>
        ) : src ? (
          <img
            src={src}
            alt={
              item.type === 'gif'
                ? `GIF attachment ${index + 1}`
                : `Photo attachment ${index + 1}`
            }
            className={loaded ? 'loaded' : ''}
            onLoad={event => {
              const img = event.currentTarget;

              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setRatio(img.naturalWidth / img.naturalHeight);
              }

              setLoaded(true);

              if (
                img.naturalHeight >
                img.naturalWidth * 1.05
              ) {
                setOrientation('portrait');
              } else {
                setOrientation('landscape');
              }
            }}
            onError={() => setFailed(true)}
          />
        ) : null}

        <span className="spg-media-label">
          {item.type === 'gif' ? 'GIF' : 'Photo'}
        </span>

        {onRemove && (
          <button
            type="button"
            className="spg-remove"
            aria-label={`Remove ${item.type} ${index + 1}`}
            onClick={() => onRemove(item.id)}
          >
            <X size={17}/>
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudioPostGallery({
  items = [],
  maxItems = 4,
  onRemove,
  showHeader = true,
  readOnly = false,
}) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  // SCENE_GALLERY_ADAPTIVE_HEIGHT_V1
  const [activeHeight, setActiveHeight] = useState(null);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) return;

    const card = track.children[active];

    if (!card) return;

    function measure() {
      const height = card.getBoundingClientRect().height;

      if (height > 0) {
        setActiveHeight(Math.ceil(height));
      }
    }

    measure();

    // Update when images finish loading, change their
    // aspect ratio, or the viewport changes size.
    const observer = new ResizeObserver(measure);

    observer.observe(card);

    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [active, items.length]);

  useEffect(() => {
    setActive(previous =>
      Math.min(previous, Math.max(0, items.length - 1))
    );
  }, [items.length]);

  function scrollToItem(index) {
    const track = trackRef.current;
    if (!track) return;

    const card = track.children[index];
    if (!card) return;

    track.scrollTo({
      left:
        card.getBoundingClientRect().left -
        track.getBoundingClientRect().left +
        track.scrollLeft,
      behavior: 'smooth',
    });

    setActive(index);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;

    const left = track.getBoundingClientRect().left;

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    Array.from(track.children).forEach((card, index) => {
      const distance = Math.abs(
        card.getBoundingClientRect().left - left
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActive(nearestIndex);
  }

  if (!items.length) return null;

  return (
    <section
      className="spg-gallery"
      aria-label="Post media attachments"
    >
      {showHeader && (
        <div className="spg-header">
          <strong>Media attachments</strong>

          <div className="spg-controls">
            <span>
              {items.length}
              {Number.isFinite(maxItems)
                ? `/${maxItems}`
                : ' photos'}
            </span>
          </div>
        </div>
      )}

      <div
        className={
          items.length === 1
            ? 'spg-track spg-single'
            : 'spg-track'
        }
        ref={trackRef}
        style={{
          '--spg-active-height': activeHeight
            ? `${activeHeight}px`
            : 'auto',
        }}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <GalleryCard
            key={item.id}
            item={item}
            index={index}
            onRemove={readOnly ? undefined : onRemove}
          />
        ))}
      </div>

      {items.length > 1 && (
        <div className="spg-pagination">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`View attachment ${index + 1}`}
              aria-current={active === index}
              className={active === index ? 'active' : ''}
              onClick={() => scrollToItem(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
