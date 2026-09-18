# Track Day Heros — Living Build Specification

**Purpose:** product and architecture source of truth for Track Day Heros.

**Evidence order:** current GitHub build → recent build history → approved product decisions.

**Statuses:**
- **LIVE** — verified in the current build.
- **AGREED NEXT** — approved direction, not yet fully built.
- **OPEN DESIGN** — direction recognised, detail deliberately undecided.
- **PARKED** — retained for future development, not current scope.
- **SUPERSEDED** — older behaviour/decision replaced by a later one.

This file records product intent as well as implementation state. Significant approved changes should update this specification alongside the build.

---

## 1. Product purpose and guardrail

**LOCKED** — Track Day Heros is a group track-day planning and track-day experience product. It exists to remove the faff of organising a track day in Messenger/group chats and remain useful after the event has been chosen.

Core journey: **Crew → month → availability → real events → interest → group decision → confirm/book → organise Trip → seal Bingo predictions → track-open countdown → personal Track Day start → Track Day → post-track Results game → Points/History → next one.**

The app is not intended to become a generic project-management or social-network product. Features may enrich a track day, but must not lead the product away from organising track days.

---

## 2. Planning

### 2.1 Planning lifecycle

**LIVE / LOCKED** — Planning is deliberately simplified to **Availability → Choices → Decide** before Trip. The current Planning V2 implements these three stages.

**LIVE** — Eight upcoming months are offered. The chosen month is searched with a window extending approximately one week either side.

**LIVE / LOCKED** — Availability uses definite dates only: one tap marks available, tap again removes. There is no Maybe state in Planning V2. **I DON'T MIND** is available for flexible members.

**LIVE / LOCKED** — The member who selected the month can change it until genuine event interest from two different Crew members creates the lock condition.

**LIVE / LOCKED** — Real event choices are used. Current recommendation logic for flexible dates favours variety across circuits/providers, nearer events, lower prices and weekends, while penalising limited availability and placing sold-out events later.

**OPEN DESIGN** — Provider availability markers remain incomplete for some providers. Direct provider booking links are future work.

### 2.2 Choices and Decide

**LOCKED** — Choices use a single positive-interest action. No selection means no expressed interest; it is not a negative vote.

**LOCKED** — Maximum two event votes per person.

**LOCKED** — Decide presents group support but TDH does not choose a winner. Humans discuss and decide.

**LIVE / LOCKED** — A confirmed/live Trip does not block Planning or Event Finder. The current Trip remains anchored while future events can still be browsed.

---

## 3. Trip lifecycle

**LOCKED** — Lifecycle: **Planning → Confirmed Trip → Track Day Mode → Results & Awards → Completed Trip / History → next Planning.**

**LOCKED** — Confirming a Trip is a state change, but Trip confirmation is not the same as an individual booking. Members remain Booked / Not Attending / unresolved until they act.

**LOCKED** — Before anybody has booked, an erroneous confirmation should be recoverable. The first **BOOKED** action hard-locks the confirmed Trip. Future recovery logic must still exist for genuine mistakes/cancellations.

**LOCKED** — Not Attending members can remain involved remotely in appropriate Trip features such as Bingo and live results/logs.

**LOCKED** — Trip closure is not automatic at circuit close. The Trip remains active through its post-event processes.

Where Crew Legend is enabled, **TROPHY PRESENTED** is the natural closure prompt. TDH asks whether to close the Trip and add it to History; **Not Yet** leaves it open for remaining laps/photos/logs. Groups not using Crew Legend receive an equivalent closure opportunity without being forced through Crew Legend.

No overarching Group administrator is required to archive the Trip. Closure must have strong accidental-action safeguards and sensible recovery/reopen logic.

---

## 4. Private Groups

**LOCKED** — Private Groups are persistent groups of people who know each other and organise track days collaboratively.

There is no overarching owner/admin hierarchy for ordinary Private Group use. Useful functions should be available to all members where sensible. Product logic, confirmations, locking and recovery should protect against accidental mistakes instead of introducing unnecessary authority.

