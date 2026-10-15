import { API_BASE_URL } from '../constants/config';
import { getCachedAccessToken } from './tokenStore';

/**
 * Consumes the chat-message `text/event-stream` response.
 *
 * React Native's `fetch` does not reliably support reading a streaming
 * response body across Expo/RN versions, so we use XMLHttpRequest and its
 * `onprogress` handler, which fires as `xhr.responseText` progressively
 * grows. We track how much of the text we've already parsed and only
 * process the newly-appended slice on each tick, splitting it into
 * `data: ...` lines (separated by the SSE blank-line delimiter).
 */

export interface StreamHandlers {
  onDelta: (delta: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface StreamHandle {
  abort: () => void;
}

export function streamChatMessage(
  sessionId: string,
  content: string,
  handlers: StreamHandlers
): StreamHandle {
  const xhr = new XMLHttpRequest();
  let processedLength = 0;
  let done = false;

  const processNewText = () => {
    const fullText = xhr.responseText || '';
    if (processedLength >= fullText.length) return;
    const newChunk = fullText.slice(processedLength);
    processedLength = fullText.length;

    // SSE events are separated by a blank line; each event may contain one
    // or more "data: ..." lines. Split conservatively on newlines and pick
    // out any line that starts with "data:".
    const lines = newChunk.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice('data:'.length).trim();
      if (payload === '[DONE]') {
        if (!done) {
          done = true;
          handlers.onDone();
        }
        continue;
      }
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload) as { delta?: string };
        if (typeof parsed.delta === 'string') {
          handlers.onDelta(parsed.delta);
        }
      } catch {
        // Ignore malformed partial JSON; it will arrive complete on a later tick.
      }
    }
  };

  xhr.open('POST', `${API_BASE_URL}/chat/sessions/${sessionId}/messages`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  const token = getCachedAccessToken();
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  xhr.onprogress = processNewText;
  xhr.onload = () => {
    processNewText();
    if (!done) {
      done = true;
      if (xhr.status >= 200 && xhr.status < 300) {
        handlers.onDone();
      } else {
        handlers.onError(new Error(`Chat stream failed with status ${xhr.status}`));
      }
    }
  };
  xhr.onerror = () => {
    if (!done) {
      done = true;
      handlers.onError(new Error('Network error while streaming chat response'));
    }
  };
  xhr.ontimeout = () => {
    if (!done) {
      done = true;
      handlers.onError(new Error('Chat stream timed out'));
    }
  };

  xhr.send(JSON.stringify({ content }));

  return {
    abort: () => {
      if (!done) {
        done = true;
        xhr.abort();
      }
    },
  };
}
