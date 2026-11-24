# MamAmie backend (Android / Expo app)

Fastify + TypeScript + Prisma. SQLite for local dev; the schema is Postgres-ready (see the note in `prisma/schema.prisma`).
This is independent of the iOS backend in the `MamAmie IOS` repo.

## Run

```powershell
npm install
copy .env.example .env      # then set JWT_SECRET to a long random string
npm run db:migrate
npm run dev                 # http://localhost:4000/health
npm test
```

On a phone, point the app at your laptop's LAN IP (e.g. `http://192.168.x.x:4000/api/v1`), not `localhost`.

## API (`/api/v1`)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{ email, password (8+), displayName? }` -> `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/refresh` | `{ refreshToken }`; rotates it. Reusing an old token revokes all sessions |
| POST | `/auth/logout` | `{ refreshToken }` |
| GET/PATCH/DELETE | `/me` | DELETE erases the account and all synced data |
| POST | `/me/password` | `{ currentPassword, newPassword }`; revokes sessions |
| GET | `/sync/pull?since=<cursor>` | Changes after the cursor; `{ changes, cursor, hasMore }` |
| POST | `/sync/push` | `{ changes: [{ collection, id, modifiedAt, deleted?, data }] }` -> `{ accepted, conflicts, cursor }` |

Access tokens last 15 minutes (`Authorization: Bearer ...`); refresh tokens 60 days.

## Sync model

The app stores everything as JSON in AsyncStorage, so the server stores each record as-is, keyed by `(user, collection, id)`.
Collections: `entries`, `medicationSchedules`, `doseLogs`, `kickSessions`, `contractions`, and `documents`
(singletons by id: `profile`, `habits`, `checks`, `hydration`, `settings`).

- Last write wins on the client's `modifiedAt`. A stale push is returned in `conflicts` with the server copy.
- Deletes are tombstones (`deleted: true`) so other devices remove the record.
- Pull with `since=0` for a full restore, then keep the returned `cursor`.

## Not built yet

Photo/attachment upload, the AI "Ask" endpoint, push notifications, email verification and password reset, and the app-side sync client.
