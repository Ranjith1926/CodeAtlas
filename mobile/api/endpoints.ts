import { apiFetch } from './client';
import {
  decodeChatRole,
  decodeContentType,
  decodeDifficulty,
  decodeProgressStatus,
  encodeContentType,
  encodeProgressStatus,
  toId,
  toNullableId,
} from './wireCodecs';
import {
  AuthResponse,
  Category,
  ChatMessage,
  ChatSession,
  CodeExample,
  InterviewQuestion,
  InterviewQuestionSummary,
  Language,
  Lesson,
  SyncRequest,
  SyncResponse,
  TopicDetail,
  TopicSummary,
  User,
  Difficulty,
  Bookmark,
  ProgressEntry,
  ProgressStatus,
  ContentType,
} from '../types/models';

// The live backend serializes ids as numbers (except auth's User.id, which
// is already a string GUID) and enums as numeric ordinals. These `map*`
// functions translate each raw wire shape into our app-level types right
// at the boundary — see api/wireCodecs.ts for why.

function mapUser(raw: any): User {
  return { id: toId(raw.id), email: raw.email, displayName: raw.displayName };
}

function mapAuthResponse(raw: any): AuthResponse {
  return { accessToken: raw.accessToken, refreshToken: raw.refreshToken, user: mapUser(raw.user) };
}

function mapLanguage(raw: any): Language {
  return {
    id: toId(raw.id),
    code: raw.code,
    name: raw.name,
    description: raw.description,
    iconName: raw.iconName,
    sortOrder: raw.sortOrder,
  };
}

function mapCategory(raw: any): Category {
  return { id: toId(raw.id), name: raw.name, slug: raw.slug, sortOrder: raw.sortOrder };
}

function mapTopicSummary(raw: any): TopicSummary {
  return {
    id: toId(raw.id),
    title: raw.title,
    slug: raw.slug,
    summary: raw.summary,
    difficulty: decodeDifficulty(raw.difficulty),
    sortOrder: raw.sortOrder,
  };
}

function mapTopicDetail(raw: any): TopicDetail {
  return {
    id: toId(raw.id),
    title: raw.title,
    summary: raw.summary,
    difficulty: decodeDifficulty(raw.difficulty),
    lessons: (raw.lessons ?? []).map((l: any) => ({
      id: toId(l.id),
      title: l.title,
      slug: l.slug,
      sortOrder: l.sortOrder,
    })),
    // The live backend returns full topic objects here, not just {id,title};
    // we only need id+title per the contract, so we trim it down.
    relatedTopics: (raw.relatedTopics ?? []).map((t: any) => ({ id: toId(t.id), title: t.title })),
  };
}

function mapCodeExample(raw: any): CodeExample {
  return {
    id: toId(raw.id),
    description: raw.description ?? '',
    code: raw.code,
    expectedOutput: raw.expectedOutput ?? '',
    languageCode: raw.languageCode,
  };
}

function mapLesson(raw: any): Lesson {
  return {
    id: toId(raw.id),
    title: raw.title,
    contentMarkdown: raw.contentMarkdown,
    topicId: toId(raw.topicId),
    prevLessonId: toNullableId(raw.prevLessonId),
    nextLessonId: toNullableId(raw.nextLessonId),
    codeExamples: (raw.codeExamples ?? []).map(mapCodeExample),
  };
}

function mapInterviewQuestionSummary(raw: any): InterviewQuestionSummary {
  return { id: toId(raw.id), difficulty: decodeDifficulty(raw.difficulty), question: raw.question };
}

function mapInterviewQuestion(raw: any): InterviewQuestion {
  return {
    id: toId(raw.id),
    difficulty: decodeDifficulty(raw.difficulty),
    question: raw.question,
    answer: raw.answer ?? '',
    scenario: raw.scenario ?? '',
    commonMistakes: raw.commonMistakes ?? '',
    followUps: raw.followUps ?? '',
  };
}

function mapBookmark(raw: any): Bookmark {
  return { id: toId(raw.id), contentType: decodeContentType(raw.contentType), contentId: toId(raw.contentId) };
}

function mapProgressEntry(raw: any): ProgressEntry {
  return {
    contentType: decodeContentType(raw.contentType),
    contentId: toId(raw.contentId),
    status: decodeProgressStatus(raw.status),
  };
}

function mapChatSession(raw: any): ChatSession {
  return {
    id: toId(raw.id),
    title: raw.title ?? null,
    contextTopicId: toNullableId(raw.contextTopicId),
    createdAt: raw.createdAt,
  };
}

