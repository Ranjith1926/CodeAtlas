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
        await db.runAsync(
          'INSERT OR REPLACE INTO chat_messages (id, sessionId, role, content, createdAt, pendingSync) VALUES (?, ?, ?, ?, ?, 0)',
          [m.id, sessionId, m.role, m.content, m.createdAt]
        );
      }
    })
  );
}

async function readCachedMessages(sessionId: string): Promise<ChatMessage[]> {
  const db = await getDb();
  return db.getAllAsync<ChatMessage>(
    'SELECT id, role, content, createdAt FROM chat_messages WHERE sessionId = ? ORDER BY createdAt ASC',
    [sessionId]
  );
}

/** Adds a message locally before/while it's being sent or streamed. */
export async function addLocalMessage(
  sessionId: string,
  role: 'User' | 'Assistant',
  content: string
): Promise<ChatMessage> {
  const id = makeLocalId();
  const createdAt = new Date().toISOString();
  await runWrite((db) =>
    db.runAsync(
      'INSERT INTO chat_messages (id, sessionId, role, content, createdAt, pendingSync) VALUES (?, ?, ?, ?, ?, 1)',
      [id, sessionId, role, content, createdAt]
    )
  );
  return { id, role, content, createdAt };
}

/** Called on every streamed delta to keep the local cache current. */
export async function updateLocalMessageContent(id: string, content: string): Promise<void> {
  await runWrite((db) => db.runAsync('UPDATE chat_messages SET content = ? WHERE id = ?', [content, id]));
}

export async function markMessageSynced(id: string): Promise<void> {
  await runWrite((db) => db.runAsync('UPDATE chat_messages SET pendingSync = 0 WHERE id = ?', [id]));
}
