# Track Day Planner

Mobile-first group track-day planning app.

## Product loop
1. Group members enter available dates.
2. Track-day events are ranked by group availability.
3. Members vote on shortlisted events.
4. The group confirms the winner manually.
5. Attendance and passenger counts establish the real headcount.
6. Accommodation requirements are gathered per night before searching options.

## Current build
Live alpha with shared groups, persistent availability, live Javelin event matching and multi-event voting. The group name defaults to `Track Day Heros 🏁`, and onboarding only asks members for their name and car.

## Architecture
Netlify Functions + Netlify Database provide shared state for groups, invite tokens, availability, votes and confirmed events. External track-day and accommodation sources sit behind provider adapters rather than being coupled to the UI.

## Deployment
Configured for Netlify using `netlify.toml`. Production is linked to the GitHub `main` branch.

_Last deployment trigger: 2026-09-10 21:48 BST._
