# SOAP Notes - Clinical Practice Management Platform

## Overview
A comprehensive clinical practice management platform for mental health professionals. Combines SOAP note creation, client management, scheduling, task tracking, document management, analytics, referrals, safety planning, billing/insurance tracking, Utah mental health law reference, client portal, secure messaging, and AI-powered clinical assistance. Installable as PWA on iOS/Android.

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing + TanStack Query v5
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Auth**: Dual auth system - Replit Auth (OIDC) for providers, bcryptjs session-based for client portal
- **AI**: OpenAI via Replit AI Integrations (gpt-4o-mini)
- **PWA**: manifest.json + service worker for offline/installable

## Project Structure
```
client/src/
  pages/         - All page components (dashboard, clients, messaging, billing, utah-law, portal-login, portal-dashboard, etc.)
  components/    - Shared components (layout-shell, soap-editor, ui/)
  hooks/         - Custom hooks (use-auth, use-toast)
  lib/           - Utilities (queryClient)
server/
  routes.ts      - All API endpoints (~65 route handlers)
  storage.ts     - Database operations (IStorage interface + DatabaseStorage)
  db.ts          - Drizzle ORM connection
  replit_integrations/ - Auth, AI (chat, audio, image) integrations
shared/
  schema.ts      - Drizzle tables, types, CPT codes, diagnosis codes, intake form types, Utah code categories
  routes.ts      - API route definitions with Zod validation
```

## Database Tables
- `users` - Replit Auth users
- `soap_notes` - SOAP documentation with PHQ-9/GAD-7, risk assessment, AI suggestions
- `clients` - Client management with insurance, diagnoses
- `tasks` - Task tracking with priority/status
- `documents` - File storage (base64, up to 10MB, sharedWithClient flag)
- `notifications` - System notifications
- `referrals` - Provider referral network with insurance/specialty filtering, ROI tracking
- `safety_plans` - Stanley-Brown Safety Planning Intervention templates
- `ce_credits` - Continuing education credit tracking
- `client_portal_accounts` - Client portal login credentials (email/bcrypt password, linked to clients table)
- `message_threads` - Secure messaging threads between provider and client
- `messages` - Individual messages within threads (senderType: provider/client)
- `intake_forms` - Patient intake forms (demographics, mental health history, consent, insurance info)
- `billing_records` - Insurance billing and claims tracking (CPT codes, ICD codes, claim status)
- `utah_codes` - Utah mental health law reference codes
- `audit_logs` - HIPAA audit trail (action, resourceType, resourceId, IP, userAgent, timestamp)
- `consent_documents` - Consent tracking (documentType, status: pending/signed/expired, signedAt, expiresAt, witnessName)
- `treatment_plans` - Treatment plans (diagnoses, goals with objectives, interventions, frequency, startDate, reviewDate)

## Key Features
- Speech-to-text dictation (WebKit SpeechRecognition, continuous mode)
- 30+ CPT codes organized by category
- 100+ DSM-5-TR aligned F-codes
- AI-powered diagnosis & CPT suggestions (POST /api/soap-notes/:id/ai-suggest)
- Document upload with categorization and client sharing
- Analytics dashboard with practice metrics
- Referral management with insurance/specialty search
- Safety Plan tool (Stanley-Brown model)
- CE credit tracking with category-based progress
- Secure messaging between providers and clients
- Billing/insurance tracking with claim status workflow
- Utah mental health law reference with AI-assisted search
- Client portal with intake forms, document viewing, and messaging
- Dual authentication (Replit Auth for providers, email/password for client portal)
- HIPAA compliance: audit logging, consent tracking, treatment plans
- Session auto-timeout (15 min inactivity) with 2-minute warning dialog
- Compliance dashboard with consent tracking, treatment plan management, audit log viewer
- Printable clinical paperwork: Informed Consent, HIPAA Notice, ROI, Telehealth Consent, Cancellation Policy, Financial Agreement, Superbill, Discharge Summary

## Architecture Decisions
- **Dual Auth**: Providers authenticate via Replit Auth (OIDC). Clients authenticate via email/password stored in client_portal_accounts with bcryptjs hashing. Portal sessions stored in express-session (portalClientId, portalUserId).
- **Portal Middleware**: isPortalAuthenticated middleware checks session for client portal routes. All portal routes scoped under /api/portal/*.
- **Document Sharing**: Documents have sharedWithClient boolean. Portal only shows shared documents without base64 data field.
- **Messaging**: Thread-based model. Provider messages via /api/message-threads/:id/messages. Client messages via /api/portal/messages/:threadId. Auto mark-read on view.
- **Utah Law AI**: POST /api/utah-codes/ai-search searches DB first, then passes results to OpenAI gpt-4o-mini for contextual legal summary.

## Architecture Decisions (HIPAA)
- **Audit Logging**: logAuditEvent helper in routes.ts logs all sensitive operations (view/create/update/delete) on consent documents, treatment plans, billing records
- **Session Timeout**: 15-minute inactivity timer in LayoutShell with 2-minute warning dialog. Events: mousedown, keydown, scroll, touchstart
- **Consent Tracking**: Status lifecycle: pending -> signed -> expired. Tracks signature data, witness, expiration dates
- **Treatment Plans**: Structured goals format with objectives, target dates, status tracking per goal

## Recent Changes (Feb 2026)
- Added 9 new database tables: client_portal_accounts, message_threads, messages, intake_forms, billing_records, utah_codes, audit_logs, consent_documents, treatment_plans
- Built 40+ new API endpoints with authentication, ownership checks, and audit logging
- Created provider-side pages: Messaging, Billing, Utah Law Reference, Compliance, Paperwork
- Created client portal: Login page, Dashboard with Documents/Intake Forms/Messages tabs
- Implemented dual auth system (Replit Auth + bcryptjs email/password)
- Added HIPAA compliance infrastructure: audit logging, consent tracking, treatment plans
- Added session auto-timeout for HIPAA security
- Built 8 printable clinical document templates with @media print formatting
- Updated navigation sidebar with all new sections

## User Preferences
- PWA approach for mobile instead of native apps
- Documents stored as base64 in PostgreSQL
- WebKit Speech Recognition for dictation
- All provider routes use isAuthenticated middleware
- Client portal routes use isPortalAuthenticated middleware
- Professional and personal communication kept separate via portal messaging