**LOCKED** — Any Group member can invite another person. Group invite links grant persistent Private Group membership and can be revoked/regenerated if compromised.

**LOCKED** — Passenger invitations are different: they attach someone to a specific Trip and do not automatically join them to the Private Group.

**LOCKED** — Legitimate members leave a Private Group themselves. There is no generic member kick/remove power. Duplicate identities, accidental invitations and technical mistakes should use specific recovery logic.

**LOCKED** — Leaving a Private Group affects current membership and future planning only. It never rewrites completed History and does not automatically remove somebody from an already-existing Trip.

**LOCKED** — Meaningful shared actions retain who performed them and when where useful. This is quiet accountability, not a noisy social activity feed.

**LOCKED** — Shared Trip data can be collaboratively editable where appropriate. Personal/competitive factual data belongs to the person concerned. Another member should not casually change someone else's booking state, laps, award exclusions, Bingo prediction or attendance decision. Collaborative records such as Broken Car Log can be added by others.

---

## 5. People, roles, cars and driving

### 5.1 Identity model

**LOCKED ARCHITECTURE** — Keep separate concepts for:

Person/account; Private Group membership; Trip membership; Trip attendance role; persistent Hero/driver history/status; Car; Driving Activity/Session; and future Track Hub membership.

Never model a permanent `isPassenger` account type.

### 5.2 Trip roles

**LOCKED / SUPERSEDES earlier role expansion** — Keep Trip attendance roles fundamentally **Driver or Passenger**. Do not create labels such as Organiser, Photographer, Mechanic or Tow Driver merely because somebody performs those activities.

The Group already has visibility of the shared goal and who has contributed. A future Lead Organiser capability may be considered if real use proves a permissions/coordination need, but it is not part of the current role system.

**LOCKED** — Driving is an activity, not a forced role transition. A Passenger can drive a Driver's car while remaining a Passenger in the context of that Trip. A Driver can ride as a passenger. One car can have multiple drivers during the day.

### 5.3 Persistent Hero status

**OPEN DESIGN / ARCHITECTURE REQUIRED** — A Passenger who actually drives may eventually earn persistent Hero/driver status. That status is separate from their role on a particular Trip. Exact trigger and presentation remain open, but the data architecture must support it.

### 5.4 Cars

**LOCKED** — Car ownership and actual driver are separate. Driving records must express **Person who drove → Car driven → Event → Session/activity**.

A Driver or Passenger driving another Crew member's car must be recorded cleanly without abusing a global **Change Car** function.

---

## 6. Passenger experience

**LIVE / LOCKED DIRECTION** — Passenger experience is deliberately smaller than the Driver/Crew experience: **Home / Bingo / Laps**. Passengers do not need Group Planning, Decide, Stay/admin surfaces or the full Driver UI.

**LIVE** — Passenger Home uses the Trip visual language, including confirmed event/countdown and Who's In.

**LIVE** — Passenger Laps can select booked Crew cars, including the originating Driver's car by default where known, and can manually record/import laps.

**LIVE TECHNICAL DEBT** — Passenger identity/claim is server-backed, but Passenger laps are currently browser `localStorage` and Passenger Bingo is currently a placeholder. This is explicitly temporary and conflicts with the persistence/history architecture below.

**AGREED NEXT** — Passenger Bingo should be the same private Trip game with the Passenger's own prediction/card.

**AGREED NEXT** — Passenger driving records must move to shared/server persistence before they are relied on as permanent history.

**LOCKED** — Passenger invite claim must attach to the existing Trip participant identity, never create a duplicate.

**LOCKED** — Account creation should not be forced before someone receives value. Invite → immediate Passenger experience → optional permanent account/identity claim later. When claimed, existing Trip activity/history follows the person.

**AGREED DESIGN** — A one-time Passenger welcome can identify the inviter and explain Home/Bingo/Laps without adding onboarding friction.

---

## 7. Laps, sessions and future logger

**LIVE** — Manual lap input and LapTrophy CSV import exist. Manual input accepts forgiving formats and normalises them. LapTrophy import groups sessions and retains the fastest lap from each imported session; imports are additive and individual records can be removed.

