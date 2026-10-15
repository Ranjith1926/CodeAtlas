/**
 * Content repository layer.
 *
 * Rule of thumb: when online, fetch from the API and opportunistically
 * cache into SQLite; when offline (or the content was explicitly
 * downloaded), read from SQLite instead. In __DEV__ with USE_FIXTURES set,
 * a failed network call falls back to clearly-marked fixture data so UI can
 * be exercised before the backend is reachable.
 */
import { getDb, runWrite } from './db';
import * as api from '../api/endpoints';
import { USE_FIXTURES } from '../constants/config';
import {
  FIXTURE_CATEGORIES,
  FIXTURE_INTERVIEW_QUESTIONS,
  FIXTURE_LANGUAGES,
  FIXTURE_LESSONS,
  FIXTURE_TOPICS,
  FIXTURE_TOPIC_DETAILS,
} from '../constants/fixtures';
import {
  Category,
  Difficulty,
  InterviewQuestion,
  InterviewQuestionSummary,
  Language,
  Lesson,
  TopicDetail,
  TopicSummary,
} from '../types/models';

// ---------------- Languages ----------------

export async function fetchLanguages(online: boolean): Promise<Language[]> {
  if (online) {
    try {
      const data = await api.getLanguages();
      void cacheLanguages(data);
      return data;
    } catch (err) {
      const cached = await readCachedLanguages();
      if (cached.length) return cached;
      if (USE_FIXTURES) return FIXTURE_LANGUAGES;
      throw err;
    }
  }
  const cached = await readCachedLanguages();
  if (cached.length) return cached;
  if (USE_FIXTURES) return FIXTURE_LANGUAGES;
  throw new Error('Offline and no cached languages available');
}

async function cacheLanguages(languages: Language[]) {
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      for (const l of languages) {
        await db.runAsync(
          `INSERT OR REPLACE INTO languages (id, code, name, description, iconName, sortOrder) VALUES (?, ?, ?, ?, ?, ?)`,
          [l.id, l.code, l.name, l.description, l.iconName, l.sortOrder]
        );
      }
    })
  );
}

async function readCachedLanguages(): Promise<Language[]> {
  const db = await getDb();
  return db.getAllAsync<Language>('SELECT * FROM languages ORDER BY sortOrder ASC');
}

// ---------------- Categories ----------------

export async function fetchCategories(languageCode: string, online: boolean): Promise<Category[]> {
  if (online) {
    try {
      const data = await api.getCategories(languageCode);
      void cacheCategories(languageCode, data);
      return data;
    } catch (err) {
      const cached = await readCachedCategories(languageCode);
      if (cached.length) return cached;
      if (USE_FIXTURES) return FIXTURE_CATEGORIES[languageCode] ?? [];
      throw err;
    }
  }
  const cached = await readCachedCategories(languageCode);
  if (cached.length) return cached;
  if (USE_FIXTURES) return FIXTURE_CATEGORIES[languageCode] ?? [];
  throw new Error('Offline and no cached categories available');
}

async function cacheCategories(languageCode: string, categories: Category[]) {
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      for (const c of categories) {
        await db.runAsync(
          `INSERT OR REPLACE INTO categories (id, languageCode, name, slug, sortOrder) VALUES (?, ?, ?, ?, ?)`,
          [c.id, languageCode, c.name, c.slug, c.sortOrder]
        );
      }
    })
  );
}

async function readCachedCategories(languageCode: string): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>(
    'SELECT id, name, slug, sortOrder FROM categories WHERE languageCode = ? ORDER BY sortOrder ASC',
    [languageCode]
  );
}

// ---------------- Topics ----------------

export async function fetchTopics(categoryId: string, online: boolean): Promise<TopicSummary[]> {
  if (online) {
    try {
      const data = await api.getTopics(categoryId);
      void cacheTopicSummaries(categoryId, data);
      return data;
    } catch (err) {
      const cached = await readCachedTopics(categoryId);
      if (cached.length) return cached;
      if (USE_FIXTURES) return FIXTURE_TOPICS[categoryId] ?? [];
      throw err;
    }
  }
  const cached = await readCachedTopics(categoryId);
  if (cached.length) return cached;
  if (USE_FIXTURES) return FIXTURE_TOPICS[categoryId] ?? [];
  throw new Error('Offline and no cached topics available');
}

