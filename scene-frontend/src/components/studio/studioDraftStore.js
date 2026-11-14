/*
 * Scene Studio local drafts.
 *
 * IndexedDB preserves actual File / Blob objects,
 * unlike JSON-based localStorage.
 *
 * Local only: no publishing or backend requests.
 */

const DB_NAME = 'scene-studio-drafts';
const STORE_NAME = 'drafts';

function organizationKey(org) {
  const key = org?._id || org?.id || org?.username;

  if (!key) {
    throw new Error('Organization identity is required.');
  }

  return String(key);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(
          STORE_NAME,
          { keyPath: 'id' }
        );

        store.createIndex(
          'organizationKey',
          'organizationKey',
          { unique: false }
        );
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => reject(
      request.error || new Error('Unable to open drafts.')
    );
  });
}

async function transact(mode, operation) {
  const db = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);

      let result;

      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(
        transaction.error || new Error('Draft operation aborted.')
      );

      try {
        operation(store, value => {
          result = value;
        });
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
  } finally {
    db.close();
  }
}

export async function getStudioDrafts(org) {
  const key = organizationKey(org);

  const drafts = await transact('readonly', (store, done) => {
    const request = store.index('organizationKey').getAll(key);

    request.onsuccess = () => done(request.result || []);
  });

  return drafts.sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}

export async function saveStudioDraft(org, input) {
  const key = organizationKey(org);

  const id = input.id ||
    `${key}:${globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

  return transact('readwrite', (store, done) => {
    const request = store.get(id);

    request.onsuccess = () => {
      const previous = request.result;

      if (previous && previous.organizationKey !== key) {
        store.transaction.abort();
        return;
      }

      const draft = {
        id,
        organizationKey: key,
        type: input.type || 'post',
        article: input.article || null,
        list: input.list || null,
        production: input.production || null,
        text: input.text || '',
        visualMedia: input.visualMedia || [],
        link: input.link || null,
        attachedMedia: input.attachedMedia || [],
        createdAt: previous?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      store.put(draft);
      done(draft);
    };
  });
}

export async function deleteStudioDraft(org, id) {
  const key = organizationKey(org);

  return transact('readwrite', (store, done) => {
    const request = store.get(id);

    request.onsuccess = () => {
      const draft = request.result;

      if (draft && draft.organizationKey === key) {
        store.delete(id);
      }

      done(true);
    };
  });
}