**LOCKED ARCHITECTURE** — Lap/session records are fundamentally **Person → actual Car driven → Event/Trip → Session → lap/time**.

**LOCKED** — Driver chooses the actual car driven. Borrowed-car sessions do not require changing the person's primary car.

**LOCKED** — Historical data should support three views of the same underlying records:
- **Trip History:** what happened at this event?
- **My History:** what has this person done across events/cars?
- **Car History:** what has this car done across events/drivers?

Do not duplicate the underlying activity to create those views.

**LOCKED** — Car History is part of the architecture from the outset because future development is expected to make it valuable. Current data can progressively support events, drivers, sessions/laps and Broken Car entries; future vehicle/logger work may add setup, modifications, maintenance, faults/repairs, tyres, pressures and telemetry.

**PARKED / FUTURE** — A native TDH Track Day/vehicle logger may eventually supersede CSV import and provide automatic sessions, timing/audio, GPS/speed/vehicle data and direct History integration. Current architecture must accept future logger data without being designed around a specific implementation today.

**LOCKED PRIVACY PRINCIPLE** — Any future public/Event Hub lap visibility must be opt-in. Private performance data is not automatically public.

**IMPORTANT** — Track Hub itself is not being designed as a lap-timing platform. Venue/organiser rules around timing must be considered separately in future logger design.

---

## 8. Track Day Mode

**LOCKED DIRECTION** — TDH should visually/functionally **shift gears** as the event approaches and the Crew sets off. Track Day Mode should be the easiest and quickest part of the app: minimum phone time, maximum track time.

Core areas currently envisaged: Journey; Bingo reveal/use; Track Day Times/results record; Broken Car Log; and, in the future, Help Me.

Features should become prominent according to the event timeline rather than presenting every possible control at once. Organisation data remains available but becomes secondary.

### 8.1 Journey

**LOCKED** — Track Day Mode begins with a simple Journey phase: destination, useful journey information and one-tap navigation/Waze. Do not build live Crew location tracking; the current Crew uses radios and does not need the app feeding everyone's whereabouts back into TDH.

**PARKED FUN FUTURE** — Optional Private Group push-to-talk/Crew Radio may be explored separately if mobile/background-audio constraints make it practical.

---

## 9. Broken Car Bingo

### 9.1 Locked game lifecycle — 18 September 2026

**LOCKED / SUPERSEDES the previous night-before Reveal and 15-minute Maybe architecture** — Each participating Hero or Passenger gets one secret prediction: **Car + Category + free-text Details**. Predictions can be changed until **19:00 the night before**, then lock permanently.

**LOCKED** — There is **no night-before prediction reveal**. Predictions remain sealed throughout the evening and the entire track day. Prediction ownership remains secret even when predictions themselves are shown during the post-track Results game. The owner is revealed only after the overall Bingo winner has been resolved.

**LOCKED** — After the 19:00 prediction lock, Bingo stops competing for attention. The main pre-event experience becomes a simple countdown to the advertised track opening time, with practical Trip information available as secondary/backward reference. The intent is to let the Crew eat, have a pint, discuss driving and put the app away.

**LOCKED** — Track Day Mode starts individually. When the track-opening countdown reaches zero it becomes **IT'S TRACK DAY / START TRACK DAY**; it never auto-starts. One person's Start does not affect anyone else. During Track Day Mode Bingo remains hidden and the primary event-day areas are **LAPS | BROKEN CAR LOG**.

**LOCKED / COMBE** — For Castle Combe, assume track close at 17:00. Broken Car Log remains editable for a one-hour paddock window and permanently locks at **18:00**. Laps do not lock and remain editable as the permanent driving record. From 18:00 to 20:00 the main lifecycle is a Bingo Results countdown. At 20:00 the Results game can begin.

### 9.2 Results participation

**LOCKED** — Bingo Results eligibility is based on having submitted a valid prediction before the 19:00 lock, **not track-day attendance**. A Hero or Passenger with a locked prediction remains a Bingo contestant and may join the Results game remotely even if they did not attend the circuit. Their prediction remains eligible to win whether or not they personally join the Results judging. A Crew member/Passenger with **no locked prediction** is a spectator: they may view the Results experience and eventual winner reveal, but they cannot press WE'RE READY, judge candidates or cast a vote. In short: **Prediction submitted = contestant; WE'RE READY = active Results voter; track-day attendance is separate.**

