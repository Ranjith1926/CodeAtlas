/**
 * Bookmarks + progress repository.
 *
 * Writes always go to local SQLite immediately (optimistic, marked
 * pending), then attempt an immediate API call when online. Anything left
 * pending gets flushed by syncPendingChanges(), which is wired up to fire
 * on NetInfo reconnect and app-foreground (see data/sync.ts).
 */
import { getDb, runWrite } from './db';
import * as api from '../api/endpoints';
import { isCurrentlyOnline } from '../hooks/useNetworkStatus';
import { Bookmark, ContentType, ProgressEntry, ProgressStatus } from '../types/models';

function makeLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------- Bookmarks ----------------

export async function addBookmarkLocal(
  contentType: ContentType,
  contentId: string,
  online: boolean
): Promise<Bookmark> {
  const localId = makeLocalId();
  await runWrite((db) =>
    db.runAsync(
      'INSERT INTO bookmarks (id, contentType, contentId, pendingSync, pendingDelete, updatedAt) VALUES (?, ?, ?, 1, 0, ?)',
      [localId, contentType, contentId, new Date().toISOString()]
    )
  );

  if (online) {
    try {
      const server = await api.addBookmark(contentType, contentId);
      await runWrite((db) => db.runAsync('DELETE FROM bookmarks WHERE id = ?', [localId]));
      await runWrite((db) =>
        db.runAsync(
          'INSERT OR REPLACE INTO bookmarks (id, contentType, contentId, pendingSync, pendingDelete) VALUES (?, ?, ?, 0, 0)',
          [server.id, contentType, contentId]
        )
      );
      return server;
    } catch {
      // Stays pending locally; syncPendingChanges() retries later.
    }
  }
  return { id: localId, contentType, contentId };
}

export async function removeBookmarkLocal(id: string, online: boolean): Promise<void> {
  if (online) {
    try {
      if (!id.startsWith('local-')) {
        await api.removeBookmark(id);
      }
      await runWrite((db) => db.runAsync('DELETE FROM bookmarks WHERE id = ?', [id]));
      return;
    } catch {
      // Fall through to mark pending so it retries later.
    }
  }
  await runWrite((db) => db.runAsync('UPDATE bookmarks SET pendingDelete = 1, pendingSync = 1 WHERE id = ?', [id]));
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const db = await getDb();
  return db.getAllAsync<Bookmark>(
    'SELECT id, contentType, contentId FROM bookmarks WHERE pendingDelete = 0 ORDER BY updatedAt DESC'
  );
}

export async function findBookmarkId(contentType: ContentType, contentId: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM bookmarks WHERE contentType = ? AND contentId = ? AND pendingDelete = 0',
    [contentType, contentId]
  );
  return row?.id ?? null;
}

// ---------------- Progress ----------------

export async function setProgressLocal(
  contentType: ContentType,
  contentId: string,
  status: ProgressStatus,
  online: boolean
): Promise<void> {
  await runWrite((db) =>
    db.runAsync(
      `INSERT INTO progress (contentType, contentId, status, pendingSync, updatedAt) VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(contentType, contentId) DO UPDATE SET status = excluded.status, pendingSync = 1, updatedAt = excluded.updatedAt`,
      [contentType, contentId, status, new Date().toISOString()]
    )
  );

  if (online) {
    try {
      await api.putProgress(contentType, contentId, status);
      await runWrite((db) =>
        db.runAsync('UPDATE progress SET pendingSync = 0 WHERE contentType = ? AND contentId = ?', [
          contentType,
          contentId,
        ])
      );
    } catch {
      // Stays pending; retried by syncPendingChanges().
    }
  }
}

export async function listProgress(): Promise<ProgressEntry[]> {
  const db = await getDb();
  return db.getAllAsync<ProgressEntry>('SELECT contentType, contentId, status FROM progress');
}

/** Most recently touched lesson progress row, for the Home "continue learning" card. */
export async function getLastViewedLesson(): Promise<{ contentId: string; status: ProgressStatus } | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ contentId: string; status: ProgressStatus }>(
    "SELECT contentId, status FROM progress WHERE contentType = 'Lesson' ORDER BY updatedAt DESC LIMIT 1"
  );
  return row ?? null;
}

export async function getProgressFor(
  contentType: ContentType,
  contentId: string
): Promise<ProgressStatus | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ status: ProgressStatus }>(
    'SELECT status FROM progress WHERE contentType = ? AND contentId = ?',
    [contentType, contentId]
  );
  return row?.status ?? null;
}

// ---------------- Sync ----------------

export async function syncPendingChanges(): Promise<void> {
  const online = await isCurrentlyOnline();
  if (!online) return;

  const db = await getDb();

  // Flush deletes that couldn't reach the server while offline.
  const pendingDeletes = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM bookmarks WHERE pendingDelete = 1'
  );
  for (const row of pendingDeletes) {
    try {
      if (!row.id.startsWith('local-')) {
        await api.removeBookmark(row.id);
      }
      await runWrite((db) => db.runAsync('DELETE FROM bookmarks WHERE id = ?', [row.id]));
    } catch {
      // Leave for the next sync attempt.
    }
  }

  const pendingBookmarks = await db.getAllAsync<Bookmark>(
    'SELECT id, contentType, contentId FROM bookmarks WHERE pendingSync = 1 AND pendingDelete = 0'
  );
  const pendingProgress = await db.getAllAsync<ProgressEntry>(
    'SELECT contentType, contentId, status FROM progress WHERE pendingSync = 1'
  );

  if (pendingBookmarks.length === 0 && pendingProgress.length === 0) return;

  try {
    const response = await api.sync({ bookmarks: pendingBookmarks, progress: pendingProgress });
    await reconcileFromServer(response.bookmarks, response.progress);
  } catch {
    // Stay pending; retried on the next reconnect/foreground event.
  }
}

async function reconcileFromServer(bookmarks: Bookmark[], progress: ProgressEntry[]): Promise<void> {
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM bookmarks WHERE pendingDelete = 0');
      for (const b of bookmarks) {
        await db.runAsync(
          'INSERT OR REPLACE INTO bookmarks (id, contentType, contentId, pendingSync, pendingDelete) VALUES (?, ?, ?, 0, 0)',
          [b.id, b.contentType, b.contentId]
        );
      }
      await db.runAsync('DELETE FROM progress WHERE pendingSync = 0');
      for (const p of progress) {
        await db.runAsync(
          `INSERT INTO progress (contentType, contentId, status, pendingSync) VALUES (?, ?, ?, 0)
           ON CONFLICT(contentType, contentId) DO UPDATE SET status = excluded.status, pendingSync = 0`,
          [p.contentType, p.contentId, p.status]
        );
      }
    })
  );
}
