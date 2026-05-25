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
- sports event booking form on `/book`
- date selection for customers
- booking request API route
- manual GCash payment flow
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
```

## Email notifications

This project can send email notifications with `Resend` for:

- new booking requests to the admin email
- booking confirmations to the customer email
- booking status changes to the customer email

To enable this:

1. Create a Resend account and API key.
2. Verify your sending domain in Resend.
3. Add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ADMIN_NOTIFICATION_EMAIL` to `.env.local` and Vercel.

## Manual GCash payments

This project uses a manual GCash payment flow on the `/book` page.

To enable it:

1. Add `NEXT_PUBLIC_GCASH_NUMBER`, `NEXT_PUBLIC_GCASH_ACCOUNT_NAME`, `NEXT_PUBLIC_PAYMENT_CONTACT`, and `NEXT_PUBLIC_SITE_URL` to `.env.local` and Vercel.
2. Run the latest SQL in [supabase/bookings.sql](/E:/3EC%20Photograhhy%20Website/supabase/bookings.sql) so bookings can store payment status.

Booking flow:

- customer fills out `/book`
- site creates a booking with `awaiting_payment`
- site calculates payment automatically at `PHP 600 per whole hour`
- customer is redirected to manual GCash payment instructions
- admin receives the booking request immediately
- customer receives GCash payment instructions by email
- admin marks the payment as `paid` after verification
- customer receives confirmation after the payment is marked `paid`

## Already completed in the live web app

- block unavailable dates automatically
- disable blocked and booked time slots before submit
- manual GCash deposit flow with proof-of-payment upload