**LOCKED** — Bingo's car pool preserves **cars committed to the Trip**, not merely the final attending-car list. If a Crew member later marks **Can No Longer Attend / Not Attending**, the car they had booked remains in Bingo because the reason for non-attendance may itself be a car failure and is therefore legitimate Bingo territory. Likewise, if a member originally books one car and later changes the car they intend to bring, **both the originally booked car and the replacement car remain available in Bingo**. Changing attendance or replacing a booked car must not silently erase a car that Crew predictions could reasonably have been made against. This requires historical Trip car commitments rather than deriving Bingo subjects only from the current `confirmed_event_bookings.car_snapshot` value. Exact UI wording for original/replacement/non-attending cars can be polished later; the preserved car identities are the important rule.

**LOCKED** — Only **one car per person is the actual event-day car**. Preserving earlier/replaced cars in Bingo does not mean multiple cars attended. Track Day/History should retain the final actual car separately from the wider Bingo car pool.

**LOCKED** — The Broken Car Log must be able to record a defect against **any preserved Bingo car**, not only the final attending-car list. This includes (a) the booked car of someone who later becomes Not Attending and (b) an originally booked car that was replaced by a different event-day car. A pre-event failure that causes either the non-attendance or the car change is valid Bingo evidence. The log therefore needs to target a stable Trip/Bingo car identity rather than only the current member booking. The replacement/current car remains separately identifiable as the one actually brought to the event.

**LOCKED — booked car commitment and CHANGE CAR lifecycle.** Before a member presses **BOOKED**, they may freely choose/change their car and those pre-booking selections do not create Bingo history. At the instant they press **BOOKED**, the car selected at that moment becomes their **first Trip car commitment** and enters the preserved Bingo car pool. After BOOKED, changing the car for that Trip must be done through an explicit **CHANGE CAR** action. Each CHANGE CAR preserves the previous committed car in Bingo, creates a new Trip car commitment for the replacement, and makes the newest commitment the member's single current/actual event car. There may therefore be multiple historical Bingo cars for one person, but only one current event car. CHANGE CAR remains available until the authoritative event opening/start time, including for people arriving on the day who discover they have brought a different car. At that cutoff CHANGE CAR locks. A car change does **not** imply a defect or ask for a reason; if the superseded car actually failed, that is separately recorded through Broken Car Log. The same authoritative event opening/start time used by the Track Opens lifecycle should govern this cutoff. Data should preserve person, car, commitment time/order, replacement/supersession and which commitment is current rather than overwriting a single booking car snapshot.

**LOCKED** — **WE'RE READY** makes a person an active participant in the Results game. At least 50% of eligible participants (rounded up) must be Ready before the game starts. Other eligible Crew/Passengers may join while the game is in progress; pressing Ready makes them active and they must complete the game/final vote.

**LOCKED** — The overall winner is not resolved until **every currently active Results player has submitted the final vote**. People who never press Ready do not block resolution. Ready is irreversible for that Results game. Once the final active player's vote resolves the ballot, entry closes so a late join cannot race the result.

**LOCKED** — If the final ballot is tied, the tied anonymous predictions enter a human decider ballot. Prediction ownership remains hidden. The active Results players vote again until one event winner is resolved. The winner is revealed immediately after resolution; there is no arbitrary 15-minute or 24-hour delay.

### 9.3 Matching hierarchy

**LOCKED** — Bingo answers one question: **Who made the single closest prediction of what happened at this event?** The app organises evidence; humans decide closeness.

For every car that actually logged a failure and was predicted by at least one player, show **all anonymous predictions against that car** alongside its actual Broken Car Log entries. Category matches are visibly useful evidence but do not hide or eliminate the other predictions. The Crew selects the closest prediction for that car. Even where there is only one obvious Car/Category match, the human confirmation still happens.

