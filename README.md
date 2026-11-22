# DengueNet BD

A map-based web app that shows dengue risk for every district in Bangladesh, from most to least dangerous, and helps people find a hospital bed, an ambulance and the medicine they need. AI agents assess risk, suggest hospitals and spot medicine shortages; an admin approves or overrides their suggestions.

CSE327 Software Engineering · Section 07 · Group 04
Shaira Tahsin Era · Meher Jabin Shuprova · Md. Muhaiminul Islam

> **Prototype.** All case numbers, bed counts, stock levels and phone numbers (01000-xxxxxx) are sample data. The national numbers 999, 16263 and 333 are real.

## Run it

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other scripts: `npm run build` (production build), `npm run lint`.

## Pages

| Page | What it does |
|---|---|
| `/` Risk map | Main screen. All 64 districts coloured by risk (red, orange, amber, green), ranked list from most to least dangerous, click a district for details, forecast, hospitals, emergency numbers and medicine. Hospital and pharmacy layers. |
| `/hospitals` | **AI feature 2:** describe the patient (district, severity, ICU need) and the hospital agent ranks hospitals with reasons. Full hospital directory with filters. |
| `/emergency` | National numbers (999, 16263, 333), ambulances by district, dengue warning signs. |
| `/medicine` | Pharmacy stock of IV saline, ORS, paracetamol and NS1 kits by district. Shortages found by the supply agent. |
| `/admin` | Admin portal (sign in as admin). Simulate an outbreak, see the coordinator's plan, approve or override each action, agent activity log, charts. |
| `/signup` | Create an account as a public user or hospital staff, with home district (and hospital for staff). |
| `/login` | Sign in as public user, hospital staff or admin; each role goes to its own portal. Prototype: any email and password works. |
| `/portal` | Public user portal: risk and 7-day forecast for my district, alerts, other districts I follow, free beds near me, alert settings. |
| `/staff` | Hospital staff portal: update free dengue and ICU beds, accept or decline patients sent by the hospital agent. |

## The agents

All in `src/lib/agents/`. They are rule-based TypeScript agents with lightweight orchestration (the Coordinator): fast, free, testable and predictable. No LLM is used.

| Agent | File | Job |
|---|---|---|
| Risk Prediction | `risk.ts` | **AI feature 1.** Scores each district 0–100 from weekly cases, growth and rainfall; sets the risk level and a 7-day forecast, with reasons. |
| Hospital Allocation | `hospital.ts` | Ranks hospitals for a patient by free beds, ICU, distance and load. |
| Supply Monitoring | `supply.ts` | Finds high-risk districts short of key medicines and suggests a donor district. |
| Coordinator | `coordinator.ts` | Collects the other agents' suggestions into one plan for admin approval. |

Human in the loop: a simulated outbreak changes the *draft* data; the public map only changes after an admin approves the risk agent's action (`src/lib/store.tsx`).

## Project structure

```
public/data/          district boundaries (GeoJSON) and neighbouring countries
src/app/              one folder per page (Next.js App Router)
src/components/       map, panels, charts, navigation
src/data/             sample districts, hospitals, pharmacies, ambulances (JSON)
src/lib/agents/       the four agents
src/lib/store.tsx     shared app state (React context)
src/types.ts          shared TypeScript types
```

## Stack

Next.js 16 + React 19 + TypeScript · Tailwind CSS 4 · Leaflet + react-leaflet · Recharts · Hind Siliguri font (Bangla + English).
Planned next: Supabase (PostgreSQL + Auth), Vitest + Playwright, Postman, GitHub Actions, Vercel.

## Data credits

District boundaries derived from the `bd-geojson` package (OpenStreetMap-based data, ODbL). Map tiles © OpenStreetMap contributors. Country outlines from Natural Earth via `world-atlas`.
