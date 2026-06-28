# Backend Infrastructure Guide

All 10 phases of production-ready backend integration. Everything plugs into the existing architecture without modifying any existing AI agents, frontend, or application workflow.

---

## What Was Built

### Phase 1 & 2 — Job Aggregation & Normalization
All 11 provider adapters were already present. Key fix: **ExternalJob.platform ENUM** now includes all aggregation platforms:

```
adzuna | jsearch | arbeitnow | remoteok | remotive | usajobs
greenhouse | lever | ashby | rss | company-career
```

**Run this migration once against your database:**
```bash
node backend/migrations/001_extend_external_job_platform_enum.cjs
```

Providers: `AdzunaProvider`, `JSearchProvider`, `ArbeitnowProvider`, `RemoteOKProvider`, `RemotiveProvider`, `USAJobsProvider`, `GreenhouseProvider`, `LeverProvider`, `AshbyProvider`, `WellfoundProvider`, `RSSFeedProvider`

Each implements: `fetchJobs()`, `normalizeJob()`, `validateJob()`, `isConfigured()`, `requestWithRetry()`, `getPlatformName()`

---

### Phase 3 — Background Jobs (BullMQ)

**New packages installed:** `bullmq`, `ioredis`, `mammoth`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

Scheduler: `backend/services/SchedulerService.js`

| Schedule | Providers | Queue |
|----------|-----------|-------|
| Every 15 min | arbeitnow, remoteok, remotive, rss | job-aggregation |
| Every 1 hour | adzuna, jsearch, wellfound | job-aggregation |
| Every 6 hours | greenhouse, lever, ashby, usajobs | job-aggregation |
| Daily 02:00 UTC | All providers | job-aggregation |
| Daily 08:00 UTC | Daily digest emails | email-digests |
| Weekly Mon 09:00 UTC | Weekly summaries | email-digests |
| Daily 03:00 UTC | Expired job cleanup | job-aggregation |

Workers: `backend/workers/jobSyncWorkerProcessor.js`, `backend/workers/notificationWorkerProcessors.js`

Redis is required for queues. If Redis is unavailable, the server starts in degraded mode (no background jobs).

---

### Phase 4 — Notifications

`backend/services/NotificationService.js` (enhanced — was already present)

Socket.IO is now wired to NotificationService on startup. Notification types:
- Real-time in-app (Socket.IO to `user-{userId}` room)
- Email (nodemailer via SMTP)
- Job Match Alerts
- Application Status Updates
- Daily Digest
- Weekly Summary

Browser push notifications: stub implemented in `NotificationService.sendPushNotification()` — integrate with Web Push API when ready.

---

### Phase 5 — Storage

`backend/services/StorageService.js` (enhanced)

Supports: **Local → AWS S3 → Cloudflare R2 → GCS → Azure Blob**

New: **Cloudflare R2** support (S3-compatible). Configure via:
```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=your-bucket
R2_PUBLIC_URL=https://files.yourdomain.com  # optional
```

**File Parser:** `backend/services/FileParserService.js`
- `parseFile(buffer, mimeType, fileName)` → `{ text, pages, metadata }`
- Supports PDF (pdf-parse) and DOCX (mammoth)
- `extractResumeSections(text)` → sections + skill keywords

---

### Phase 6 — Security

| File | Purpose |
|------|---------|
| `backend/config/envValidator.js` | Validates all env vars on startup. Fails fast in production. |
| `backend/middleware/requestId.js` | `X-Request-ID` header on every request/response |
| `backend/middleware/rbac.js` | Permission matrix + `requirePermission()` middleware |
| `backend/middleware/auditMiddleware.js` | HTTP request audit logging (non-blocking) |
| `backend/middleware/rateLimiters.js` | Per-route rate limiters (global, auth, aggregation, upload) |

**RBAC permissions matrix** (see `rbac.js` for full list):
- `job:aggregate` — candidate, admin
- `application:create` — candidate, admin
- `admin:metrics`, `admin:queues`, `admin:audit` — admin only

---

### Phase 7 — Observability

New routes (all authenticated, admin-gated):