Where several broken cars were correctly predicted, repeat that process independently so each correctly predicted casualty can produce a Crew-selected finalist. Those finalists later face one another for the overall closest prediction.

**LOCKED FALLBACK** — If **zero predictions match any car that actually broke**, drop to Category across the event. Predictions whose Category occurred in the locked Broken Car Log become the human-reviewed candidate field, regardless of predicted car.

**LOCKED INTELLIGENT FALLBACK** — If there are **zero Car matches and zero Category matches**, the app may analyse all free-text prediction Details against all logged failure descriptions and put its closest suggestions towards the top with a **brief reason** for each suggestion. This analysis is advisory only. All predictions and all defects remain inspectable. A **MAYBE** selection mechanism can be used here to create the final voting list. This is the proper home for Maybe; it is not a mandatory round in ordinary successful Bingo matching.

**LOCKED** — No numeric closeness score, percentage or automatic Bingo winner. Details are deliberately human-judged. Car/Category objective information helps organise the game, while the Crew chooses the closest.

### 9.4 Final vote, anonymity and reveal

**LOCKED** — Per-car/category/fallback selections feed one anonymous final ballot: **WHO GOT ABSOLUTELY CLOSEST?** Every active Results player must vote before resolution. A draw goes to an anonymous decider among the tied predictions.

**LOCKED** — Prediction ownership must not leak through names, avatars, Points receipts, evidence correlation or any other UI during Results judging/final voting. After the winning prediction is resolved, reveal the winning prediction and then reveal **who made it**. Only after the entire game is resolved may ownership reconnect to the completed Results/Points experience.

### 9.5 Points is a separate game

**LOCKED** — Bingo has one event winner and does not accumulate correctness tallies. The persistent Points game is separate: **+1** if the predicted car has any logged issue and **+1** if the predicted Category occurs anywhere in the locked log, maximum 2 per prediction/event. Free-text Details do not score Points.

**LOCKED MONETISATION DIRECTION** — Future free TDH gets the complete Bingo game. A future paid version can add the persistent Points game/championship in addition to Bingo. Pricing/subscription mechanics remain OPEN DESIGN.

### 9.6 Implementation status

**LIVE** — Server-backed Car + Category + Details prediction entry exists for Crew and claimed Passengers. The 19:00 lock remains. As of 18 September 2026, the Bingo API no longer exposes other players' predictions at the old 20:00 night-before point, and Crew/Passenger UI no longer intentionally reveals them before post-track Results.

**AGREED NEXT** — Replace the legacy post-track 15-minute Maybe/readiness/vote implementation with the locked hierarchy above. Retain useful Results countdown, evidence, Points and safe Build Test foundations while removing obsolete timing/ballot assumptions.

### 9.7 Free vs paid

**SUPERSEDED** — Earlier notes that positioned enhanced Bingo itself as the likely paid boundary are superseded. The complete Bingo game is intended to remain free; persistent Points is the current paid-value candidate.


---

## 10. Broken Car Log

**AGREED NEXT / COMBE PRIORITY** — Build for Castle Combe.

Human definition: anything that brings a Crew car off track earlier than intended, or prevents/delays it going back out, can count. The Crew decides what is worthy; the app does not police mechanical severity.

Combe entry should be deliberately lean:
- Crew car selected from attending cars;
- short free-text **what happened?**;
- automatic timestamp;
- automatic **added by** attribution.

It should become immediately obvious/shared to the Trip while submissions are open so duplicate logging is unlikely. Basic identical-entry safeguards are acceptable; complex crowd deduplication is unnecessary.

**LOCKED** — The day-of Log is visible during the submission period while Bingo predictions remain hidden. **One hour after the event finishes**, submissions close permanently. For Combe this is 18:00 after the assumed 17:00 track close. The locked Log becomes the factual evidence used by the 20:00 Results game. Laps remain editable indefinitely.

**PARKED EXTENSIONS** — photos, detailed fault/repair/action, downtime/back-on-track, parts used, Car History/logger links.

Broken Car Log/Bingo is private Crew fun. It is not the same product as public Help Me/Paddock Help.

---

## 11. Awards and Crew Legend

