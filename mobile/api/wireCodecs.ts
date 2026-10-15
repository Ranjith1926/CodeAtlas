/**
 * The live backend serializes enums as their numeric ordinal (the .NET
 * default for System.Text.Json) rather than the string names documented in
 * the contract, and uses numeric database ids rather than strings for all
 * content (languages/categories/topics/lessons/interview
 * questions/bookmarks/progress/chat) — only auth's User.id is a real
 * string (GUID). These codecs translate at the api/ boundary so the rest
 * of the app can keep working against the friendly string contract
 * (Difficulty, ContentType, ProgressStatus, ChatMessage.role) everywhere
 * else, and ids are always strings once they leave this layer.
 *
 * Confirmed against the live backend on 2026-10-15:
 *   - GET /topics/.../ -> difficulty: 0 | 1 | 2
 *   - POST /bookmarks body + response -> contentType: 0 | 1
 *   - PUT /progress body + response -> status: 0 | 1 | 2
 *   - GET chat messages -> role: 0 | 1
 *   - difficulty query string param on /topics/{id}/interview-questions
 *     accepts the string name ("Beginner") directly, so that one is left
 *     untouched.
 */
import { ContentType, Difficulty, ProgressStatus } from '../types/models';

export function toId(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

export function toNullableId(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

const DIFFICULTY_BY_ORDINAL: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

export function decodeDifficulty(value: unknown): Difficulty {
  if (typeof value === 'number') return DIFFICULTY_BY_ORDINAL[value] ?? 'Beginner';
  if (value === 'Beginner' || value === 'Intermediate' || value === 'Advanced') return value;
  return 'Beginner';
}

const CONTENT_TYPE_BY_ORDINAL: ContentType[] = ['Lesson', 'InterviewQuestion'];

export function decodeContentType(value: unknown): ContentType {
  if (typeof value === 'number') return CONTENT_TYPE_BY_ORDINAL[value] ?? 'Lesson';
  if (value === 'Lesson' || value === 'InterviewQuestion') return value;
  return 'Lesson';
}

export function encodeContentType(value: ContentType): number {
  return CONTENT_TYPE_BY_ORDINAL.indexOf(value);
}

const PROGRESS_STATUS_BY_ORDINAL: ProgressStatus[] = ['NotStarted', 'InProgress', 'Completed'];

export function decodeProgressStatus(value: unknown): ProgressStatus {
  if (typeof value === 'number') return PROGRESS_STATUS_BY_ORDINAL[value] ?? 'NotStarted';
  if (value === 'NotStarted' || value === 'InProgress' || value === 'Completed') return value;
  return 'NotStarted';
}

export function encodeProgressStatus(value: ProgressStatus): number {
  return PROGRESS_STATUS_BY_ORDINAL.indexOf(value);
}

const CHAT_ROLE_BY_ORDINAL: Array<'User' | 'Assistant'> = ['User', 'Assistant'];

export function decodeChatRole(value: unknown): 'User' | 'Assistant' {
  if (typeof value === 'number') return CHAT_ROLE_BY_ORDINAL[value] ?? 'User';
  if (value === 'User' || value === 'Assistant') return value;
  return 'User';
}
