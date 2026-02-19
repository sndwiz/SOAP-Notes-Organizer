# SOAP Notes - Clinical Practice Management Platform

## Overview
A comprehensive clinical practice management platform for mental health professionals. Combines SOAP note creation, client management, scheduling, task tracking, document management, analytics, referrals, safety planning, and AI-powered clinical assistance. Installable as PWA on iOS/Android.

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing + TanStack Query v5
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Auth**: Replit Auth (OIDC)
- **AI**: OpenAI via Replit AI Integrations (gpt-4o-mini)
- **PWA**: manifest.json + service worker for offline/installable

## Project Structure
```
client/src/
  pages/         - All page components (dashboard, clients, referrals, safety-plans, ce-resources, etc.)
  components/    - Shared components (layout-shell, soap-editor, ui/)
  hooks/         - Custom hooks (use-auth, use-toast)
  lib/           - Utilities (queryClient)
server/
  routes.ts      - All API endpoints
  storage.ts     - Database operations (IStorage interface + DatabaseStorage)
  db.ts          - Drizzle ORM connection
  replit_integrations/ - Auth, AI (chat, audio, image) integrations
shared/
  schema.ts      - Drizzle tables, types, CPT codes, diagnosis codes
  routes.ts      - API route definitions with Zod validation
```

## Database Tables
- `users` - Replit Auth users
- `soap_notes` - SOAP documentation with PHQ-9/GAD-7, risk assessment, AI suggestions
- `clients` - Client management with insurance, diagnoses
- `tasks` - Task tracking with priority/status
- `documents` - File storage (base64, up to 10MB)
- `notifications` - System notifications
- `referrals` - Provider referral network with insurance/specialty filtering, ROI tracking
- `safety_plans` - Stanley-Brown Safety Planning Intervention templates
- `ce_credits` - Continuing education credit tracking

## Key Features
- Speech-to-text dictation (WebKit SpeechRecognition, continuous mode)
- 30+ CPT codes organized by category
- 100+ DSM-5-TR aligned F-codes
- AI-powered diagnosis & CPT suggestions (POST /api/soap-notes/:id/ai-suggest)
- Document upload with categorization
- Analytics dashboard with practice metrics
- Referral management with insurance/specialty search
- Safety Plan tool (Stanley-Brown model)
- CE credit tracking with category-based progress

## Recent Changes (Feb 2026)
- Added Referrals, Safety Plans, CE Resources pages and full CRUD APIs
- Implemented AI diagnosis/CPT suggestion endpoint using OpenAI integration
- Added ownership checks on all CRUD operations
- Updated navigation sidebar with new sections

## User Preferences
- PWA approach for mobile instead of native apps
- Documents stored as base64 in PostgreSQL
- WebKit Speech Recognition for dictation
- All routes use isAuthenticated middleware
