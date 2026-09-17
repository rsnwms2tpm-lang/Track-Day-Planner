# Track Day Heros — Solo, Friends & Chat

**Status:** AGREED FUTURE / ARCHITECTURE TO PRESERVE

**Approved:** 17 September 2026

This note records an approved extension to the Track Day Heros product model. It should be folded into the main living build specification when that file is next revised and must not be lost in future architecture work.

## Solo use is first-class

A Private Group is **not required** to use Track Day Heros. A Trip can belong to one person.

A solo user should be able to use the same core product journey where relevant: discover/select an event → book/confirm their Trip → organise travel/accommodation → use Track Day Mode → record driving sessions/laps and useful event/car information → preserve personal and Car History → plan the next event.

Group-only features such as group voting, Crew Legend and private Crew games should appear only when they make sense; they must not make a solo Trip feel like an incomplete Group Trip.

Track Hub provides the optional social layer for somebody attending alone. A solo attendee can remain completely independent while still joining the circuit/day Track Hub for appropriate public utilities and community interaction.

## Social relationship ladder

TDH should not force somebody directly from a Track Hub encounter into a Private Group. The intended organic relationship path is:

**Track Hub stranger → Friend → private chat → optional shared Trip / Crew / Private Group**

A user may meet somebody through Track Hub, Paddock Help, another TDH feature or in person, then send an **Add Friend** request. Friendship requires acceptance.

Friends remain distinct from Private Group membership. Two people can stay friends and chat indefinitely without belonging to the same Crew. If they later want to organise track days together, TDH can naturally offer actions such as sharing an event, inviting a friend to a Trip, creating a Crew or inviting them to an existing Private Group.

## Direct chat

**AGREED FUTURE** — Friends can have private direct messaging within TDH.

Chat exists to support real track-day relationships and coordination; it is not intended to turn TDH into a generic messaging/social-media platform. Future useful actions may include sharing an event or Trip invitation into a conversation while keeping Planning/Trip data in the proper TDH structures rather than using chat as the organiser.

Direct messages must remain separate from Private Group, Trip and Track Hub records/permissions.

## Privacy and safety principles

- Friend requests require acceptance.
- Blocking overrides friendship/chat and prevents unwanted direct interaction.
- Friendship does not automatically expose Private Group membership, private Trip data, performance data or wider personal information.
- What friends can see should be deliberately privacy-controlled; future visibility such as upcoming track days should be opt-in/appropriate rather than assumed.
- Track Hub remains the place for temporary circuit/day discovery; Friends preserve selected relationships after that Hub closes.

## Product guardrail

This social layer is intended to reinforce track-day participation, not create a generic social network. Avoid follower counts, engagement-chasing feeds, likes-for-the-sake-of-likes and unrelated public posting unless future evidence establishes a genuine track-day purpose.

The social loop to preserve is:

**Use TDH solo → attend Track Day → enter Track Hub → meet/help someone → Add Friend → chat → arrange another track day → optionally form/join a Crew → invite more participants/passengers → repeat.**

This creates a potential organic network effect while allowing a user to remain completely solo if they prefer.

## Architecture implication

Keep these concepts separate:

**Person/account; Friendship; Direct Conversation; Private Group membership; Trip membership; Trip role; Track Hub membership; Car/Vehicle; Driving Activity/History.**

Friendship must never be implemented as implicit Private Group membership. Track Hub interaction must never be implemented as implicit friendship. A Trip must support a single participant without requiring a dummy/private Group.

## Scope

**PARKED beyond Castle Combe.** None of Friends, direct chat or the complete solo onboarding experience is required for the 28 September 2026 prototype. Current Combe priorities remain unchanged.
