# Specify Architecture

This document describes the system architecture for Specify after migrating to Supabase.

## System Overview

Specify is a Next.js application (App Router) that uses Supabase for Auth, Postgres data storage, and realtime updates, and Google Gemini for AI-based order extraction.

Key components:

- Next.js (frontend + server routes)
- Supabase Auth (email/password)
- Supabase Postgres (tables: `users`, `orders`)
- Supabase Realtime (logical replication → realtime events)
- Google Gemini (AI extraction)

## Application Layers

Presentation (Frontend)

- Pages and components implement role-based dashboards and protected routes.
- Login page uses `lib/auth-context.tsx` which integrates Supabase Auth.
- Customer Service UI includes the AI extraction flow and order list components.

Business Logic (Hooks & Context)

- `useAuth()` / `AuthProvider` manage session and profile sync with `public.users`.
- Custom hooks (e.g. `useOrders`) should subscribe to Supabase Realtime channels or query Postgres.

API Layer

- Server route `/api/gemini/extract-order` proxies requests to Google Gemini and returns structured order data.
- Future server routes can be added for order processing, inventory, and payments; prefer server-side logic for secrets.

Data Layer

- `public.users` stores profile metadata and maps to Supabase Auth user `id`.
- `public.orders` stores order JSON in `items` (JSONB) and basic metadata (status, total_amount).
- Use `sql/supabase-init.sql` to create schema, triggers, and demo data; that file also includes permissive RLS policies for development — tighten before production.

## Security & RLS

- Development script enables permissive RLS for convenience. In production, implement policies such as:
  - Users may read their own profile: `auth.uid() = id`
  - Admins may read/write all rows (check `role` claim)
  - Orders can be created by authenticated users; updates restricted to order owner or admins

## Scalability

- Supabase Postgres scales differently than Firestore; plan for indexes, pagination, and connection pooling in server-side workloads.
- Use Supabase Realtime for live UI updates; for very high-scale scenarios, consider dedicated websocket/pubsub layers.

## Deployment

- Frontend: Vercel or any Node.js host.
- Supabase: managed service (database + auth). Keep service_role key secure for migrations.

## Notes

- Primary docs now: `README.md`, `ARCHITECTURE.md`, and `sql/supabase-init.sql`.
- Remove or archive older Firebase-specific docs; the repo now uses Supabase.

Last Updated: 2026-05-25
For implementation details, see other documentation files.
