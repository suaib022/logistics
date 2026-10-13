# Ciketo Logistics Dashboard

An administrative dashboard for Ciketo, a global logistics and freight company, built with Next.js App Router, TypeScript, and Supabase. 

## Overview

This dashboard allows logistics staff to:
1. **Manage Orders**: Create shipments, track route and cargo details, and update transit statuses through a unified timeline.
2. **Handle Quotes**: Review customer quote requests for freight services and progress them through review and approval stages.
3. **Track Orders**: Look up individual orders and their chronological event history.

## Architecture

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL) using Service Role Server Actions
- **Styling**: Tailwind CSS with custom CSS variable design tokens
- **Validation**: Zod
- **Testing**: Vitest for unit tests, Playwright for End-to-End tests

## Design System

The application strictly adheres to the Ciketo editorial design principles (as defined in `DESIGN_TOKENS.md`). UI elements emphasize typography, white space, clean lines, and stark high-contrast layouts. Tailwind classes correspond strictly to root CSS variables for colors to maintain absolute consistency. A custom `check-design.js` script ensures developers do not accidentally introduce off-brand hex colors into the codebase.

## Requirements Checklist Status

- [x] Use Next.js App Router and TypeScript.
- [x] Use Supabase for database.
- [x] Service role backend access only (no client-side Supabase).
- [x] Strict Zod schemas for models and forms.
- [x] `status.ts` for strict definitions.
- [x] Custom CSS design tokens in `globals.css` and `DESIGN_TOKENS.md`.
- [x] `verify` script that passes flawlessly.
- [x] `001_init.sql` and `seed.sql`.
- [x] Implementation of `Orders`, `Quotes`, and `TrackOrder` pages.

## Getting Started

Please see `SETUP.md` for complete installation and configuration instructions.

## Development

- `npm run dev` starts the local development server.
- `npm run verify` runs the full test suite and build verification check.
