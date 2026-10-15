/**
 * "Download for offline" support: fetches a topic plus all of its lessons
 * from the API and writes them into SQLite so the lesson reader and topic
 * detail screens can work fully offline afterwards. Tracked separately in
 * the `downloads` table so Profile/Settings can list + delete them.
 */
import { getDb, runWrite } from './db';
import * as api from '../api/endpoints';
import { TopicDetail } from '../types/models';

export interface DownloadedTopic {
  topicId: string;
  title: string;
  downloadedAt: string;
}

export async function downloadTopic(topicId: string): Promise<TopicDetail> {
  const topic = await api.getTopic(topicId);

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

  for (const lessonSummary of topic.lessons) {
    const lesson = await api.getLesson(lessonSummary.id);
    await runWrite((db) =>
      db.runAsync(
        `INSERT INTO lessons (id, topicId, title, slug, sortOrder, contentMarkdown, prevLessonId, nextLessonId, codeExamplesJson, downloaded)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET topicId=excluded.topicId, title=excluded.title,
           contentMarkdown=excluded.contentMarkdown, prevLessonId=excluded.prevLessonId,
           nextLessonId=excluded.nextLessonId, codeExamplesJson=excluded.codeExamplesJson, downloaded=1`,
        [
          lesson.id,
          lesson.topicId,
          lesson.title,
          lessonSummary.slug,
          lessonSummary.sortOrder,
          lesson.contentMarkdown,
          lesson.prevLessonId,
          lesson.nextLessonId,
          JSON.stringify(lesson.codeExamples),
        ]
      )
    );
  }

  await runWrite((db) =>
    db.runAsync(`INSERT OR REPLACE INTO downloads (topicId, title, downloadedAt) VALUES (?, ?, ?)`, [
      topic.id,
      topic.title,
      new Date().toISOString(),
    ])
  );

  return topic;
}

export async function listDownloadedTopics(): Promise<DownloadedTopic[]> {
  const db = await getDb();
  return db.getAllAsync<DownloadedTopic>('SELECT topicId, title, downloadedAt FROM downloads ORDER BY downloadedAt DESC');
}

export async function isTopicDownloaded(topicId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ topicId: string }>('SELECT topicId FROM downloads WHERE topicId = ?', [
    topicId,
  ]);
  return Boolean(row);
}

export async function deleteDownloadedTopic(topicId: string): Promise<void> {
  await runWrite((db) =>
    db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM downloads WHERE topicId = ?', [topicId]);
      await db.runAsync('DELETE FROM lessons WHERE topicId = ?', [topicId]);
    })
  );
}
