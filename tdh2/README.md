# TDH 2.0 — clean rebuild (work in progress)

This folder is an isolated replacement interface for Track Day Heros. The legacy application at the repository root is unchanged.

## Current milestone: annual Planner
- Charcoal/orange mobile-first interface with Planner, Booked, Crew navigation.
- Twelve-month calendar with independent monthly date selections.
- Per-month circuit preferences and event filtering.
- Search uses existing Supabase track-day-events and motorsport-events-feed Edge Functions. Provider failures are shown rather than silently treated as no events.
- Event preferences, local interests, and a minimal name/car profile are saved in localStorage on the current device.

## Not yet implemented
- Shared crew authentication, syncing, interest totals, booking confirmations, accommodation/trailer storage, Waze routes and avatar picker. The Booked and Crew screens are clearly labelled where incomplete.
- Rebuilt provider ingestion and stable canonical event identities. Current search is a temporary read-only bridge to legacy feeds and is not guaranteed comprehensive. Check booking details against official providers.
- Verified production deployment or end-to-end browser testing.

## Run
Open `tdh2/index.html` from a static web server; for example `python3 -m http.server 8080` at the repository root and navigate to `http://localhost:8080/tdh2/`.

## Next milestone
Connect a new per-user, per-month planning schema to Supabase, avoiding old `planning-v2` cycles and locks. Test and normalize organiser feeds with stable event IDs before enabling shared interest counts.
