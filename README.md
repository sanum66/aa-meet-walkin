# IRTTAA NuzhAI — Alumni Meet Event Portal

**IRTTAA NuzhAI** is the official multi-event alumni registration, venue check-in, payment reconciliation, and analytics web portal built for the **Institute of Road and Transport Technology Alumni Association (IRTTAA)**.

It replaces manual event-day spreadsheets with an automated, mobile-friendly venue check-in flow that links official IRTTAA association records, website pre-registrations, batch-based fee configurations, voluntary contributions, and live financial reporting.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling & Motion**: Tailwind CSS v4 (`@tailwindcss/postcss`), Framer Motion, Lucide React
- **Validation & CSV Engine**: Zod + custom RFC-4180 CSV parser & data normalizer
- **Database & Auth**: Supabase (PostgreSQL 17, Row Level Security, Supabase Auth)
- **Architecture**: Clean Layered Backend (`controllers` → `services` → `repositories` → `validators` → `config`) — see [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)

---

## Core Features & User Flows

### 1. Multi-Event & Batch Fee Engine (Admin)
- Create and manage multiple chapter meets, annual meets, or special events (`events`).
- Switch the active portal event in one click — the Home page (`/`) and Registration form (`/register`) update dynamically.
- Default batch fee rules are automatically seeded per event in `event_fee_configurations` and can be customized per event:
  - **1988 – 2000**: ₹500
  - **2001 – 2010**: ₹400
  - **2011 – 2020**: ₹300
  - **2021 – 2027**: ₹0 (Free Entry)

### 2. CSV Master & Pre-Registration Importers (Admin)
- **Association Members (`IRTT_AA_Members.csv`)**: Upload anytime to append newly registered members and automatically update existing members (e.g., membership tier upgrades `REGISTERED_MEMBER` → `LIFE_MEMBER` / `PATRON_MEMBER`). Normalizes courses (`B.E. → BE`), streams, and phone numbers.
- **Event Pre-Registrations (`event_pre_registrations.csv`)**: Upload website registration exports directly into any selected event. The system automatically assigns `event_id` to every row, maps accompanying counts into `accompanying_family_count`, and prevents duplicate rows on re-import via `UNIQUE (event_id, email)`.

### 3. Volunteer check-in (`/register`, desk PIN or organizer)
Volunteers check people in at the desk. Attendees do not check themselves in.
1. **Registered for the event**: search by email or mobile. Someone already checked in gets their existing pass; someone on the attendee list has their details filled in.
2. **Did not register**: search the association alumni list by name, email or mobile and select the person. Their details and membership are filled in.
3. **Not on the alumni list**: **Add new** and fill in the details. They are listed under the event's **New alumni** tab.
4. **Details**: batch, branch, course, food and number of family members.
5. **Payment**: the fee comes from the event's batch fees; optional contribution; UPI (last 4 digits of the reference) or cash.
6. **Review**: everything is shown for the volunteer to confirm with the person before submitting.
7. **Pass**: printable pass with a number like `IRTTAA-0001`.

### 4. Organizer area (`/admin`) and check-in desk (`/checkin`)
- **`/admin`**: list of events (Published, Upcoming, Past) with a **New event** button, plus the association **Members list**.
- **`/admin/events/[id]`**: everything about one event:
  - **Publish / Unpublish**: only the published event is open for check-in and visible to desk volunteers. Publishing one event unpublishes the previous one. New events start as drafts.
  - **Overview**: check-ins, total people, money collected (UPI vs cash, fees vs contributions), food, batch and branch counts, CSV downloads.
  - **People**: checked in vs not arrived, search, tap a person to correct details or payment.
  - **New alumni**: people added at the desk who were not on the alumni list, with a CSV download.
  - **Attendees**: upload the website's event attendees CSV.
  - **Fees**: fee rules. Each rule has a start year, end year, fee and the member types it applies to (Patron, Life, Registered, Not a member; select several). Rules for the same member type may not overlap.
  - **Desk PIN**: shown under the publish control; volunteers sign in with it.
  - **Settings**: edit details or delete the event.
- **`/checkin`**: volunteers (desk PIN of the published event) see who has checked in and who has not arrived, and start new check-ins.

---

## Database Schema

The PostgreSQL schema lives in [`data/DataBase_design/001_nuzhai_schema.sql`](./data/DataBase_design/001_nuzhai_schema.sql) and includes 5 core tables:

| Table | Purpose |
| :--- | :--- |
| `association_members` | Master list of recognized IRTTAA members imported from CSV (`PK: member_login_id`, `UNIQUE: email`) |
| `events` | Chapter events and annual meets (`PK: event_id`, `event_date`, `event_time`, `venue`, `is_active`) |
| `event_fee_configurations` | Per-event fee rules driven by graduating year range & membership type |
| `event_pre_registrations` | Website pre-registration records scoped per event (`UNIQUE: (event_id, email)`) |
| `event_registrations` | Immutable event-day check-in & payment snapshot (`UNIQUE: (event_id, email)`) |

