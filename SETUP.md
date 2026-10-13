# Setup Ciketo Logistics Dashboard

Follow these steps to set up the Ciketo admin dashboard on your local machine.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account

## 1. Supabase Database Setup

1. Create a new Supabase project in your organization.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `001_init.sql` from the root of this project and execute its contents. This will:
   - Enable the `uuid-ossp` extension.
   - Create the `orders`, `order_events`, and `quotes` tables.
   - Set up automatic timestamp triggers.
4. (Optional) To populate the database with mock data, open `seed.sql` and execute its contents.

### 1.1 Support Tickets & Handoffs Layer (Migration 003)

1. Open `supabase/migrations/003_tickets.sql` from this repository and paste into the **SQL Editor** in Supabase, then click **Run**. This creates:
   - Sequence `ticket_seq`
   - Tables `tickets` and `ticket_notes` with all check constraints and indexes
   - Row Level Security (RLS) enabled on both tables (no public policies)
   - `updated_at` timestamp trigger on `tickets`
   - Automatic `after insert` system note trigger on `tickets` ("Ticket created via <source>")
   - Secure RPC functions: `create_ticket(p jsonb)`, `add_ticket_note(...)`, `update_ticket(...)`, and `ticket_counts()`
   - Strict service_role execution grants (execution revoked from anon and authenticated)
2. Open `supabase/seed_tickets.sql` and execute its contents in the SQL Editor to seed 10 sample tickets across all statuses, priorities, and categories (5 handoffs, 2 urgent, 3 resolved/closed, and 2 transcript notes).
3. Verify the setup via CLI:
   ```bash
   npm run check:tickets
   ```

## 2. Environment Variables

Create a `.env.local` file in the root of the project and add the following keys from your Supabase project settings (Project Settings -> API):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **Warning:** Do not commit the `.env.local` file to version control. The `SUPABASE_SERVICE_ROLE_KEY` provides admin access to your database and should be kept secure.

## 3. Installation and Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. Quality Checks

To ensure code quality, design compliance, and to run end-to-end tests, use the verify script:

```bash
npm run verify
```

This runs linting, typechecking, unit tests, the custom design token checker, Next.js build, and Playwright E2E tests.
