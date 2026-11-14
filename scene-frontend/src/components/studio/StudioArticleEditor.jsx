import { useEffect, useRef, useState } from 'react';

import StudioPostGallery from './StudioPostGallery';
import '../../styles/StudioCreatePost.css';

// SCENE_ARTICLE_PHOTO_GALLERIES_V1

import {
  Bold, Italic, Underline, List, ListOrdered,
  Quote, Link2, Image as ImageIcon, Plus, X,
  ChevronUp, ChevronDown, Undo2, Redo2,
  ImageOff,
} from 'lucide-react';

export const MAX_ARTICLE_PHOTO_BYTES = 10 * 1024 * 1024;

export function isArticlePhoto(file) {
  return Boolean(
    file &&
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
    file.size <= MAX_ARTICLE_PHOTO_BYTES
  );
}

export function makeArticleBlock(type = 'paragraph') {
  return {
    id: globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    html: '',
    caption: '',
  };
}

export function getArticlePhotos(block) {
  if (Array.isArray(block?.photos)) {
    return block.photos.filter(photo => photo?.file);
  }

  // Backwards compatibility with single-photo drafts.
  if (block?.file) {
    return [{
      id: `${block.id}-legacy-photo`,
      type: 'photo',
      file: block.file,
    }];
  }

  return [];
}

function makeArticlePhoto(file) {
  return {
    id: makeArticleBlock('photo').id,
    type: 'photo',
    file,
  };
}

const SAFE_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S',
  'BR', 'P', 'DIV', 'UL', 'OL', 'LI',
  'BLOCKQUOTE', 'A',
]);

export function safeArticleUrl(value) {
  try {
    const url = new URL(String(value || '').trim());

    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return '';
    }

    return url.href;
  } catch {
    return '';
  }
}

/*
 * Only permitted formatting survives.
 * No script, iframe, event handlers, styles,
 * remote images or arbitrary embedded HTML.
 */

export function cleanArticleHTML(html) {
  const parsed = new DOMParser().parseFromString(
    String(html || ''),
    'text/html'
  );

  const output = document.createElement('div');

  function copyNode(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(
        document.createTextNode(node.textContent || '')
      );
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toUpperCase();

    if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'].includes(tag)) {
      return;
    }

    if (!SAFE_TAGS.has(tag)) {
      Array.from(node.childNodes).forEach(child =>
        copyNode(child, parent)
      );
      return;
    }

    const element = document.createElement(tag.toLowerCase());

    if (tag === 'A') {
      const href = safeArticleUrl(node.getAttribute('href'));

      if (!href) {
        Array.from(node.childNodes).forEach(child =>
          copyNode(child, parent)
        );
        return;
      }

      element.setAttribute('href', href);
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }

    Array.from(node.childNodes).forEach(child =>
      copyNode(child, element)
    );

    parent.appendChild(element);
  }

  Array.from(parsed.body.childNodes).forEach(node =>
    copyNode(node, output)
  );

  return output.innerHTML;
}

export function getArticleText(html) {
  const parsed = new DOMParser().parseFromString(
    String(html || ''),
    'text/html'
  );

  return parsed.body.textContent?.trim() || '';
}

