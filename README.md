# 3EC Sports Booking Website

This project uses a simple live-ready stack:

- `Next.js`
- `TypeScript`
- `Vercel` for hosting
- `Supabase` for database and future booking storage

## Why this stack

It is a strong fit for a sports booking website because it is:

- fast to build
- easy to deploy online
- simple to grow later with payments, login, and admin tools

## Current features

- responsive landing page
- sports event booking form
- date selection for customers
- simple booking request API route
- environment template for future Supabase setup

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

## Recommended next upgrades

- connect bookings to Supabase database
- add admin dashboard for viewing bookings
- block unavailable dates automatically
- add online payments
- send email confirmation after booking
