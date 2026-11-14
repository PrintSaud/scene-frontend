import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';

import {
  X, ZoomIn, ZoomOut, RotateCcw,
  Check, Move, AlertCircle,
} from 'lucide-react';

import '../../styles/StudioCoverCropper.css';

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const INITIAL_POSITION = { x: 0.5, y: 0.5 };

/*
 * Returns the exact source-image rectangle represented
 * by the crop preview.
 *
 * Coordinates are based on the original image pixels,
 * not the viewport size.
 */
function getCropRect(
  imageWidth,
  imageHeight,
  ratio,
  zoom,
  position
) {
  const width = Math.min(
    imageWidth,
    imageHeight * ratio
  ) / zoom;

  const height = width / ratio;

  return {
    width,
    height,
    x: Math.max(0, imageWidth - width) * position.x,
    y: Math.max(0, imageHeight - height) * position.y,
  };
}

export default function StudioCoverCropper({
  file,
  aspectRatio = 3,
  outputWidth = 1500,
  title = 'Adjust Cover',
  onApply,
  onClose,
}) {
  const ratio =
    Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : 3;

  const [src, setSrc] = useState('');
  const [dimensions, setDimensions] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const imageRef = useRef(null);
  const frameRef = useRef(null);
  const closeRef = useRef(null);
  const dragRef = useRef(null);
  const mountedRef = useRef(true);
  const applyLock = useRef(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    mountedRef.current = true;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function handleKey(event) {
      if (event.key === 'Escape' && !applyLock.current) {
        event.preventDefault();
        onCloseRef.current?.();
      }
    }

    document.addEventListener('keydown', handleKey);

    return () => {
      mountedRef.current = false;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);

    setLoading(true);
    setError('');
    setDimensions(null);
    setZoom(1);
    setPosition(INITIAL_POSITION);
    setSrc(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const crop = dimensions
    ? getCropRect(
        dimensions.width,
        dimensions.height,
        ratio,
        zoom,
        position
      )
    : null;

  function handleImageLoad(event) {
    const image = event.currentTarget;

    if (!image.naturalWidth || !image.naturalHeight) {
      setError('Unable to read this image.');
      setLoading(false);
      return;
    }

    setDimensions({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });

    setLoading(false);
  }

  function resetCrop() {
    setZoom(1);
    setPosition(INITIAL_POSITION);
    setError('');
  }

  function handlePointerDown(event) {
    if (!crop || applying || loading) return;

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const frame = frameRef.current;

    if (!frame) return;

    const bounds = frame.getBoundingClientRect();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      positionX: position.x,
      positionY: position.y,
      frameWidth: bounds.width,
      frameHeight: bounds.height,
      cropWidth: crop.width,
      cropHeight: crop.height,
    };

    frame.setPointerCapture?.(event.pointerId);
    frame.classList.add('dragging');

    event.preventDefault();
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;

    if (
      !drag ||
      !dimensions ||
      drag.pointerId !== event.pointerId
    ) return;

    const overflowX =
      dimensions.width - drag.cropWidth;

    const overflowY =
      dimensions.height - drag.cropHeight;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    setPosition({
      x: overflowX > 0
        ? clamp(
            drag.positionX -
            (dx / drag.frameWidth) *
            (drag.cropWidth / overflowX),
            0,
            1
          )
        : 0.5,

      y: overflowY > 0
        ? clamp(
            drag.positionY -
            (dy / drag.frameHeight) *
            (drag.cropHeight / overflowY),
            0,
            1
          )
        : 0.5,
    });
  }

  function stopDragging() {
    dragRef.current = null;
    frameRef.current?.classList.remove('dragging');
  }

  function handleCropKey(event) {
    if (!crop || applying) return;

    const movement = event.shiftKey ? 0.10 : 0.025;

    const directions = {
      ArrowLeft: [-movement, 0],
      ArrowRight: [movement, 0],
      ArrowUp: [0, -movement],
      ArrowDown: [0, movement],
    };

    const direction = directions[event.key];

    if (!direction) return;

    event.preventDefault();

    setPosition(previous => ({
      x: clamp(previous.x + direction[0], 0, 1),
      y: clamp(previous.y + direction[1], 0, 1),
    }));
  }

  async function applyCrop() {
    if (
      !crop ||
      !imageRef.current ||
      loading ||
      applyLock.current
    ) return;

    applyLock.current = true;
    setApplying(true);
    setError('');

    try {
      const canvas = document.createElement('canvas');

      // Avoid upscaling small originals.
      const width = Math.max(
        1,
        Math.floor(Math.min(outputWidth, crop.width))
      );

      const height = Math.max(
        1,
        Math.round(width / ratio)
      );

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas unavailable.');
      }

      // Use a black background for transparent PNGs.
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        imageRef.current,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        width,
        height
      );

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          value => {
            if (value) resolve(value);
            else reject(new Error('Image export failed.'));
          },
          'image/jpeg',
          0.92
        );
      });

      if (!mountedRef.current) return;

      const croppedFile = new File(
        [blob],
        `scene-cover-${Date.now()}.jpg`,
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }
      );

      onApply?.(croppedFile);
    } catch {
      if (mountedRef.current) {
        setError(
          'Could not create the cover. Please try another image.'
        );
        setApplying(false);
      }
    } finally {
      applyLock.current = false;
    }
  }

  const imageStyle = crop
    ? {
        width: `${dimensions.width / crop.width * 100}%`,
        height: `${dimensions.height / crop.height * 100}%`,
        left: `${-crop.x / crop.width * 100}%`,
        top: `${-crop.y / crop.height * 100}%`,
      }
    : {
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        objectFit: 'contain',
        opacity: 0,
      };

  return createPortal(
    <div
      className="scc-overlay"
      onClick={() => {
        if (!applying) onClose?.();
      }}
    >
      <section
        className="scc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scc-title"
        onClick={event => event.stopPropagation()}
      >

        <header className="scc-header">
          <div>
            <h2 id="scc-title">{title}</h2>
            <p>Make your cover look exactly how you want.</p>
          </div>

          <button
            ref={closeRef}
            type="button"
            className="scc-close"
            aria-label="Close cover cropper"
            disabled={applying}
            onClick={onClose}
          >
            <X size={21}/>
          </button>
        </header>

        <div className="scc-content">

          {error && (
            <div className="scc-error" role="alert">
              <AlertCircle size={17}/>
              {error}
            </div>
          )}

          <div className="scc-canvas">

            <div
              ref={frameRef}
              className="scc-frame"
              style={{ aspectRatio: ratio }}
              tabIndex={0}
              role="group"
              aria-label="Cover crop. Drag or use arrow keys to reposition."
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onLostPointerCapture={stopDragging}
              onKeyDown={handleCropKey}
            >
              {loading && (
                <div className="scc-skeleton"/>
              )}

              {src && (
                <img
                  ref={imageRef}
                  src={src}
                  alt="Cover crop preview"
                  draggable={false}
                  style={imageStyle}
                  onLoad={handleImageLoad}
                  onError={() => {
                    setLoading(false);
                    setError('Unable to open this image.');
                  }}
                />
              )}

              {!loading && dimensions && (
                <div className="scc-grid" aria-hidden="true">
                  <span/>
                  <span/>
                  <span/>
                  <span/>
                </div>
              )}
            </div>

            <div className="scc-frame-note">
              <Move size={14}/>
              Drag to reposition
              <span>·</span>
              {ratio === 3 ? '3:1' : `${ratio.toFixed(2)}:1`} cover
            </div>

          </div>

          <div className="scc-zoom">

            <button
              type="button"
              aria-label="Zoom out"
              disabled={loading || applying || zoom <= 1}
              onClick={() => setZoom(value =>
                Math.max(1, value - 0.1)
              )}
            >
              <ZoomOut size={20}/>
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              aria-label="Cover zoom"
              disabled={loading || applying}
              onChange={event =>
                setZoom(Number(event.target.value))
              }
            />

            <button
              type="button"
              aria-label="Zoom in"
              disabled={loading || applying || zoom >= 3}
              onClick={() => setZoom(value =>
                Math.min(3, value + 0.1)
              )}
            >
              <ZoomIn size={20}/>
            </button>

            <span>{Math.round(zoom * 100)}%</span>

          </div>

          {dimensions && (
            <div className="scc-position-controls">
              <label>
                Horizontal position

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={position.x}
                  disabled={
                    applying ||
                    dimensions.width - crop.width < 1
                  }
                  onChange={event => setPosition(previous => ({
                    ...previous,
                    x: Number(event.target.value),
                  }))}
                />
              </label>

              <label>
                Vertical position

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={position.y}
                  disabled={
                    applying ||
                    dimensions.height - crop.height < 1
                  }
                  onChange={event => setPosition(previous => ({
                    ...previous,
                    y: Number(event.target.value),
                  }))}
                />
              </label>
            </div>
          )}

        </div>

        <footer className="scc-footer">

          <button
            type="button"
            className="scc-reset"
            disabled={applying || loading}
            onClick={resetCrop}
          >
            <RotateCcw size={17}/> Reset
          </button>

          <div className="scc-actions">

            <button
              type="button"
              className="scc-cancel"
              disabled={applying}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="scc-apply"
              disabled={loading || applying || !dimensions}
              onClick={applyCrop}
            >
              <Check size={17}/>
              {applying ? 'Applying…' : 'Apply Cover'}
            </button>

          </div>

        </footer>

      </section>
    </div>,
    document.body
  );
}
