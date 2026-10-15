# CodeAtlas — Mobile

**Learn. Explore. Master.**

CodeAtlas is a unified programming tutorial + interview-prep platform with an
AI tutor chatbot, built with React Native, Expo, TypeScript, and Expo Router.

## Getting started

```bash
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go /
a development build on a physical device.

## Configuring the backend URL

The app talks to a real HTTP backend (built separately). The base URL is
read from `EXPO_PUBLIC_API_URL` at build/start time, falling back to the
Android emulator default if unset:

```
http://10.0.2.2:5212/api
```

(`10.0.2.2` is the Android emulator's alias for your host machine's
`localhost`, where the backend runs during development.)

**Running on the Android emulator:** no configuration needed — the default
just works as long as the backend is running on your host machine at port
5212.

**Running on a physical device:** the device can't resolve `10.0.2.2` or
`localhost` as your computer, so point it at your machine's LAN IP instead:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:5212/api npx expo start
```

(find your IP with `ipconfig` on Windows or `ifconfig`/`ip addr` on
macOS/Linux; your phone and computer must be on the same network).

**iOS simulator:** can usually reach the host directly, so
`http://localhost:5212/api` works.

You can also copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`
there instead of passing it inline every time.

**Verified against the live backend.** The default URL above was confirmed
reachable and returning real seeded data (12 languages; for `javascript`
and `csharp` specifically: 6 categories, 18 topics, 36 lessons, 54 interview
questions each) during development. One wire-format detail worth knowing
if you extend the API layer: the backend serializes enum fields
(`Difficulty`, `ContentType`, `ProgressStatus`, `ChatMessage.role`) as
numeric ordinals (e.g. `difficulty: 0`) rather than the string names used
in this doc's contract description, and every content id (languages
through chat sessions) is a numeric database id rather than a string —
only `User.id` is a real string GUID. `api/wireCodecs.ts` translates both
at the API boundary (`api/endpoints.ts`), so the rest of the app — SQLite
schema, route params, UI — works entirely with the friendly string enums
and string ids from the documented contract.

### Dev-only fixture fallback

Set `EXPO_PUBLIC_USE_FIXTURES=1` to let content screens fall back to small
local fixture objects (see `constants/fixtures.ts`) when a real API call
fails — useful for building/testing UI before the backend is reachable. The
real networking code path (`api/client.ts`, `api/endpoints.ts`) is always
attempted first and is what ships to production; fixtures only ever run in
`__DEV__` and only as a fallback on failure, never by default.

## Feature overview

- **Auth** — register/login/forgot-password (see Known limitations), session
  persisted via `expo-secure-store`, silent token refresh on 401.
- **Tutorials** — language → category → topic → lesson drill-down, markdown
  lesson content with syntax-highlighted code examples and expected output,
  bookmarks, progress tracking, prev/next navigation, offline download.
- **Interview Prep** — the same language/category/topic drill-down, ending
  in a difficulty-filterable question list and a full question detail view
  (answer, scenario, common mistakes, follow-ups, bookmark, mark-practiced).
- **Bookmarks** — unified list of bookmarked lessons + interview questions.
- **AI Tutor** — conversation list + chat screen with real token-by-token
  streaming (via `XMLHttpRequest`, since RN `fetch` doesn't reliably expose
  a readable streaming body), markdown + code rendering with copy buttons,
  and deep-link entry from a lesson/question that pre-fills a starter
  message.
- **Profile/Settings** — user info, logout, light/dark/system theme toggle
  (persisted in `AsyncStorage`), manage downloaded content, app version.
- **Offline-first** — SQLite mirrors of content plus local bookmarks/progress
  tables with a `pendingSync` flag; writes apply optimistically and locally
  first, then sync immediately if online or on the next reconnect/foreground
  event via `POST /sync`.
- **Responsive layout** — bottom tabs on phone widths, a left nav rail on
  tablet widths (≥768px), and a centered max-width reading column so text
  never stretches full-bleed on large screens.

## Known limitations

- **Forgot password** calls a backend endpoint (`/auth/forgot-password`)
  that isn't part of the documented contract and may not exist yet. The
  screen calls it best-effort and always shows a "check your email"
  confirmation regardless of the outcome (this also avoids leaking whether
  an email is registered).
- **AI replies are mocked server-side** — this app has no knowledge of or
  dependency on how the backend produces its chat replies; it only renders
  whatever is streamed back from `POST /chat/sessions/{id}/messages`.
- The "download for offline" action on a lesson downloads its **entire
  parent topic** (all lessons in it) in one go, rather than a single lesson,
  since that's the natural unit the backend's `GET /topics/{id}` + per-lesson
  `GET /lessons/{id}` calls populate together.
- Recommended topics on the Home screen are a pragmatic placeholder (the
  first category's topics for the first language) since the contract has no
  dedicated "recommendations" endpoint.
- The live backend's interview-questions **list** endpoint
  (`GET /topics/{id}/interview-questions`) only returns summary fields
  (`id`, `difficulty`, `question`) — `answer`/`scenario`/`commonMistakes`/
  `followUps` come from `GET /interview-questions/{id}`. The app models
  this as `InterviewQuestionSummary` vs. the full `InterviewQuestion`
  (`types/models.ts`), and the local SQLite cache merges the two without
  letting a list refetch blank out a previously cached detail.

## Project structure

```
app/                 Expo Router routes (screens)
  (auth)/            Login, register, forgot-password
  (tabs)/            Authenticated tab/rail navigation
    tutorials/        language -> category -> topic -> lesson
    interview-prep/    language -> category -> topic -> question
    ai-tutor/          sessions list + chat
components/          Reusable UI (Card, CodeBlock, MarkdownContent, ...)
theme/               Design tokens + ThemeProvider/useTheme
context/             AuthContext
api/                 HTTP client, SSE streaming, endpoint functions
data/                SQLite schema + repositories (content, bookmarks/
                     progress + sync, chat cache, downloads)
hooks/               react-query hooks, network/responsive hooks
types/               Shared TypeScript models matching the backend contract
constants/           Runtime config + dev-only fixtures
```

## Type-checking

```bash
npm run typecheck
```
