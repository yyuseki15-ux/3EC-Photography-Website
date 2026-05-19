# 3EC Sports Booking Website

This project uses a simple live-ready stack:

- `Next.js`
- `TypeScript`
- `Vercel` for hosting
- `Supabase` for database-backed booking storage

## Why this stack

It is a strong fit for a sports booking website because it is:

- fast to build
- easy to deploy online
- simple to grow later with payments, login, and admin tools

## Current features

- responsive landing page
- sports event booking form
- date selection for customers
- booking request API route
- Supabase server integration for saving bookings
- SQL setup file for the bookings table

## Run locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Launch online

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Add environment variables from `.env.example`.
4. Deploy.

## Supabase setup

1. Create a Supabase project.
2. In the SQL Editor, run [supabase/bookings.sql](/E:/3EC%20Photograhhy%20Website/supabase/bookings.sql).
3. In the project Connect dialog or Settings > API Keys, copy:
   - `Project URL`
   - `Publishable key`
   - `Secret key`
4. Add them to `.env.local` and in Vercel project environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
ADMIN_PASSWORD=your-admin-password
ADMIN_SESSION_SECRET=your-long-random-session-secret
```

## Recommended next upgrades

- block unavailable dates automatically
- add online payments
- send email confirmation after booking
