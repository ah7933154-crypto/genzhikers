# GenZ Hikers — Complete Platform

A full-stack community platform for GenZ Hikers Pakistan.
Built with **Next.js 15**, **Supabase**, **Three.js**, **Framer Motion**, and **Tailwind CSS v4**.

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 2. Clone & Install
```bash
npm install
```

### 3. Configure Environment
Copy `.env.local` and fill in your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find these in your Supabase project → **Settings → API**.

### 4. Initialize the Database
1. Open your Supabase project → **SQL Editor**
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run it

This creates all tables, RLS policies, triggers, and seeds the leadership data.

### 5. Configure Supabase Storage
In your Supabase dashboard → **Storage**, create these buckets:
- `avatars` — Public bucket (for member profile photos)
- `gallery` — Public bucket (for hike photos)

### 6. Add Logo
Place your `logo.png` file in the `public/` folder.

### 7. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## First Admin Account

1. Register a new account at `/auth/register`
2. Confirm your email
3. In Supabase SQL Editor, run:
```sql
UPDATE profiles
SET role = 'super_admin', membership_status = 'active'
WHERE email = 'your@email.com';
```
4. Visit `/admin` to access the admin dashboard

---

## Features

### Public Website (Single-Page Scroll)
- **Hero** — 3D mountain scene with Three.js + mouse parallax
- **About** — Community story, mission & vision
- **Upcoming Hikes** — Live from database with registration
- **Announcements** — Published by admins
- **Leadership** — Authority cards managed via admin
- **Gallery** — Masonry photo grid with lightbox
- **Feedback** — Sunday-only (after 4 PM PKT) submission window
- **Elections** — Voting with eligibility enforcement
- **Goals** — Community long-term ambitions
- **Contact** — Social links (Instagram, WhatsApp, IG Group)

### Member Dashboard (`/dashboard`)
- Profile management + photo upload
- My Hikes & registration history
- Membership card request & download
- Achievement badges
- Notifications
- Gallery upload (authorized members)
- Elections & voting
- Safety / Emergency SOS

### Admin Panel (`/admin`)
- Full member management (roles, status, senior member flag)
- Hike event CRUD (create, edit, publish, postpone, cancel)
- Registration & attendance management
- Membership card approvals (generates unique IDs)
- Gallery management
- Announcements (publish, pin, mark urgent)
- Feedback moderation & responses
- Elections (create, add candidates, control voting)
- Safety incident reports
- Analytics dashboard
- Leadership/authority profiles management
- Community settings (mission, vision, social links)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Styling | Tailwind CSS v4 |
| 3D | Three.js + React Three Fiber |
| Animation | Framer Motion |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| State | Zustand |

---

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| `super_admin` | Full access to everything |
| `admin` | All admin panel features |
| `organizer` | Manage events, attendance |
| `moderator` | Moderate content & feedback |
| `executive` | Executive council member |
| `verified_member` | Vote in elections (with 2+ hikes) |
| `member` | Basic member features |

---

## Election Rules

- **Voters**: Must have ≥ 2 verified completed hikes
- **Candidates**: Must be approved senior members
- **Candidates cannot vote** in the same election
- **One vote per position** per voter (enforced by DB unique constraint)
- Results only published after voting period closes

---

## Feedback Window

Feedback submissions are **only accepted on Sundays after 4:00 PM PKT (UTC+5)**.
Outside this window, a countdown timer shows when it opens next.

---

## Membership Cards

1. Member requests card from `/dashboard/membership`
2. Admin reviews and approves at `/admin/memberships`
3. Unique `GZHYYxxxxx` ID is generated and assigned
4. Member can download the card as PNG

---

## Environment Variables Reference

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=           # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=          # Supabase service role (server-only)
NEXT_PUBLIC_APP_URL=                # Your deployed URL

# Optional
NEXT_PUBLIC_OPENWEATHER_API_KEY=    # OpenWeatherMap for weather on hike pages
NEXT_PUBLIC_MAPBOX_TOKEN=           # Mapbox for interactive trail maps
```

---

## Deployment

Works on **Vercel** (recommended):
```bash
npm run build   # Verify build passes
```
Then connect your GitHub repo to Vercel and add all environment variables.

---

## Community Links

- Instagram: [@genz_hikers](https://www.instagram.com/genz_hikers/)
- WhatsApp: [Join Channel](https://whatsapp.com/channel/0029VbDl4tzEFeXfMtxJVu08)
- Instagram Group: [Join Group](https://ig.me/j/xz3NB6N_9dQB81gG)
