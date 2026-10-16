/**
 * AI Tutor chat repository: caches sessions + full message history in
 * SQLite as messages arrive, so past conversations open fully offline.
 */
import { getDb, runWrite } from './db';
import * as api from '../api/endpoints';
import { ChatMessage, ChatSession } from '../types/models';

function makeLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function fetchSessions(online: boolean): Promise<ChatSession[]> {
  if (online) {
    try {
      const data = await api.getChatSessions();
      void cacheSessions(data);
      return data;
    } catch (err) {
      const cached = await readCachedSessions();
      if (cached.length) return cached;
      throw err;
    }
  }
  return readCachedSessions();
}

async function cacheSessions(sessions: ChatSession[]) {
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      for (const s of sessions) {
        await db.runAsync(
          'INSERT OR REPLACE INTO chat_sessions (id, title, contextTopicId, createdAt) VALUES (?, ?, ?, ?)',
          [s.id, s.title ?? null, s.contextTopicId ?? null, s.createdAt ?? new Date().toISOString()]
        );
      }
    })
  );
}

async function readCachedSessions(): Promise<ChatSession[]> {
  const db = await getDb();
  return db.getAllAsync<ChatSession>('SELECT id, title, contextTopicId, createdAt FROM chat_sessions ORDER BY createdAt DESC');
}

export async function createSession(title?: string, contextTopicId?: string): Promise<ChatSession> {
  const session = await api.createChatSession(title, contextTopicId);
  await cacheSessions([session]);
  return session;
}

export async function fetchMessages(sessionId: string, online: boolean): Promise<ChatMessage[]> {
  if (online) {
    try {
      const data = await api.getChatMessages(sessionId);
      void cacheMessages(sessionId, data);
      return data;
    } catch (err) {
      const cached = await readCachedMessages(sessionId);
      if (cached.length) return cached;
      throw err;
    }
  }
  return readCachedMessages(sessionId);
}

async function cacheMessages(sessionId: string, messages: ChatMessage[]) {
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      for (const m of messages) {
        // ON CONFLICT (not INSERT OR REPLACE) so re-caching a message the
        // server already knows about doesn't null out its local-only
        // imageUri, which the server response never carries.
        await db.runAsync(
          `INSERT INTO chat_messages (id, sessionId, role, content, createdAt, pendingSync)
           VALUES (?, ?, ?, ?, ?, 0)
           ON CONFLICT(id) DO UPDATE SET role = excluded.role, content = excluded.content, createdAt = excluded.createdAt, pendingSync = 0`,
          [m.id, sessionId, m.role, m.content, m.createdAt]
        );
      }
    })
  );
}

async function readCachedMessages(sessionId: string): Promise<ChatMessage[]> {
  const db = await getDb();
  return db.getAllAsync<ChatMessage>(
    'SELECT id, role, content, createdAt, imageUri FROM chat_messages WHERE sessionId = ? ORDER BY createdAt ASC',
    [sessionId]
  );
}

/** Adds a message locally before/while it's being sent or streamed. `imageUri` is device-local only — never sent to or read back from the server. */
export async function addLocalMessage(
  sessionId: string,
  role: 'User' | 'Assistant',
  content: string,
  imageUri?: string | null
): Promise<ChatMessage> {
  const id = makeLocalId();
  const createdAt = new Date().toISOString();
  await runWrite((db) =>
    db.runAsync(
      'INSERT INTO chat_messages (id, sessionId, role, content, createdAt, pendingSync, imageUri) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [id, sessionId, role, content, createdAt, imageUri ?? null]
    )
  );
  return { id, role, content, createdAt, imageUri: imageUri ?? null };
}

/** Called on every streamed delta to keep the local cache current. */
export async function updateLocalMessageContent(id: string, content: string): Promise<void> {
  await runWrite((db) => db.runAsync('UPDATE chat_messages SET content = ? WHERE id = ?', [content, id]));
}

export async function markMessageSynced(id: string): Promise<void> {
  await runWrite((db) => db.runAsync('UPDATE chat_messages SET pendingSync = 0 WHERE id = ?', [id]));
}

/** Deletes a conversation server-side (when online) and always purges its local cache. */
export async function deleteSession(sessionId: string, online: boolean): Promise<void> {
  if (online) {
    await api.deleteChatSession(sessionId);
  }
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM chat_messages WHERE sessionId = ?', [sessionId]);
      await db.runAsync('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);
    })
  );
}