function mapChatMessage(raw: any): ChatMessage {
  return { id: toId(raw.id), role: decodeChatRole(raw.role), content: raw.content, createdAt: raw.createdAt };
}

// ---- Auth ----

export async function register(email: string, password: string, displayName?: string) {
  const raw = await apiFetch<any>('/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
    auth: false,
  });
  return mapAuthResponse(raw);
}

export async function login(email: string, password: string) {
  const raw = await apiFetch<any>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  return mapAuthResponse(raw);
}

export async function refresh(refreshToken: string) {
  return apiFetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  });
}

export async function getMe() {
  const raw = await apiFetch<any>('/auth/me');
  return mapUser(raw);
}

// ---- Content ----

export async function getLanguages() {
  const raw = await apiFetch<any[]>('/languages');
  return raw.map(mapLanguage);
}

export async function getCategories(languageCode: string) {
  const raw = await apiFetch<any[]>(`/languages/${languageCode}/categories`);
  return raw.map(mapCategory);
}

export async function getTopics(categoryId: string) {
  const raw = await apiFetch<any[]>(`/categories/${categoryId}/topics`);
  return raw.map(mapTopicSummary);
}

export async function getTopic(topicId: string) {
  const raw = await apiFetch<any>(`/topics/${topicId}`);
  return mapTopicDetail(raw);
}

export async function getLesson(lessonId: string) {
  const raw = await apiFetch<any>(`/lessons/${lessonId}`);
  return mapLesson(raw);
}

/** List view — summary fields only (see InterviewQuestionSummary doc comment). */
export async function getInterviewQuestions(topicId: string, difficulty?: Difficulty) {
  const qs = difficulty ? `?difficulty=${difficulty}` : '';
  const raw = await apiFetch<any[]>(`/topics/${topicId}/interview-questions${qs}`);
  return raw.map(mapInterviewQuestionSummary);
}

export async function getInterviewQuestion(id: string) {
  const raw = await apiFetch<any>(`/interview-questions/${id}`);
  return mapInterviewQuestion(raw);
}

// ---- User data ----

export async function getBookmarks() {
  const raw = await apiFetch<any[]>('/bookmarks');
  return raw.map(mapBookmark);
}

export async function addBookmark(contentType: ContentType, contentId: string) {
  const raw = await apiFetch<any>('/bookmarks', {
    method: 'POST',
    body: { contentType: encodeContentType(contentType), contentId },
  });
  return mapBookmark(raw);
}

export function removeBookmark(id: string) {
  return apiFetch<void>(`/bookmarks/${id}`, { method: 'DELETE' });
}

export async function getProgress() {
  const raw = await apiFetch<any[]>('/progress');
  return raw.map(mapProgressEntry);
}

export async function putProgress(contentType: ContentType, contentId: string, status: ProgressStatus) {
  const raw = await apiFetch<any>('/progress', {
    method: 'PUT',
    body: { contentType: encodeContentType(contentType), contentId, status: encodeProgressStatus(status) },
  });
  return mapProgressEntry(raw);
}

export async function sync(payload: SyncRequest) {
  const raw = await apiFetch<any>('/sync', {
    method: 'POST',
    body: {
      bookmarks: payload.bookmarks.map((b) => ({ contentType: encodeContentType(b.contentType), contentId: b.contentId })),
      progress: payload.progress.map((p) => ({
        contentType: encodeContentType(p.contentType),
        contentId: p.contentId,
        status: encodeProgressStatus(p.status),
      })),
    },
  });
  const result: SyncResponse = {
    bookmarks: (raw.bookmarks ?? []).map(mapBookmark),
    progress: (raw.progress ?? []).map(mapProgressEntry),
  };
  return result;
}

// ---- AI chat ----

export async function getChatSessions() {
  const raw = await apiFetch<any[]>('/chat/sessions');
  return raw.map(mapChatSession);
}

export async function createChatSession(title?: string, contextTopicId?: string) {
  const raw = await apiFetch<any>('/chat/sessions', { method: 'POST', body: { title, contextTopicId } });
  return mapChatSession(raw);
}

export async function getChatMessages(sessionId: string) {
  const raw = await apiFetch<any[]>(`/chat/sessions/${sessionId}/messages`);
  return raw.map(mapChatMessage);
}

export async function deleteChatSession(sessionId: string) {
  await apiFetch<void>(`/chat/sessions/${sessionId}`, { method: 'DELETE' });
}

// Note: posting a chat message is handled via api/sse.ts (streamChatMessage),
// not apiFetch, because the response is a text/event-stream, not JSON.
