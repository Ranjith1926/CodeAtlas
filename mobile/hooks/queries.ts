import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import * as content from '../data/content';
import { listBookmarks } from '../data/userdata';
import { listProgress } from '../data/userdata';
import { fetchSessions, fetchMessages } from '../data/chat';
import { Difficulty } from '../types/models';

export function useLanguages() {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['languages', isOnline],
    queryFn: () => content.fetchLanguages(isOnline),
  });
}

export function useCategories(languageCode?: string) {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['categories', languageCode, isOnline],
    queryFn: () => content.fetchCategories(languageCode as string, isOnline),
    enabled: Boolean(languageCode),
  });
}

export function useTopics(categoryId?: string) {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['topics', categoryId, isOnline],
    queryFn: () => content.fetchTopics(categoryId as string, isOnline),
    enabled: Boolean(categoryId),
  });
}

export function useTopicDetail(topicId?: string) {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['topic', topicId, isOnline],
    queryFn: () => content.fetchTopicDetail(topicId as string, isOnline),
    enabled: Boolean(topicId),
  });
}

export function useLesson(lessonId?: string) {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['lesson', lessonId, isOnline],
    queryFn: () => content.fetchLesson(lessonId as string, isOnline),
    enabled: Boolean(lessonId),
  });
}

export function useInterviewQuestions(topicId?: string, difficulty?: Difficulty) {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['interview-questions', topicId, difficulty, isOnline],
    queryFn: () => content.fetchInterviewQuestions(topicId as string, isOnline, difficulty),
    enabled: Boolean(topicId),
  });
}

export function useInterviewQuestion(id?: string) {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['interview-question', id, isOnline],
    queryFn: () => content.fetchInterviewQuestion(id as string, isOnline),
    enabled: Boolean(id),
  });
}

export function useBookmarks() {
  return useQuery({ queryKey: ['bookmarks-local'], queryFn: listBookmarks });
}

export function useProgress() {
  return useQuery({ queryKey: ['progress-local'], queryFn: listProgress });
}

export function useChatSessions() {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['chat-sessions', isOnline],
    queryFn: () => fetchSessions(isOnline),
  });
}

export function useChatMessages(sessionId?: string) {
  const isOnline = useNetworkStatus();
  return useQuery({
    queryKey: ['chat-messages', sessionId, isOnline],
    queryFn: () => fetchMessages(sessionId as string, isOnline),
    enabled: Boolean(sessionId),
  });
}

/** Convenience: invalidate the local-first bookmark/progress caches after a write. */
export function useLocalDataInvalidation() {
  const queryClient = useQueryClient();
  return {
    invalidateBookmarks: () => queryClient.invalidateQueries({ queryKey: ['bookmarks-local'] }),
    invalidateProgress: () => queryClient.invalidateQueries({ queryKey: ['progress-local'] }),
  };
}
