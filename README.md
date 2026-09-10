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
The first deployable MVP is intentionally frontend-only so the full interaction can be tested immediately. Demo state is stored in browser localStorage. Track events are clearly seed/demo data, not represented as live availability.

## Next architecture step
Add a persistent API/database for groups, invite tokens, availability, events, votes, confirmed trips, attendees and accommodation requirements. External track-day and accommodation sources should be implemented behind provider adapters rather than coupled to the UI.

## Deployment
Configured for Netlify using `netlify.toml`.
