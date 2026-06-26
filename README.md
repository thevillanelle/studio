# Studio (Matelier)

**Part of the [Ritualware Suite](https://ritualware.app)**

Matelier is the creative studio manager. Track active projects, goals, skills, and your creative circle. Built for artists, composers, and multi-hyphenate creators who need a structured workspace for long-term creative work.

## What it does

- **Projects** — Track creative projects by status (active, planning, complete)
- **Goals** — Time-boxed goals by category (music, content, business, personal)
- **Skills** — Skill inventory with category and level tracking
- **Circle** — Your creative collaborators and their roles

## Who it's for

Elle and VILE community members building a creative practice that compounds.

## Run locally

```bash
cp .env.example .env.local   # add your Supabase credentials
npm install
npm run dev
```

## Test

```bash
npm test
```

## Stack

- React + Vite
- Zustand (auth + state)
- Supabase (auth, data)
- Tailwind CSS
- Deployed on Vercel

## Data

See [`schema.sql`](schema.sql) for the tables this app owns:
`atelier_projects`, `atelier_goals`, `atelier_skills`, `atelier_circle`.
Robin reads from these tables to populate the Studio Dashboard.