### 11.1 Performance awards

**LOCKED DESIGN** — Submitted award-eligible session data can calculate three objective performance awards:

**Fastest Lap** — driver's single fastest valid recorded lap. Driver award, not car award. Actual car driven remains attached to the record.

**Best Improved** — representative early pace → best sustained pace later, not simplistic first lap/session → final/best. Preferred representative session pace is average of the best **3 representative laps**; **2** are enough for a shortened/anomalous session; **1** alone is insufficient. Anomaly handling should consider the driver's whole dataset/progression and must not invent reasons for slow/fast anomalies.

**Fastest Average** — mean of representative session pace across all award-eligible sessions, using the same best-3/valid-best-2 logic. Every valid session is included by default.

A driver can exclude any session from **all three calculated awards** before results are finalised. Exclusion is not award-specific. Results should transparently show how many sessions counted (for example `5/6 sessions counted`). This relies on Crew honesty rather than anti-cheating machinery.

### 11.2 Crew Legend nominations and voting

**LOCKED** — Crew Legend covers the entire Trip experience, not just driving performance.

Nominations must **not** depend on a night-before Bingo reveal; that reveal no longer exists. Exact Crew Legend nomination unlock timing is **OPEN DESIGN** and should remain separate from the Combe Bingo cleanup.

Nominations remain open until **20:00 two days after the event**. Each Crew member can submit up to **2 nominations**, including two different reasons for the same person.

Nominations are grouped by **person** on the ballot, with all reasons grouped beneath that person.

At nomination close, a **48-hour secret vote** opens automatically and closes at **20:00 four days after the event**. Each Crew member gets one vote for one person and can change it while voting is open. No running totals are visible.

If tied, automatically open a **24-hour secret tie-break** between tied candidates. If tied again, the current/previous Crew Legend receives the deciding vote, secretly. No joint winners.

### 11.3 Physical trophy reveal

**LOCKED** — The app does **not** publicly reveal the winner when voting finishes.

Normally the current Crew Legend privately receives the result and arranges a real-world meet-up/trophy presentation.

Each Crew Legend selects a **Reveal Deputy** from the Private Group. If the current Legend wins again, the result goes privately to the Deputy instead. The Deputy can also act as backup if the current holder cannot organise the reveal.

The person holding the secret result gets **TROPHY PRESENTED**. Until that action is confirmed, the new winner remains secret in TDH. Once presented, TDH can reveal/archive the result, record the new current Crew Legend and prompt the new Legend to select their Reveal Deputy. The Deputy can be changed later.

**LOCKED** — Crew Legend is optional for Groups; it must not be a dependency for using or completing TDH.

---

## 12. History

**LOCKED** — Completed Trip History is a permanent snapshot of the event as it happened, not a dead archive.

Preserve Crew, Passengers, cars brought, who actually drove which cars, sessions/laps, attendance, Bingo data/results, Broken Car Log, performance awards, Crew Legend once presented, and other meaningful Trip information.

Later profile/car changes or Group membership changes must not rewrite historical snapshots.

**LOCKED** — Passengers are first-class historical participants. Their data should survive and, if they later claim a permanent identity, historical activity should attach to that person rather than create a duplicate.

**LOCKED** — One underlying historical dataset supports **Crew/Trip History**, **My History**, and **Car History**.

**LOCKED** — One person can be connected to the same physical event through multiple Private Groups, but should have one underlying event attendance/activity record. Group-specific Bingo/Crew Legend remain isolated while factual Person/Car activity is not duplicated.

---

## 13. Track Hub

### 13.1 Purpose and discovery

**AGREED FUTURE** — Track Hub is the public/event-wide layer. It is separate from Private Groups.

There is **one canonical Track Hub per circuit per day**. The useful boundary is the people physically sharing that paddock/circuit that day, not which provider/database record brought them there.

A new user should be able to open TDH → **Track Hub** → use nearby-circuit discovery or manual search/dropdown → select the circuit → enter today's Hub. Location assistance is optional, never mandatory.

Established users with a confirmed Trip at that circuit/day automatically connect to the same Hub.