---

## Local Setup Guide

### 1. Prerequisites
- **Node.js** 18.x or 20.x+ and **npm**
- A **Supabase** project

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/sanum66/aa-meet-walkin.git
cd aa-meet-walkin
git checkout irttaa_nuzhai_app
cd new_web_app
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```
Fill in `.env.local` (every variable is explained inside the file):

| Variable | What it is |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project URL and publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **secret** key (Dashboard → Project Settings → API Keys). Server-only. |
| `AUTH_SECRET` | 32+ random characters for signing logins: `openssl rand -base64 48` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The main organizer login (password 8+ characters) |
| `ADMIN_EMAILS` | Optional extra organizers: comma-separated emails of users created in Supabase → Authentication → Users |
| `DESK_PIN` | PIN that venue volunteers use to open the check-in desk |

### 4. Initialize the Supabase Database
In **Supabase Dashboard → SQL Editor**, run in order:
1. [`001_nuzhai_schema.sql`](./data/DataBase_design/001_nuzhai_schema.sql) — tables, enums, indexes, triggers (fresh projects only; it drops existing tables).
2. [`002_security_hardening.sql`](./data/DataBase_design/002_security_hardening.sql) — blocks direct public access to the tables, allows only one active event, and adds data-integrity checks. **Set `SUPABASE_SERVICE_ROLE_KEY` first**, otherwise the app loses database access. Safe to run on a database that already has data.
3. [`003_event_desk_pin.sql`](./data/DataBase_design/003_event_desk_pin.sql): adds a desk PIN to each event, set by organizers on the event page. Until it runs, volunteers use the `DESK_PIN` environment variable.

### 5. Run the Application
```bash
# Development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

For a production build:
```bash
npm run build
npm run start
```

---

## Routes & Admin Credentials

| Route | Access | Description |
| :--- | :--- | :--- |
| `/` | Public | Dynamic active event landing page & portal links |
| `/register` | Desk / Organizer | Volunteer check-in: find, details, review, pass |
| `/checkin` | Desk / Public | Volunteer desk directory (Awaiting vs Checked-In passes) |
| `/admin/login` | Admin | Login via Supabase Auth user or organizer quick access |
| `/admin` | Organizer | Events list, event pages, members list |

**Access**:
- **Organizers** sign in at `/admin/login` → *Organizer* with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, or as a Supabase Auth user listed in `ADMIN_EMAILS`. They get the full `/admin` dashboard.
- **Desk volunteers** sign in at `/admin/login` → *Desk volunteer* with the published event's desk PIN. They can check people in and view that event's lists, nothing else.
- Only `/` (event details) is public. Check-in at `/register` needs a desk PIN or organizer sign-in.
- Sessions are signed, httpOnly cookies; every `/admin` page and `/api/admin` endpoint is checked on the server (`src/middleware.ts`).

### Running a new event (every time)
1. **Members list** (from the events page): upload the latest `IRTT AA Members.csv`.
2. **New event**: fill in the details. It is saved as a draft.
3. In the event: **Attendees** → upload the website's event attendees CSV. **Fees** → add fee rules (start year, end year, fee, member types).
4. On the day: **Publish** the event and set the **Desk PIN** on the event page. Give the PIN to the volunteers.
5. Volunteers sign in at `/admin/login` → *Desk volunteer* and use **New check-in**:
   - Registered for the event → search by email or mobile.
   - Did not register → search the alumni list by name, email or mobile and select the person.
   - Not on the alumni list → **Add new**. They appear under the event's **New alumni** tab.
   - Every check-in is reviewed before it is submitted.
6. After the event: **Overview** → download check-ins and the attendee list; **New alumni** → download the CSV; then **Unpublish**.

Attendees cannot check themselves in: the public page only shows the event details.

---

## Testing With Sample CSV Data

Sample datasets are included in [`data/Example_data/`](./data/Example_data):
1. Sign in at **`/admin/login`** and open **Members list** → upload [`IRTT_AA_Members.csv`](./data/Example_data/IRTT_AA_Members.csv) (26 members).
2. **New event** → create an event, open it, go to **Attendees** → upload [`event_pre_registrations.csv`](./data/Example_data/event_pre_registrations.csv) (19 rows, 3 match members).
3. **Publish** the event, sign in as a desk volunteer, open **New check-in** and try:
   - On the attendee list: `9597247891` or `msanthosh66@gmail.com`
   - Members list only: `prabhu1274@gmail.com`
   - New person: **Fill in my details instead**, batch 2024 (no fee)
4. Back in the event, check **Overview** and **People**.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port `3000` |
| `npm run build` | Builds the optimized production bundle |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs Next.js ESLint checks |
| `npx tsc --noEmit` | Runs full TypeScript static type checking |

---

## Further Documentation
- See [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) for a detailed file-by-file breakdown of every folder, repository, service, controller, component, and API endpoint.