async function cacheTopicSummaries(categoryId: string, topics: TopicSummary[]) {
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      for (const t of topics) {
        await db.runAsync(
          `INSERT INTO topics (id, categoryId, title, slug, summary, difficulty, sortOrder)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET categoryId=excluded.categoryId, title=excluded.title,
             slug=excluded.slug, summary=excluded.summary, difficulty=excluded.difficulty, sortOrder=excluded.sortOrder`,
          [t.id, categoryId, t.title, t.slug, t.summary, t.difficulty, t.sortOrder]
        );
      }
    })
  );
}

async function readCachedTopics(categoryId: string): Promise<TopicSummary[]> {
  const db = await getDb();
  return db.getAllAsync<TopicSummary>(
    'SELECT id, title, slug, summary, difficulty, sortOrder FROM topics WHERE categoryId = ? ORDER BY sortOrder ASC',
    [categoryId]
  );
}

export async function fetchTopicDetail(topicId: string, online: boolean): Promise<TopicDetail> {
  if (online) {
    try {
      const data = await api.getTopic(topicId);
      void cacheTopicDetail(data);
      return data;
    } catch (err) {
      const cached = await readCachedTopicDetail(topicId);
      if (cached) return cached;
      if (USE_FIXTURES && FIXTURE_TOPIC_DETAILS[topicId]) return FIXTURE_TOPIC_DETAILS[topicId];
      throw err;
    }
  }
  const cached = await readCachedTopicDetail(topicId);
  if (cached) return cached;
  if (USE_FIXTURES && FIXTURE_TOPIC_DETAILS[topicId]) return FIXTURE_TOPIC_DETAILS[topicId];
  throw new Error('Offline and topic not downloaded');
}

async function cacheTopicDetail(topic: TopicDetail) {
  await runWrite((db) =>
    db.runAsync(
      `INSERT INTO topics (id, title, summary, difficulty, relatedTopicsJson, lessonsJson)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, summary=excluded.summary,
         difficulty=excluded.difficulty, relatedTopicsJson=excluded.relatedTopicsJson, lessonsJson=excluded.lessonsJson`,
      [
        topic.id,
        topic.title,
        topic.summary,
        topic.difficulty,
        JSON.stringify(topic.relatedTopics),
        JSON.stringify(topic.lessons),
      ]
    )
  );
}

interface TopicRow {
  id: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  relatedTopicsJson: string | null;
  lessonsJson: string | null;
}

async function readCachedTopicDetail(topicId: string): Promise<TopicDetail | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<TopicRow>(
    'SELECT id, title, summary, difficulty, relatedTopicsJson, lessonsJson FROM topics WHERE id = ?',
    [topicId]
  );
  if (!row || !row.lessonsJson) return null;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    difficulty: row.difficulty,
    lessons: JSON.parse(row.lessonsJson),
    relatedTopics: row.relatedTopicsJson ? JSON.parse(row.relatedTopicsJson) : [],
  };
}

// ---------------- Lessons ----------------

export async function fetchLesson(lessonId: string, online: boolean): Promise<Lesson> {
  if (online) {
    try {
      const data = await api.getLesson(lessonId);
      void cacheLesson(data);
      return data;
    } catch (err) {
      const cached = await readCachedLesson(lessonId);
      if (cached) return cached;
      if (USE_FIXTURES && FIXTURE_LESSONS[lessonId]) return FIXTURE_LESSONS[lessonId];
      throw err;
    }
  }
  const cached = await readCachedLesson(lessonId);
  if (cached) return cached;
  if (USE_FIXTURES && FIXTURE_LESSONS[lessonId]) return FIXTURE_LESSONS[lessonId];
  throw new Error('Offline and lesson not downloaded');
}

async function cacheLesson(lesson: Lesson) {
  await runWrite((db) =>
    db.runAsync(
      `INSERT INTO lessons (id, topicId, title, contentMarkdown, prevLessonId, nextLessonId, codeExamplesJson)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET topicId=excluded.topicId, title=excluded.title,
         contentMarkdown=excluded.contentMarkdown, prevLessonId=excluded.prevLessonId,
         nextLessonId=excluded.nextLessonId, codeExamplesJson=excluded.codeExamplesJson`,
      [
        lesson.id,
        lesson.topicId,
        lesson.title,
        lesson.contentMarkdown,
        lesson.prevLessonId,
        lesson.nextLessonId,
        JSON.stringify(lesson.codeExamples),
      ]
    )
  );
}

interface LessonRow {
  id: string;
  topicId: string;
  title: string;
  contentMarkdown: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  codeExamplesJson: string | null;
}