Track Hub entry itself is **free** and requires neither Private Group membership nor a paid plan.

### 13.2 Lightweight identity and lifespan

**LOCKED DIRECTION** — Hub entry should be extremely low friction: display name is enough; car can be optional. No mandatory account creation just to use free community utilities. A lightweight identity can later be claimed/linked to a permanent TDH identity.

**LOCKED** — Live Hubs open/close on the same day. The public community surface is ephemeral and does not become a permanent forum/chatroom. A new circuit day gets a fresh Hub.

Useful future use of Track Status operational data alongside the Track Day Logger is **PARKED/OPEN**. Do not automatically declare Hub activity part of permanent Trip/Car History.

### 13.3 Privacy and self-moderation

**LOCKED** — Track Hub is privacy-first. Joining it does not expose a person's Private Group or wider private data.

Users control their own notification experience down to muting/blocking a particular Hub member. Blocking affects the user's own view/notifications; it does not give them authority to remove another person.

Start with self-moderation and basic reporting rather than designing a heavy administrator system around an abuse problem that has not materialised.

### 13.4 Free network utilities

**LOCKED FREE CORE** — **Help Me / Paddock Help remains free.** Its value depends on maximum participation. It is separate from the paid/enhanced Broken Car Bingo/Log experience.

**LOCKED FREE CORE** — **Basic Track Status remains free.** Anyone in the Hub can see it and, where community reporting is used, contribute/confirm status.

The product principle is: where a network utility becomes more useful as participation grows, keep the basic participation free.

Track Status can use simple attendee-reported states such as Track Open / Track Stopped, with multi-person confirmation to reduce accidental reports. Do not infer the reason for a stoppage unless it is actually known.

### 13.5 Verified Venues

**LOCKED FUTURE ARCHITECTURE** — A future **Verified Venue** can have elevated authority over appropriate venue information, particularly authoritative Track Status, without receiving ownership/control over TDH, Private Groups, users or their private data.

Community reporting continues where a venue does not participate. A verified venue's official status takes precedence when supplied.

**LOCKED** — Track Hub must remain genuinely useful without venue involvement. Venue participation enhances the service; it is not a dependency. This allows TDH to prove usage before approaching circuits with real evidence.

Track Hub/Track Status/Help Me are also legitimate organic acquisition routes: somebody can discover TDH while physically at a circuit, gain immediate free value, and later discover Planning/Private Groups/Passenger use.

---

## 14. Notifications

**LOCKED** — Notifications are selective and event-driven, not a replacement for group chat.

Important state changes can notify: bookings, Broken Car entries, Bingo lock, post-track Results readiness/winner, Crew Legend voting, and future Track Status/Help Me events. Routine chatter should not generate app-level noise.

**FUTURE** — Notification categories should be independently controllable, including high-priority live utilities and person-level mute/block within Track Hub.

---

## 15. Persistence and offline resilience

**LOCKED ARCHITECTURE** — Meaningful Trip data uses a shared/server-side source of truth. Browser/device storage may cache data for speed/resilience but must not be the only permanent copy.

This includes participants, attendance, driving sessions/laps, Bingo predictions, Broken Car entries, awards/nominations/votes and other meaningful Trip records.

**LOCKED ARCHITECTURE** — Core Trip actions should be offline-tolerant where practical: save locally, mark pending if server unavailable, synchronise when connectivity returns. Truly live community features such as Track Status, Help Me and other people's live updates inherently require connectivity and must not pretend otherwise.

Full offline sync is not required for the Combe prototype, but the architecture must not block it.

---

## 16. Commercial principles

**LOCKED** — Overall monetisation remains deliberately **OPEN DESIGN**. Do not prematurely lock subscriptions, one-off purchases, organiser pricing, logger pricing or exact Free/Pro boundaries without usage evidence.

**LOCKED** — Help Me/Paddock Help and basic Track Status/community participation remain free.

**LOCKED MONETISATION CANDIDATE** — Enhanced Bingo/games are a credible paid-value layer. Free Bingo can remain genuinely playable while paid adds richer secrecy, timing, logging, results and additional games.

