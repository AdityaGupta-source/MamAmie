// Pure sync logic (no React, no network) so it can be tested in plain Node.
//
// The app stores plain JSON. Rather than hooking every store action, the engine takes a snapshot of
// the synced data, hashes each record, and compares it with what the server already has (`meta`).
// Anything new or changed is pushed; anything that vanished becomes a tombstone.

// Records that live in lists, and the singleton documents. Must match backend COLLECTIONS.
export const LIST_COLLECTIONS = ['entries', 'medicationSchedules', 'doseLogs', 'kickSessions', 'contractions'];
export const DOC_IDS = { profile: 'profile', journalSettings: 'journalSettings', checks: 'checks', hydration: 'hydration' };

export const keyOf = (collection, id) => `${collection}/${id}`;

// Small non-cryptographic hash (djb2) over the JSON text; enough to notice that a record changed.
export function hashJson(json) {
  let h = 5381;
  for (let i = 0; i < json.length; i++) h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  return `${h}:${json.length}`;
}

// A record's own "last changed" time, when it has one. Documents have none.
export function intrinsicModified(rec) {
  const v = rec?.modifiedAt ?? rec?.actualLoggedAt ?? rec?.endedAt ?? rec?.startAt ?? null;
  return typeof v === 'number' ? v : null;
}

// parts: { entries, medicationSchedules, doseLogs, kickSessions, contractions, profile, journalSettings, checks, hydration }
// Returns Map<key, { collection, id, data, hash, modifiedAt|null }>.
export function buildSnapshot(parts) {
  const snap = new Map();
  const add = (collection, id, data) => {
    if (!data || !id) return;
    snap.set(keyOf(collection, id), { collection, id, data, hash: hashJson(JSON.stringify(data)), modifiedAt: collection === 'documents' ? null : intrinsicModified(data) });
  };
  for (const c of LIST_COLLECTIONS) for (const rec of parts[c] || []) add(c, rec.id, rec);
  for (const id of Object.values(DOC_IDS)) add('documents', id, parts[id]);
  return snap;
}

// What to push: new/changed records, plus tombstones for records we pushed before that are now gone.
// Documents are never tombstoned (an empty local store must not wipe the server copy).
export function computeChanges(snap, meta, now = Date.now()) {
  const changes = [];
  for (const [key, s] of snap) {
    if (meta[key]?.h === s.hash) continue;
    changes.push({ collection: s.collection, id: s.id, modifiedAt: s.modifiedAt ?? now, deleted: false, data: s.data });
  }
  for (const key of Object.keys(meta)) {
    if (snap.has(key)) continue;
    const slash = key.indexOf('/');
    const collection = key.slice(0, slash);
    if (collection === 'documents') continue;
    changes.push({ collection, id: key.slice(slash + 1), modifiedAt: now, deleted: true });
  }
  return changes;
}

// Decides which remote changes to take. A remote change is skipped when it is just our own push coming
// back, or when the local copy has unsent edits that are newer.
// Returns { apply: change[], metaUpdates: { key: {h}|null } }.
export function planIncoming(remoteChanges, snap, meta) {
  const apply = [];
  const metaUpdates = {};
  for (const r of remoteChanges) {
    const key = keyOf(r.collection, r.id);
    const local = snap.get(key);
    if (r.deleted) {
      if (r.collection === 'documents') continue;
      if (local && meta[key]?.h !== local.hash) continue; // edited locally since last sync: keep it and push again
      if (!local && !meta[key]) continue;
      apply.push(r);
      metaUpdates[key] = null;
      continue;
    }
    const hash = hashJson(JSON.stringify(r.data));
    if (meta[key]?.h === hash && local?.hash === hash) continue; // echo of our own push
    if (local && local.hash === hash) {
      metaUpdates[key] = { h: hash, m: r.modifiedAt }; // already identical: just remember it
      continue;
    }
    const dirty = local && meta[key]?.h !== local.hash;
    if (dirty) {
      // Our unsent edit wins if it is newer. Documents have no timestamp: they win only when the remote
      // copy is not newer than the version we last synced (e.g. a late echo of our own push).
      const baseM = meta[key]?.m;
      const localNewer = local.modifiedAt != null ? local.modifiedAt > r.modifiedAt : baseM != null && r.modifiedAt <= baseM;
      if (localNewer) continue;
    }
    apply.push(r);
    metaUpdates[key] = { h: hash, m: r.modifiedAt };
  }
  return { apply, metaUpdates };
}

// Groups accepted remote changes by target so each store is updated once.
export function groupChanges(changes) {
  const byCollection = {};
  for (const c of changes) (byCollection[c.collection] ||= []).push(c);
  return byCollection;
}

// Replaces/removes records by id in a list.
export function mergeList(list, changes, sortFn = null) {
  const byId = new Map(list.map((x) => [x.id, x]));
  for (const c of changes) {
    if (c.deleted) byId.delete(c.id);
    else byId.set(c.id, c.data);
  }
  const next = [...byId.values()];
  return sortFn ? next.sort(sortFn) : next;
}

export const byNewestStart = (key) => (a, b) => (b[key] || 0) - (a[key] || 0);
