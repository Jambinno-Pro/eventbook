# EventBook — React + Vite + Supabase

EventBook is an event booking application built with React and Vite, using Supabase for authentication, PostgreSQL data, and file storage.

## Features
- Public event listings loaded from Supabase
- User registration and login with Supabase Auth
- Admin login using a Supabase `profiles.role = 'admin'` profile
- Event creation and deletion for administrators
- Event flyer uploads to the `event-flyers` Storage bucket
- Event booking with capacity checks
- Proof-of-payment uploads to the private `proof-of-payment` Storage bucket
- Admin proof viewing through secure signed URLs
- Registration records stored in Supabase PostgreSQL
- CSV export and browser printing
- Event sharing links

## Supabase architecture

```text
React + Vite
    │
    └── src/supabase.js
            │
            ▼
        Supabase
        ├── Auth
        ├── PostgreSQL
        │   ├── events
        │   ├── profiles
        │   └── registrations
        └── Storage
            ├── event-flyers (public)
            └── proof-of-payment (private)
```

## Environment variables

Create a root `.env` file (never commit it):

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-SUPABASE-PUBLISHABLE-KEY
```

A matching `.env.example` is included.

## First-time Supabase setup

Run `supabase_eventbook_fix.sql` in the Supabase SQL Editor. It creates the profile trigger, aligns the registration columns, and applies the EventBook RLS and Storage policies.

After creating an administrator in Supabase Auth, set that user's `profiles.role` to `admin`.

## Run locally

```powershell
npm install
npm run dev
```

After changing `.env`, stop and restart Vite so the new environment variables are loaded.

## Security

- Only the Supabase publishable key belongs in the Vite frontend.
- Never put a Supabase service-role key in `.env` used by Vite.
- `proof-of-payment` remains private and is opened with signed URLs for administrators.
- The unrelated legacy `backend/` folder is intentionally excluded from EventBook.