async function readCachedLesson(lessonId: string): Promise<Lesson | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LessonRow>(
    'SELECT id, topicId, title, contentMarkdown, prevLessonId, nextLessonId, codeExamplesJson FROM lessons WHERE id = ?',
    [lessonId]
  );
  if (!row || row.contentMarkdown == null) return null;
  return {
    id: row.id,
    title: row.title,
    contentMarkdown: row.contentMarkdown,
    topicId: row.topicId,
    prevLessonId: row.prevLessonId,
    nextLessonId: row.nextLessonId,
    codeExamples: row.codeExamplesJson ? JSON.parse(row.codeExamplesJson) : [],
  };
}

// ---------------- Interview questions ----------------

export async function fetchInterviewQuestions(
  topicId: string,
  online: boolean,
  difficulty?: Difficulty
): Promise<InterviewQuestionSummary[]> {
  if (online) {
    try {
      const data = await api.getInterviewQuestions(topicId, difficulty);
      void cacheInterviewQuestionSummaries(topicId, data);
      return data;
    } catch (err) {
      const cached = await readCachedInterviewQuestionSummaries(topicId, difficulty);
      if (cached.length) return cached;
      if (USE_FIXTURES) return filterByDifficulty(FIXTURE_INTERVIEW_QUESTIONS[topicId] ?? [], difficulty);
      throw err;
    }
  }
  const cached = await readCachedInterviewQuestionSummaries(topicId, difficulty);
  if (cached.length) return cached;
  if (USE_FIXTURES) return filterByDifficulty(FIXTURE_INTERVIEW_QUESTIONS[topicId] ?? [], difficulty);
  throw new Error('Offline and no cached interview questions available');
}

function filterByDifficulty<T extends { difficulty: Difficulty }>(list: T[], difficulty?: Difficulty) {
  return difficulty ? list.filter((q) => q.difficulty === difficulty) : list;
}

// Only summary fields are known at list time — deliberately does NOT touch
// answer/scenario/commonMistakes/followUps on conflict, so a previously
// cached full detail row (from fetchInterviewQuestion) isn't blanked out.
async function cacheInterviewQuestionSummaries(topicId: string, questions: InterviewQuestionSummary[]) {
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      for (const q of questions) {
        await db.runAsync(
          `INSERT INTO interview_questions (id, topicId, difficulty, question)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET topicId=excluded.topicId, difficulty=excluded.difficulty, question=excluded.question`,
          [q.id, topicId, q.difficulty, q.question]
        );
      }
    })
  );
}

async function readCachedInterviewQuestionSummaries(
  topicId: string,
  difficulty?: Difficulty
): Promise<InterviewQuestionSummary[]> {
  const db = await getDb();
  if (difficulty) {
    return db.getAllAsync<InterviewQuestionSummary>(
      'SELECT id, difficulty, question FROM interview_questions WHERE topicId = ? AND difficulty = ?',
      [topicId, difficulty]
    );
  }
  return db.getAllAsync<InterviewQuestionSummary>(
    'SELECT id, difficulty, question FROM interview_questions WHERE topicId = ?',
    [topicId]
  );
}

export async function fetchInterviewQuestion(id: string, online: boolean): Promise<InterviewQuestion> {
  if (online) {
    try {
      const data = await api.getInterviewQuestion(id);
      void cacheInterviewQuestionDetail(data);
      return data;
    } catch (err) {
      const cached = await readCachedInterviewQuestionById(id);
      if (cached) return cached;
      throw err;
    }
  }
  const cached = await readCachedInterviewQuestionById(id);
  if (cached) return cached;
  throw new Error('Offline and question not downloaded');
}

async function cacheInterviewQuestionDetail(question: InterviewQuestion) {
  await runWrite((db) =>
    db.runAsync(
      `INSERT INTO interview_questions (id, difficulty, question, answer, scenario, commonMistakes, followUps)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET difficulty=excluded.difficulty, question=excluded.question,
         answer=excluded.answer, scenario=excluded.scenario, commonMistakes=excluded.commonMistakes,
         followUps=excluded.followUps`,
      [question.id, question.difficulty, question.question, question.answer, question.scenario, question.commonMistakes, question.followUps]
    )
  );
}

async function readCachedInterviewQuestionById(id: string): Promise<InterviewQuestion | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<InterviewQuestion>(
    'SELECT id, difficulty, question, answer, scenario, commonMistakes, followUps FROM interview_questions WHERE id = ?',
    [id]
  );
  // A row may exist from a list fetch with only summary fields populated
  // (answer etc. NULL) — that's not a usable detail record.
  if (!row || row.answer == null) return null;
  return row;
}
