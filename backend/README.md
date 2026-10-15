# CodeAtlas Backend

A real, locally-hosted ASP.NET Core Web API backed by SQL Server LocalDB. Only the AI chatbot
(`MockAiChatService`) is mocked — everything else (auth, content, user data, EF Core persistence)
is a genuine, runnable backend.

## Solution layout

```
backend/
  CodeAtlas.slnx                   -- solution (new .slnx format; `dotnet build CodeAtlas.slnx`)
  src/
    CodeAtlas.Api/                 -- ASP.NET Core Web API host (controllers, Program.cs, Swagger, middleware)
    CodeAtlas.Application/         -- DTOs and service interfaces (no EF/infra dependencies)
    CodeAtlas.Domain/               -- entities, enums (no EF/infra dependencies)
    CodeAtlas.Infrastructure/       -- EF Core DbContext, Identity, JWT, services, MockAiChatService, seed loader
```

## Prerequisites

- .NET SDK 10.0.402+ (`dotnet --version`)
- `dotnet-ef` global tool 10.0.9+ (`dotnet tool install --global dotnet-ef` if missing)
- SQL Server LocalDB, instance `MSSQLLocalDB` (verify with `sqllocaldb info MSSQLLocalDB`)

## Configuration

- `src/CodeAtlas.Api/appsettings.Development.json` holds the LocalDB connection string and the JWT
  signing key/issuer/audience. The signing key here is a **dev-only** random secret — fine to commit
  for local development, but replace it before any real deployment.
- `src/CodeAtlas.Api/appsettings.json` fixes Kestrel to `http://localhost:5212` (no HTTPS — this
  keeps Android emulator cleartext HTTP simple for local dev; HTTPS redirection middleware is not
  registered) and sets `"AiProvider": "Mock"`.

## Running migrations

From the `backend/` directory:

```bash
dotnet ef migrations add InitialCreate --project src/CodeAtlas.Infrastructure --startup-project src/CodeAtlas.Api
dotnet ef database update --project src/CodeAtlas.Infrastructure --startup-project src/CodeAtlas.Api
```

The `InitialCreate` migration is already committed in `src/CodeAtlas.Infrastructure/Migrations/`, so
for a fresh clone you generally only need the `database update` step.

## Running the API

```bash
dotnet run --project src/CodeAtlas.Api
```

This uses `Properties/launchSettings.json`, which sets `ASPNETCORE_ENVIRONMENT=Development` and
binds to `http://localhost:5212`. In Development, `Program.cs` automatically:

1. Applies any pending EF Core migrations (`db.Database.MigrateAsync()`).
2. Seeds the database if the `Languages` table is empty:
   - All 12 languages (`fundamentals`, `javascript`, `typescript`, `csharp`, `dotnet`,
     `aspnet-web-api`, `html`, `css`, `react`, `nextjs`, `python`, `sql`).
   - `javascript` and `csharp` content trees are loaded from
     `src/CodeAtlas.Infrastructure/Seeding/Content/javascript.json` and `csharp.json`.
   - The other 9 languages get one inline stub category/topic/lesson ("Full content coming soon.").

**Base URL: `http://localhost:5212`**
Swagger UI: `http://localhost:5212/swagger` (always enabled in Development, with a "Bearer" auth
button for JWT-protected endpoints).

### Important note on seed content

`Seeding/Content/javascript.json` and `Seeding/Content/csharp.json` are owned by a separate
content-authoring workstream. **At the time this backend was built, those files did not exist yet**,
so placeholder stub JSON files (matching the exact schema the loader expects) were created so the
app compiles and runs end-to-end. Once the real files are dropped in:

- If you're starting from a fresh database, nothing else is needed — `dotnet run` will load the
  real content on first seed.
- If you already have a seeded LocalDB (from the placeholder content), seeding only runs when the
  `Languages` table is empty. To re-seed with the real content, drop and recreate the database:
  ```bash
  dotnet ef database drop --project src/CodeAtlas.Infrastructure --startup-project src/CodeAtlas.Api --force
  dotnet ef database update --project src/CodeAtlas.Infrastructure --startup-project src/CodeAtlas.Api
  dotnet run --project src/CodeAtlas.Api
  ```

## Endpoint list

### Auth (`/api/auth`)
- `POST /register` { email, password, displayName }
- `POST /login` { email, password }
- `POST /refresh` { refreshToken } — rotates the refresh token (old one revoked)
- `POST /logout` { refreshToken }
- `GET /me` [Authorize]

### Content (anonymous GETs)
- `GET /api/languages`
- `GET /api/languages/{code}/categories`
- `GET /api/categories/{id}/topics`
- `GET /api/topics/{id}`
- `GET /api/lessons/{id}`
- `GET /api/topics/{id}/interview-questions?difficulty=Beginner|Intermediate|Advanced`
- `GET /api/interview-questions/{id}`

### User data [Authorize]
- `GET /api/bookmarks`, `POST /api/bookmarks`, `DELETE /api/bookmarks/{id}`
- `GET /api/progress`, `PUT /api/progress`
- `POST /api/sync`

### Chat [Authorize]
- `GET /api/chat/sessions`
- `POST /api/chat/sessions` { title?, contextTopicId? }
- `GET /api/chat/sessions/{id}/messages`
- `POST /api/chat/sessions/{id}/messages` { content } — streams the assistant reply as
  Server-Sent Events (`text/event-stream`, `data: {"delta":"..."}\n\n`, final `data: [DONE]\n\n`)

## AI provider switch

`"AiProvider"` in `appsettings.json` controls which `IAiChatService` implementation is registered:
- `"Mock"` (default) → `MockAiChatService`, 8 keyword-aware canned templates + generic fallback.
- `"OpenAI"` → `OpenAiChatService`, a compiling skeleton that currently throws
  `NotSupportedException` until the real OpenAI streaming call is implemented.

## Smoke-testing

```bash
curl -X POST http://localhost:5212/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Password123","displayName":"You"}'

curl -X POST http://localhost:5212/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Password123"}'

curl http://localhost:5212/api/languages

curl -X POST http://localhost:5212/api/chat/sessions -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"title":"Test"}'

curl -N -X POST http://localhost:5212/api/chat/sessions/1/messages \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"content":"explain closures"}'
```
