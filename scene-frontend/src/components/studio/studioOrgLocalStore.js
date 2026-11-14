/*
 * Frontend-phase organization management storage.
 *
 * These are local configuration drafts, NOT public
 * memberships, invitations, roles or verified links.
 */

function storageKey(org, section) {
  const id = org?._id || org?.id || org?.username;

  if (!id) {
    throw new Error('Organization identity required.');
  }

  return `scene-studio:${String(id)}:${section}:v1`;
}

export function readOrgLocal(org, section) {
  const key = storageKey(org, section);

  const value = JSON.parse(
    localStorage.getItem(key) || '[]'
  );

  return Array.isArray(value) ? value : [];
}

export function writeOrgLocal(org, section, items) {
  const key = storageKey(org, section);

  localStorage.setItem(
    key,
    JSON.stringify(items)
  );

  return items;
}
