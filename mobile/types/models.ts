/**
 * Types mirroring the backend API contract exactly. Keep these in sync with
 * the backend team's responses — see mobile/README.md for the endpoint list.
 */

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type ContentType = 'Lesson' | 'InterviewQuestion';

export type ProgressStatus = 'NotStarted' | 'InProgress' | 'Completed';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  description: string;
  iconName: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface TopicSummary {
  id: string;
  title: string;
  slug: string;
  summary: string;
  difficulty: Difficulty;
  sortOrder: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
}

export interface RelatedTopic {
  id: string;
  title: string;
}

export interface TopicDetail {
  id: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  lessons: LessonSummary[];
  relatedTopics: RelatedTopic[];
}

export interface CodeExample {
  id: string;
  description: string;
  code: string;
  expectedOutput: string;
  /** Present on the live backend; used to pick the right syntax highlighter grammar. */
  languageCode?: string;
}

export interface Lesson {
  id: string;
  title: string;
  contentMarkdown: string;
  topicId: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  codeExamples: CodeExample[];
}

export interface InterviewQuestion {
  id: string;
  difficulty: Difficulty;
  question: string;
  answer: string;
  scenario: string;
  commonMistakes: string;
  followUps: string;
}

/**
 * The live backend's list endpoint (GET /topics/{id}/interview-questions)
 * only returns the summary fields below — answer/scenario/commonMistakes/
 * followUps are fetched separately via GET /interview-questions/{id}. The
 * question list screen only needs this shape.
 */
export interface InterviewQuestionSummary {
  id: string;
  difficulty: Difficulty;
  question: string;
}

export interface Bookmark {
  id: string;
  contentType: ContentType;
  contentId: string;
}

export interface ProgressEntry {
  contentType: ContentType;
  contentId: string;
  status: ProgressStatus;
}

export interface SyncRequest {
  bookmarks: Bookmark[];
  progress: ProgressEntry[];
}

export interface SyncResponse {
  bookmarks: Bookmark[];
  progress: ProgressEntry[];
}

export interface ChatSession {
  id: string;
  title: string | null;
  contextTopicId: string | null;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'User' | 'Assistant';
  content: string;
  createdAt: string;
  /** Local-only: the photo this message was sent with, if any. Device-local (not synced, not returned by the server). */
  imageUri?: string | null;
}
