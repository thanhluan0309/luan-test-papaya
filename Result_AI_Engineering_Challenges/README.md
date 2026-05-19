# AI Engineering Challenges — Insurance Domain

A collection of 14 hands-on engineering challenges built with **Next.js 16**, **React 19**, and **TypeScript**, covering real-world insurance & InsurTech scenarios from data cleaning to AI agents.

## Tech Stack

| Layer           | Technology                 |
| --------------- | -------------------------- |
| Framework       | Next.js 16 (App Router)    |
| UI              | React 19 + Tailwind CSS v4 |
| Language        | TypeScript 5               |
| Charts          | Recharts                   |
| Testing         | Vitest                     |
| Runtime scripts | tsx                        |

## Challenges

| #   | Title                                | Difficulty   | Est. Time |
| --- | ------------------------------------ | ------------ | --------- |
| 01  | Insurance Plan Comparison            | Beginner     | 2–3h      |
| 02  | Claims Data Cleanup & Report         | Beginner     | 2–3h      |
| 03  | Claim Notification Email Templates   | Beginner     | 2–3h      |
| 04  | Insurance Glossary Search            | Beginner     | 2–3h      |
| 05  | Policy Summary Generator             | Beginner     | 2–4h      |
| 06  | Policy Benefits Calculator           | Intermediate | 2–4h      |
| 07  | Claims Intake Wizard                 | Intermediate | 3–5h      |
| 08  | Medical Document Extractor           | Advanced     | 4–6h      |
| 09  | Claims Analytics Dashboard           | Intermediate | 3–5h      |
| 10  | Fraud Detection Scoring Engine       | Advanced     | 4–6h      |
| 11  | Claim Assessment AI Agent            | Advanced     | 6–8h      |
| 12  | Multi-Country Regulatory Rule Engine | Advanced     | 4–6h      |
| 13  | Partner Integration SDK              | Advanced     | 5–7h      |
| 14  | Claims Workflow Orchestrator         | Advanced     | 5–8h      |

Each challenge lives under `app/challenge-XX/` (UI) and `lib/challenge-XX/` (logic/data).

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page — challenge list
│   ├── challenge-XX/         # UI pages for each challenge
│   └── api/                  # API routes (challenges 08, 11, 13, 14)
├── lib/
│   └── challenge-XX/         # Data, logic, types per challenge
├── data/
│   ├── clean_claims.csv
│   └── dirty_claims.csv
└── scripts/
    └── clean-claims.ts       # Data generation script
```

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the landing page lists all challenges with direct links.

## Other Commands

```bash
# Run tests
npm test

# Build for production
npm run build

# Regenerate sample claims data
npm run generate-data
```

## Environment Variables

Challenges 08 and 11 call an LLM API for document extraction and claim assessment. Create a `.env.local` file at the project root:

```env
OPENROUTER_API_KEY=your_api_key_here
```

Without this key, those two challenges will return an error from their API routes. All other challenges run fully offline.