| Route | Description |
|-------|-------------|
| `GET /api/health` | Simple health (public) |
| `GET /api/health/live` | Kubernetes liveness (public) |
| `GET /api/health/ready` | Kubernetes readiness (public) |
| `GET /api/health/detailed` | Full health check (admin) |
| `GET /api/metrics` | Process + queue + storage + scheduler metrics (admin) |
| `GET /api/metrics/queues` | BullMQ queue dashboard data (admin) |
| `POST /api/metrics/queues/:name/retry-failed` | Retry failed jobs (admin) |
| `POST /api/metrics/queues/:name/clean` | Clean old jobs (admin) |
| `GET /api/metrics/storage` | Storage provider stats (admin) |
| `GET /api/metrics/scheduler` | Scheduler task status (admin) |
| `GET /api/metrics/audit` | Audit log query (admin) |

---

### Phase 8 — Company Connectors

`backend/services/CompanyConnectorService.js`

20 companies pre-configured (Greenhouse, Lever, Ashby boards).

| Route | Description |
|-------|-------------|
| `GET /api/company-connectors` | List all companies |
| `GET /api/company-connectors/health` | Health of all connectors |
| `GET /api/company-connectors/:companyId` | Fetch jobs (with `?page=&keyword=&allPages=`) |
| `POST /api/company-connectors/register` | Add new company (admin) |
| `DELETE /api/company-connectors/cache` | Clear cache (admin) |

Features: TTL cache (1hr), health tracking, pagination, keyword filtering, `fetchAllPages()`.

---

### Phase 9 — Application Package

`backend/controllers/applicationTrackingController.js`

**No third-party auto-submission.** The flow:
1. Generate tailored resume + cover letter (existing `ApplicationOrchestratorService`)
2. Create application package → stored in DB
3. User reviews → approve/reject
4. User gets official application URL (`GET /api/applications/packages/:id/apply-url`)
5. User opens URL in their browser and applies directly on employer site
6. Internal status tracked via `PATCH /api/applications/:id/status`

| Route | Description |
|-------|-------------|
| `GET /api/applications/pipeline` | Kanban-style pipeline view |
| `POST /api/applications/save` | Save a job to wishlist |
| `PATCH /api/applications/:id/status` | Update status with validation |
| `GET /api/applications/packages/:id/apply-url` | Get official application URL |
| `GET /api/applications/packages/:id/download` | Download resume + cover letter |

**Status flow:** `saved → applied → interview → offer → accepted | rejected | withdrawn`

---

### Phase 10 — Configuration

`backend/config/envValidator.js` — runs automatically at server startup.

**Required vars** (server refuses to start in production without these):
- `JWT_SECRET` (≥32 chars)
- `JWT_REFRESH_SECRET` (≥32 chars, different from JWT_SECRET)
- `DB_HOST`, `DB_NAME`, `DB_USER`

**Optional vars** — warnings only, server runs in degraded mode:
- All API keys (Adzuna, JSearch, USAJobs, etc.)
- SMTP credentials
- Cloud storage credentials
- Stripe key

---

## Files Created / Modified

### New Files
```
backend/config/envValidator.js
backend/middleware/requestId.js
backend/middleware/rbac.js
backend/middleware/auditMiddleware.js
backend/middleware/rateLimiters.js
backend/services/SchedulerService.js
backend/services/FileParserService.js
backend/services/CompanyConnectorService.js
backend/routes/metricsRoutes.js
backend/routes/companyConnectorRoutes.js
backend/routes/applicationTrackingRoutes.js
backend/controllers/applicationTrackingController.js
backend/workers/jobSyncWorkerProcessor.js
backend/workers/notificationWorkerProcessors.js
backend/migrations/001_extend_external_job_platform_enum.cjs
```

### Modified Files
```
src/server.js                         — wired up all new middleware, routes, queues, scheduler
backend/config/index.js               — added R2 config
backend/services/JobQueueService.js   — fixed IORedis graceful fallback
backend/services/StorageService.js    — added R2 support
backend/middleware/healthCheck.js     — fixed require('os') → import os
backend/routes/models/ExternalJob.js  — extended platform ENUM
.env.example                          — documented all new variables
```

---

## Running in Production

1. Ensure Redis is running
2. Set all required env vars (see `.env.example`)
3. Run the ENUM migration: `node backend/migrations/001_extend_external_job_platform_enum.cjs`
4. Start: `npm start`

The scheduler starts automatically. No separate worker process needed — workers run in-process.
