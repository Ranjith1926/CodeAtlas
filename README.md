# CodeAtlas

**Learn. Explore. Master.**

A unified programming tutorial and interview-prep platform with an AI tutor chatbot — React Native/Expo mobile app backed by a real ASP.NET Core + SQL Server API.

## Repo layout

```
backend/   ASP.NET Core Web API (EF Core, SQL Server, JWT auth, Gemini-powered AI tutor)
mobile/    Expo + React Native + TypeScript app (Expo Router)
```

Each half has its own README with full setup details: [`backend/README.md`](backend/README.md), [`mobile/README.md`](mobile/README.md).

## Features

- **Tutorials** — language → category → topic → lesson, syntax-highlighted code examples, bookmarks, progress tracking, offline downloads.
- **Interview Prep** — topic-wise question bank with difficulty filtering, scenarios, common mistakes, and follow-ups.
- **AI Tutor** — real streamed chat (Gemini by default, OpenAI pluggable), with conversation history.
- **Offline-first mobile** — SQLite caches content and queues bookmark/progress writes, syncing automatically when back online.
- **Responsive UI** — bottom tabs on phone, a nav rail on tablets, light/dark/system theming.

## Quick start

### Backend

```bash
cd backend
cp src/CodeAtlas.Api/appsettings.Development.json.example src/CodeAtlas.Api/appsettings.Development.json
# edit that file: set a real JWT signing secret and (optionally) a Gemini API key
dotnet ef database update --project src/CodeAtlas.Infrastructure --startup-project src/CodeAtlas.Api
dotnet run --project src/CodeAtlas.Api
```

API runs at `http://localhost:5212`, with Swagger at `/swagger`. Requires .NET SDK 10+, the `dotnet-ef` tool, and SQL Server LocalDB. See [`backend/README.md`](backend/README.md) for the full endpoint list and seeding details.

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Point the app at your backend via `EXPO_PUBLIC_API_URL` (defaults to the Android emulator alias for `localhost:5212`; use your machine's LAN IP for a physical device). See [`mobile/README.md`](mobile/README.md) for platform-specific notes and a full feature/architecture breakdown.

## Tech stack

React Native · Expo · TypeScript · Expo Router · React Query · Expo SQLite — ASP.NET Core · Entity Framework Core · SQL Server · ASP.NET Core Identity + JWT · Google Gemini API