export function ArticlePhoto({ file, alt = 'Article photo', cover = false }) {
  const [src, setSrc] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);

    if (!file) {
      setSrc('');
      return;
    }

    const url = URL.createObjectURL(file);
    setSrc(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className={
      cover ? 'sa-photo sa-cover-photo' : 'sa-photo'
    }>
      {!loaded && !failed && (
        <div className="sa-photo-skeleton" aria-hidden="true"/>
      )}

      {failed ? (
        <div className="sa-image-error">
          <ImageOff size={23}/>
          <span>Image unavailable</span>
        </div>
      ) : src ? (
        <img
          src={src}
          alt={alt}
          className={loaded ? 'loaded' : ''}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

const formatButtons = [
  { command: 'bold', label: 'Bold', Icon: Bold },
  { command: 'italic', label: 'Italic', Icon: Italic },
  { command: 'underline', label: 'Underline', Icon: Underline },
  { command: 'insertUnorderedList', label: 'Bullet list', Icon: List },
  { command: 'insertOrderedList', label: 'Numbered list', Icon: ListOrdered },
  { command: 'createLink', label: 'Insert link', Icon: Link2 },
  { command: 'undo', label: 'Undo', Icon: Undo2 },
  { command: 'redo', label: 'Redo', Icon: Redo2 },
];

function TextBlock({ block, onChange, disabled }) {
  const ref = useRef(null);
  const selectionRef = useRef(null);

  // Set initial content once. Avoid resetting the caret
  // every time the parent state changes.
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = cleanArticleHTML(block.html);
    }
  }, []);

  function rememberSelection() {
    const selection = window.getSelection();

    if (
      selection?.rangeCount &&
      ref.current?.contains(selection.anchorNode) &&
      ref.current?.contains(selection.focusNode)
    ) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function sync() {
    onChange({
      html: cleanArticleHTML(ref.current?.innerHTML || ''),
    });

    rememberSelection();
  }

  function restoreSelection() {
    const element = ref.current;

    if (!element) return;

    element.focus();

    const selection = window.getSelection();
    const range = selectionRef.current;

    if (
      range &&
      element.contains(range.startContainer) &&
      element.contains(range.endContainer)
    ) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function format(command) {
    if (disabled) return;

    rememberSelection();

    let value = null;

    if (command === 'createLink') {
      value = safeArticleUrl(
        window.prompt('Enter a website URL (https://...)')
      );

      if (!value) return;
    }

    restoreSelection();

    // Use semantic tags rather than inline CSS styles.
    document.execCommand('styleWithCSS', false, false);

    document.execCommand(command, false, value);

    sync();
  }

  function pastePlainText(event) {
    event.preventDefault();

    const text = event.clipboardData.getData('text/plain');

    document.execCommand('insertText', false, text);
    sync();
  }

  return (
    <div className="sa-text-block">

      <div className="sa-format-bar">
        <select
          aria-label="Text block style"
          value={block.type}
          disabled={disabled}
          onChange={event => onChange({
            type: event.target.value,
          })}
        >
          <option value="paragraph">Paragraph</option>
          <option value="heading">Heading</option>
          <option value="subheading">Subheading</option>
          <option value="quote">Quote</option>
        </select>

        <div className="sa-format-divider"/>

        {formatButtons.map(({ command, label, Icon }) => (
          <button
            type="button"
            key={command}
            title={label}
            aria-label={label}
            disabled={disabled}
            onMouseDown={event => event.preventDefault()}
            onClick={() => format(command)}
          >
            <Icon size={17}/>
          </button>
        ))}
      </div>

      <div
        ref={ref}
        className={`sa-editable sa-editable-${block.type}`}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-label={`${block.type} text`}
        aria-multiline="true"
        data-placeholder={
          block.type === 'heading'
            ? 'Section heading...'
            : block.type === 'quote'
            ? 'Write a quote...'
            : 'Start writing...'
        }
        dir="auto"
        onInput={sync}
        onBlur={sync}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onPaste={pastePlainText}
        onDrop={event => event.preventDefault()}
      />
    </div>
  );
}

export function ArticleBlockPreview({ block }) {
  if (block.type === 'photo') {
    const photos = getArticlePhotos(block);

    if (!photos.length) return null;

    return (
      <figure className={
        photos.length > 1
          ? 'sa-reader-figure sa-reader-gallery'
          : 'sa-reader-figure'
      }>
        {photos.length === 1 ? (
          <ArticlePhoto file={photos[0].file}/>
        ) : (
          <StudioPostGallery
            items={photos}
            maxItems={Infinity}
            showHeader={false}
            readOnly
          />
        )}

        {block.caption && (
          <figcaption dir="auto">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div
      className={`sa-reader-block sa-reader-${block.type}`}
      dir="auto"
      dangerouslySetInnerHTML={{
        __html: cleanArticleHTML(block.html),
      }}
    />
  );
}

export default function StudioArticleEditor({
  blocks,
  onChange,
  onError,
  disabled = false,
}) {
  const photoInput = useRef(null);
  const insertAfter = useRef(null);
  const appendTo = useRef(null);

  function updateBlock(id, changes) {
    onChange(previous =>
      previous.map(block =>
        block.id === id
          ? { ...block, ...changes }
          : block
      )
    );
  }

  function insertBlock(block, after = null) {
    onChange(previous => {
      const position = after
        ? previous.findIndex(item => item.id === after) + 1
        : previous.length;

      return [
        ...previous.slice(0, position),
        block,
        ...previous.slice(position),
      ];
    });
  }

  function moveBlock(id, direction) {
    onChange(previous => {
      const index = previous.findIndex(block => block.id === id);
      const next = index + direction;

      if (index < 0 || next < 0 || next >= previous.length) {
        return previous;
      }

      const items = [...previous];

      [items[index], items[next]] = [items[next], items[index]];

      return items;
    });
  }

  function removeBlock(id) {
    onChange(previous => {
      const next = previous.filter(block => block.id !== id);

      return next.length ? next : [makeArticleBlock()];
    });
  }

  function choosePhoto(after = null, existingId = null) {
    insertAfter.current = after;
    appendTo.current = existingId;
    photoInput.current?.click();
  }

  function removePhoto(blockId, photoId) {
    onChange(previous => {
      const next = previous.flatMap(block => {
        if (block.id !== blockId) return [block];

        const remaining = getArticlePhotos(block).filter(
          photo => photo.id !== photoId
        );

        if (!remaining.length) {
          return [];
        }

        // Normalize a legacy single photo section
        // into the new gallery format.
        const { file, ...rest } = block;

        return [{
          ...rest,
          photos: remaining,
        }];
      });

      return next.length ? next : [makeArticleBlock()];
    });
  }

  function handlePhoto(event) {
    const files = Array.from(event.target.files || []);

    event.target.value = '';

    const targetSection = appendTo.current;
    const afterSection = insertAfter.current;

    appendTo.current = null;
    insertAfter.current = null;

    if (!files.length) return;

    const valid = files.filter(isArticlePhoto);

    if (!valid.length) {
      onError?.(
        'Choose JPG, PNG or WebP photos up to 10 MB each.'
      );
      return;
    }

    if (valid.length !== files.length) {
      onError?.(
        'Some files were skipped. Use JPG, PNG or WebP photos up to 10 MB each.'
      );
    } else {
      onError?.('');
    }

    const additions = valid.map(makeArticlePhoto);

    if (targetSection) {
      onChange(previous =>
        previous.map(block => {
          if (
            block.id !== targetSection ||
            block.type !== 'photo'
          ) {
            return block;
          }

          const { file, ...rest } = block;

          return {
            ...rest,
            photos: [
              ...getArticlePhotos(block),
              ...additions,
            ],
          };
        })
      );

      return;
    }

    insertBlock(
      {
        ...makeArticleBlock('photo'),
        photos: additions,
      },
      afterSection
    );
  }

  return (
    <section className="sa-editor">

      <input
        type="file"
        ref={photoInput}
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={disabled}
        onChange={handlePhoto}
      />

      <div className="sa-section-header">
        <div>
          <h2>Article body</h2>
          <p>Write your story, one section at a time.</p>
        </div>

        <button
          type="button"
          className="sa-secondary"
          disabled={disabled}
          onClick={() => choosePhoto()}
        >
          <ImageIcon size={17}/> Add Photos
        </button>
      </div>

      <div className="sa-blocks">
        {blocks.map((block, index) => (
          <div className="sa-block" key={block.id}>

            <div className="sa-block-controls">
              <span>
                {block.type === 'photo' ? 'PHOTO' : 'TEXT'}
                {' · '}
                {index + 1}
              </span>

              <div>
                <button
                  type="button"
                  aria-label="Move block up"
                  title="Move up"
                  disabled={disabled || index === 0}
                  onClick={() => moveBlock(block.id, -1)}
                >
                  <ChevronUp size={17}/>
                </button>

                <button
                  type="button"
                  aria-label="Move block down"
                  title="Move down"
                  disabled={disabled || index === blocks.length - 1}
                  onClick={() => moveBlock(block.id, 1)}
                >
                  <ChevronDown size={17}/>
                </button>

                <button
                  type="button"
                  aria-label="Remove block"
                  title="Remove block"
                  disabled={disabled}
                  onClick={() => removeBlock(block.id)}
                >
                  <X size={17}/>
                </button>
              </div>
            </div>

            {block.type === 'photo' ? (
              <>
                <div className="sa-editor-gallery">
                  <StudioPostGallery
                    items={getArticlePhotos(block)}
                    maxItems={Infinity}
                    showHeader={false}
                    readOnly={disabled}
                    onRemove={photoId => {
                      if (!disabled) {
                        removePhoto(block.id, photoId);
                      }
                    }}
                  />

                  <div className="sa-gallery-actions">
                    <span>
                      {getArticlePhotos(block).length}
                      {' '}
                      {getArticlePhotos(block).length === 1
                        ? 'photo'
                        : 'photos'}
                    </span>

                    <button
                      type="button"
                      className="sa-secondary"
                      disabled={disabled}
                      onClick={() => choosePhoto(null, block.id)}
                    >
                      <Plus size={16}/> Add More Photos
                    </button>
                  </div>
                </div>

                <input
                  className="sa-caption-input"
                  placeholder="Add a caption or photo credit (optional)"
                  aria-label="Photo caption"
                  dir="auto"
                  maxLength={300}
                  value={block.caption || ''}
                  disabled={disabled}
                  onChange={event => updateBlock(block.id, {
                    caption: event.target.value,
                  })}
                />
              </>
            ) : (
              <TextBlock
                block={block}
                disabled={disabled}
                onChange={changes => updateBlock(block.id, changes)}
              />
            )}

            <div className="sa-insert-row">
              <button
                type="button"
                disabled={disabled}
                onClick={() => insertBlock(
                  makeArticleBlock(), block.id
                )}
              >
                <Plus size={15}/> Text
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => choosePhoto(block.id)}
              >
                <ImageIcon size={15}/> Photos
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => insertBlock(
                  makeArticleBlock('quote'), block.id
                )}
              >
                <Quote size={15}/> Quote
              </button>
            </div>

          </div>
        ))}
      </div>

      <button
        type="button"
        className="sa-add-block"
        disabled={disabled}
        onClick={() => insertBlock(makeArticleBlock())}
      >
        <Plus size={18}/> Add another section
      </button>

    </section>
  );
}
