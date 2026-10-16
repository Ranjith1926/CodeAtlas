import * as SQLite from 'expo-sqlite';
import { SQLITE_DB_NAME } from '../constants/config';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS languages (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  iconName TEXT,
  sortOrder INTEGER
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  languageCode TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  sortOrder INTEGER
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  categoryId TEXT,
  title TEXT NOT NULL,
  slug TEXT,
  summary TEXT,
  difficulty TEXT,
  sortOrder INTEGER,
  relatedTopicsJson TEXT,
  lessonsJson TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  topicId TEXT,
  title TEXT NOT NULL,
  slug TEXT,
  sortOrder INTEGER,
  contentMarkdown TEXT,
  prevLessonId TEXT,
  nextLessonId TEXT,
  codeExamplesJson TEXT,
  downloaded INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS interview_questions (
  id TEXT PRIMARY KEY,
  topicId TEXT,
  difficulty TEXT,
  question TEXT,
  answer TEXT,
  scenario TEXT,
  commonMistakes TEXT,
  followUps TEXT,
  downloaded INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  contentType TEXT NOT NULL,
  contentId TEXT NOT NULL,
  pendingSync INTEGER DEFAULT 0,
  pendingDelete INTEGER DEFAULT 0,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS progress (
  contentType TEXT NOT NULL,
  contentId TEXT NOT NULL,
  status TEXT NOT NULL,
  pendingSync INTEGER DEFAULT 0,
  updatedAt TEXT,
  PRIMARY KEY (contentType, contentId)
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT,
  contextTopicId TEXT,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TEXT,
  pendingSync INTEGER DEFAULT 0,
  imageUri TEXT
);

CREATE TABLE IF NOT EXISTS downloads (
  topicId TEXT PRIMARY KEY,
  title TEXT,
  downloadedAt TEXT
);
`;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(SQLITE_DB_NAME).then(async (db) => {
      await db.execAsync(SCHEMA);
      // `CREATE TABLE IF NOT EXISTS` above only shapes a brand-new database —
      // an install that already has a chat_messages table from before this
      // column existed needs it added explicitly. SQLite has no "ADD COLUMN
      // IF NOT EXISTS", so just swallow the "duplicate column" error on a
      // database that already has it.
      try {
        await db.execAsync('ALTER TABLE chat_messages ADD COLUMN imageUri TEXT');
      } catch {
        // already present
      }
      return db;
    });
  }
  return dbPromise;
}

let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * Serializes every SQLite write (a single runAsync statement, or a whole
 * withTransactionAsync block) through one queue. The whole app shares a
 * single connection (see getDb() above), and that connection does not
 * support overlapping transactions: several screens fire parallel content
 * fetches on mount, each opportunistically caching its result, and two of
 * those caching writes racing on the same connection corrupt each other's
 * commit/rollback state — surfacing as "cannot rollback - no transaction is
 * active". Routing every write through this queue guarantees only one
 * touches the connection at a time. Reads (getAllAsync/getFirstAsync) are
 * safe to run concurrently under WAL mode and are left unserialized.
 *
 * Callers should only put the actual SQL statement(s) inside `fn` — never an
 * awaited network call — so a slow API request can't hold up unrelated
 * writes elsewhere in the app.
 */
export function runWrite<T>(fn: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  const run = async () => {
    const db = await getDb();
    return fn(db);
  };
  const result = writeQueue.then(run, run);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