Free community/Hub access is also a deliberate acquisition/cross-pollination route rather than an accidental side effect.

---

## 17. Product ownership and venue partnerships

**LOCKED PRODUCT INTENT** — External venues/partners should receive scoped permissions/capabilities, not ownership/control of TDH or Private Group/user data.

**FUTURE BUSINESS REQUIREMENT** — As TDH moves toward commercial release, core product assets and administrative accounts should remain under the developer/business's control, with appropriate IP assignment/contracts for outside development/design work. Exact company/legal structure is outside this build specification and should receive appropriate professional advice when required.

Venue involvement with Track Hub is a partnership opportunity, particularly verified authoritative Track Status, but TDH must not depend on venue adoption to function.

---

## 18. Castle Combe prototype boundary — 28 September 2026

**LOCKED** — Castle Combe is the first formal real-world TDH product test, not a deadline to build the entire commercial vision.

### Immediate priorities

**AGREED NEXT / COMBE:**
1. Preserve the now-sealed pre-event Bingo prediction lifecycle and replace the old night-before Reveal with the track-opening countdown.
2. Keep the proven personal Track Day start and **LAPS | BROKEN CAR LOG** event-day surface; integrate defect Category natively rather than through temporary bridges.
3. Preserve the 17:00 Combe track-close assumption, 18:00 Broken Car Log lock and 20:00 Results opening while keeping Laps editable.
4. Replace the obsolete shared 15-minute Maybe/24-hour vote architecture with **Ready active players → Car-first human judging → Category fallback → intelligent Details/Maybe fallback only when needed → anonymous final/decider → immediate owner reveal**.
5. Keep Build Test isolated from live data and give Crew/Passenger event-day/Results paths parity.
6. Move meaningful Laps toward shared/server persistence when practical without destabilising the Combe test.

### Not required for Combe

**PARKED beyond Combe:** full Track Hub; public Help Me; community Track Status; full Awards/Crew Legend automation; deep History UI; future native Track Day/vehicle logger; complete offline-sync architecture; commercial packaging.

After Combe, review what the Crew actually used, ignored, found awkward, wished existed and unexpectedly valued. **Build → use → learn → prioritise.** Real-world behaviour determines the next feature priority without casually discarding the locked architecture/product principles above.

---

## 19. Current-build verification notes — 18 September 2026

**Verified from current repository:**

- `planning-v2.js` implements the 8-month selector, selected month ±7-day availability window, definite-date toggles, I DON'T MIND, three-stage Availability/Choices/Decide UI, month-change lock logic, real event display and diversity/scoring logic.
- `passenger.html` implements the smaller Home/Bingo/Laps shell, Crew-car lap selection, manual lap entry and LapTrophy import. Its Bingo panel is still placeholder and Passenger laps still use `localStorage`.
- `broken-car-bingo.js` implements server-backed Crew Bingo prediction entry and 19:00 lock. The old night-before reveal has been retired from the intended lifecycle; predictions remain sealed for post-track Results.
- `index.html` currently loads the Trip/booking/passenger/stay/trailer/Bingo/Planning/live-sync modules. The old base HTML still contains some legacy copy/controls, while Planning V2 overlays the approved newer planning experience; therefore the existence of legacy markup must not be mistaken for current product intent.
- Crew hero flag experiments are superseded: desired/current direction is countdown without reintroducing a flag unless explicitly requested.

When implementation and this specification disagree, first determine whether the implementation is an unfinished/legacy state or whether a later approved product decision superseded this file. Update both deliberately rather than silently treating either as infallible.

---

## 20. Source-of-truth process

**LOCKED** — GitHub code is the truth about **what currently exists**. This specification is the truth about **approved product decisions, architecture and intended next steps**. Conversation memory is convenience, not the permanent record.

Before substantial future work:
1. Check the current implementation.
2. Check this specification.
3. Identify whether the requested change is LIVE, AGREED NEXT, OPEN, PARKED or supersedes an earlier decision.
4. Build/test the change.
5. Update this specification when a significant approved decision or implementation status changes.

Do not resurrect superseded ideas merely because they remain in old code or old conversation notes.