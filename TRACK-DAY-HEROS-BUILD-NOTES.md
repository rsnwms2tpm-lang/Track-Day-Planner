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

## 2.3 Top-level product navigation

**AGREED NEXT / LOCKED PRODUCT RULE — 19 September 2026** — The permanent top-level product areas are **PLAN · TRAVEL · EVENT · RESULTS**. There is no separate global Home area; each stage may have its own Home/default view. **PLAN** covers initial event search through availability, Choices, Decide and booking/confirmation. **TRAVEL** covers confirmed-Trip logistics. **EVENT** is the live event-day experience. **RESULTS** holds post-event results and permanent records/history. These are navigation areas, not mutually exclusive lifecycle locks: a confirmed/current Trip remains protected while Crew can continue using PLAN for future events.

---

## 3. Trip lifecycle

**LOCKED** — Lifecycle: **Planning → Confirmed Trip → Track Day Mode → Results & Awards → Completed Trip / History → next Planning.**

**LOCKED** — Confirming a Trip is a state change, but Trip confirmation is not the same as an individual booking. Members remain Booked / Not Attending / unresolved until they act.

**LOCKED** — Before anybody has booked, an erroneous confirmation should be recoverable. The first **BOOKED** action hard-locks the confirmed Trip. Future recovery logic must still exist for genuine mistakes/cancellations.

**LIVE / LOCKED — 21 September 2026.** Not Attending Crew remain inside the confirmed Trip as followers rather than being ejected from it. They keep Trip Home/countdown, attending Crew and travel summary; can play the same private Bingo; can view Crew laps and live Broken Car Log activity; and retain full post-event Results/history access. They do not receive attendance-specific Stay/travel tasks, cannot add driving laps or Broken Car Log entries, and cannot nominate or be eligible for Trip Legend on a Trip they did not attend. Trip Legend remains viewable. Rebooking restores the normal attending Crew experience.

**LOCKED** — Trip closure is not automatic at circuit close. The Trip remains active through its post-event processes.

**LOCKED — Points scoring refinement (Car component).** The previous capped `+1 car per event` concept is superseded. **Car Points are uncapped and awarded per distinct Broken Car Log defect against the car the player predicted: one qualifying defect entry = +1 Car Point.** Example: if the predicted car has separate Brakes, Electrical and Drivetrain defect entries, that prediction earns 3 Car Points. The Broken Car Log is the scoring source of truth: each entry already records a specific defect event, target car/person, timestamp and author, so TDH does not add a separate human verification/deduplication layer at scoring time. This is deliberately Crew-trust-based. **Category Points remain to be clarified separately; do not retain the old overall max-2-points-per-event assumption.**

**AGREED NEXT / LOCKED PRODUCT RULE — 19 September 2026 — Free Bingo / Paid Points overlap.** Broken Car Bingo is the complete shared **free** Crew game. A future paid layer adds the persistent **Points Championship** without separating paid and free Crew: everybody on the Trip can play the same Bingo together, while paid players additionally accumulate Points/history. Build the underlying game data so Points can be enabled later without rebuilding Bingo or splitting a Crew.

**LOCKED — unified Bingo + Points scoring structure — 19 September 2026.** Each prediction contains one **Car**, one canonical **Category**, and free-text **Details**. The Car and Category are independent Points generators across the qualifying Points window. **Every qualifying Broken Car Log entry matching the predicted Car awards +1 Car Point. Every qualifying entry matching the predicted Category awards +1 Category Point. If one log entry matches both the predicted Car and Category, it awards +2 Points. There is no per-Trip cap on Car Points, Category Points or their combined total.**

**LOCKED — automatic Bingo condition.** During the Event-only Bingo evidence window, a qualifying Broken Car Log entry that matches **both the Car and Category of an active Bingo prediction is BINGO 🏆**. The same entry also awards +2 Points under the Points game. An identical Car + Category match outside the Event window can still award +2 Points but can never trigger Bingo. Free-text Details do not block an automatic Bingo; they remain useful context and can support human judging/resolution where multiple active predictions achieve Bingo or a fallback judging route is needed.

**LOCKED — one shared game, two windows.** **Free Crew get the complete Broken Car Bingo game. Paid Crew get that same shared Bingo game plus the persistent Points Championship.** Paid status must never split a Crew's Bingo session or exclude free players from the social game. Points use the wider Trip defect window; Bingo uses only the Event evidence window.

## 10.1 Broken Car Log categories and Bingo evidence cutoff

**LOCKED — canonical defect categories — 19 September 2026.** Bingo predictions and Broken Car Log use the same eight-category vocabulary:

1. **Engine / Cooling** (canonical value: `engine_cooling`)
2. **Gearbox / Drivetrain** (canonical value: `gearbox_drivetrain`)
3. **Brakes** (canonical value: `brakes`)
4. **Suspension / Steering** (canonical value: `suspension_steering`)
5. **Tyre / Wheel** (canonical value: `tyre_wheel`)
6. **Electrical / Bodywork / Aero** (canonical value: `electrical_bodywork_aero`)
7. **Fuel** (canonical value: `fuel`)
8. **Driver Error 😂** (canonical value: `driver_error`)

These are the product-level canonical categories and should remain synchronized anywhere categories are presented or validated.

**LOCKED / SUPERSEDES the previous 18:00 evidence cutoff — 19 September 2026 — Trip defect window vs Event Bingo window.** The Broken Car Log is a Trip-wide defect record and Points source. It opens when the Trip is **confirmed** and remains open until **36 hours after the scheduled event end**, covering preparation, the journey to the event, the track day, the journey home and faults discovered shortly afterwards. For Castle Combe the track-day window is **09:00–17:00**, so the Log closes at **05:00 Wednesday 30 September 2026**. Defects anywhere in the wider Trip window may count for Points. **Broken Car Bingo winning evidence is narrower: only defects whose occurrence timestamp falls inside the actual Event window can determine the Bingo winner.** The planned 20:00 Results game therefore reads only Event-window defects while the underlying Broken Car Log can continue accepting post-event/return-journey defects until its +36h closure.

---

## 11. Trip Legend

**LIVE FOUNDATION — 20 September 2026.** Trip Legend nomination persistence and authenticated Trip API actions are live. Each Crew member has two per-Trip nomination slots; self-nomination is rejected; nominees must be attending Crew; each nomination requires a reason; saved nominations can be edited/replaced or removed while open. The nomination table is RLS-protected from direct client access and is accessed through the existing Trip credential API. The nomination window follows the locked product rule below and closes at **20:00 two days after the Event** (not the Broken Car Log +36h cutoff). The current UI exposes Trip Legend on **TRAVEL Home** and as a **TRIP LEGEND** tab in active EVENT / Track Day Mode. Winner counting, decided state, physical reveal and permanent public/history presentation remain to build.


**LOCKED — purpose and nominations.** Trip Legend is the human/social award for the whole Trip rather than a lap-time/performance award. Nominations are about Trip Legend-worthy moments, contribution, help, humour and memorable actions across the Trip. Each eligible Crew member has **two nominations total per Trip**. A person **cannot nominate themselves**. Each nomination selects another eligible person and includes a required reason/story. The two nominations may recognise two different people or the same person for two genuinely distinct reasons. Nominations can be added while the nomination window is open and remain open until **20:00 two days after the event**, allowing post-track, accommodation and journey-home moments to be recognised.

**LOCKED — winner calculation and ties.** At nomination close, nominations lock and TDH counts them. **Most nominations wins; there is no second Crew-wide vote and no tie-break.** If two or more people share the highest nomination count, **Trip Legend remains a genuine shared tie** and every joint winner is recognised as Trip Legend for that Trip. Nomination totals/rankings are not exposed before the result reveal. The retained nomination reasons are part of the payoff: when the result is eventually revealed, the Crew can see **why** each winner — including each person in a tie — received their recognition.

**LOCKED — public state and physical reveal.** Once nominations close and TDH has counted them, the public Crew-facing state becomes **TRIP LEGEND HAS BEEN DECIDED 🏆**. It does not reveal whether the result is a sole winner or a tie. The winner(s) remain secret until the physical trophy presentation/reveal. The existing trophy-holder/reveal process must support a shared result rather than forcing one person to win; exact physical-trophy handling when there are joint Trip Legends is an **OPEN DESIGN** detail to settle separately. After presentation/reveal is confirmed, TDH publicly records every winner and their anonymous nomination reasons in Trip/Crew History.

**LOCKED — retained nomination history.** All Trip Legend nominations and their written reasons are retained against the **person who was nominated** as part of their long-term Trip Legend history, including nominations from Trips they did not ultimately win. The identity of the person who made each nomination remains **permanently hidden from other users**; the product should surface the accumulated reasons/recognition without exposing nominators. Backend actor identity may be retained only where technically necessary for enforcing rules such as the two-nomination limit and no self-nomination, but it must not become a user-facing attribution.


### 3.1 Meet & Departure

**AGREED NEXT / LOCKED PRODUCT RULE — 18 September 2026** — A confirmed Trip has shared **Meet location**, **Meet time** and **Departure time**. These are practical Trip information, not Bingo-only settings, and should be visually prominent as departure approaches. Meet time and Departure time are separate because the Crew may gather before setting off. **Bingo does not lock at Meet time:** predictions remain open while the Crew is together and lock exactly at the planned **Departure time**. The app may show prediction-submission status (submitted/waiting) before departure, but never prediction contents. From Departure time onward, qualifying journey incidents can form Bingo evidence. **07:00 event day remains solely the Track Day Mode opening boundary.**

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

**LIVE / LOCKED DIRECTION** — Passenger experience is deliberately smaller than the Driver/Crew experience: **Home / Bingo / Laps / Trip Legend**. Passengers do not need Group Planning, Decide, Stay/admin surfaces or the full Driver UI.

**LIVE** — Passenger Home uses the Trip visual language, including confirmed event/countdown and Who's In.

**LIVE** — Passenger Laps can select booked Crew cars, including the originating Driver's car by default where known, and can manually record/import laps.

**LIVE — 21 September 2026.** Passenger Bingo uses the same private Trip game with the Passenger's own server-backed prediction/card and the canonical eight defect categories.

**LIVE — 21 September 2026.** Passenger Laps uses the shared/server-backed Track Day lap model. A Passenger can select the Crew car actually driven; the originating Driver's car is the default where known. Manual lap entry and LapTrophy CSV import use the same persistent `track_day_laps` records as Crew driving activity. Before Track Day Mode opens, the Passenger Laps tab acts as the entry point and the shared lap surface enforces the event-day start boundary.

**LIVE — 21 September 2026.** Passenger Trip Legend authenticates with the claimed participant token and uses the shared Trip Legend nomination system, including two nominations, no self-nomination, reasons and anonymous attribution.

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

**LOCKED / SUPERSEDES the previous fixed 19:00/night-before Reveal and 15-minute Maybe architecture** — Each participating Hero or Passenger gets one secret prediction: **Car + Category + free-text Details**. The confirmed Trip stores a shared **Meet location**, **Meet time** and **Departure time**. Predictions remain open while the Crew gathers and can be added/changed right up until the planned **Departure time**. At Departure time the active Bingo prediction locks. The pre-departure Trip experience should show who has submitted a prediction without revealing its contents, giving the Crew a natural prompt to make sure everyone has entered before setting off. **Departure is no longer the start of Bingo-winning evidence:** the wider Points/defect window is already open from Trip confirmation, while Bingo-winning evidence begins only when the actual Event starts.

**LOCKED** — There is **no night-before prediction reveal**. Predictions remain sealed throughout the evening and the entire track day. Prediction ownership remains secret even when predictions themselves are shown during the post-track Results game. The owner is revealed only after the overall Bingo winner has been resolved.

**LOCKED** — After the Departure-time prediction lock, Bingo stops competing for attention. The main pre-event experience becomes a simple countdown to the advertised track opening time, with practical Trip information available as secondary/backward reference. The intent is to let the Crew eat, have a pint, discuss driving and put the app away.

**LOCKED** — Track Day Mode starts individually. When the track-opening countdown reaches zero it becomes **IT'S TRACK DAY / START TRACK DAY**; it never auto-starts. One person's Start does not affect anyone else. During Track Day Mode Bingo remains hidden and the primary event-day areas are **LAPS | BROKEN CAR LOG**.

**LOCKED / COMBE — SUPERSEDES the old 18:00 Log lock.** Castle Combe's track-day Event window is **09:00–17:00**. Only defects logged with occurrence timestamps inside that window are eligible to determine the Broken Car Bingo winner. The Broken Car Log itself remains open for the wider Points/Trip record until **36 hours after 17:00**. Laps remain editable as the permanent driving record. The Event screen can continue to show **LAPS | BROKEN CAR LOG** with a countdown to the planned **20:00** Bingo Results game.

### 9.2 Results participation

**LOCKED** — Bingo Results eligibility is based on having submitted a valid prediction before the Trip Departure-time lock, **not track-day attendance**. A Hero or Passenger with a locked prediction remains a Bingo contestant and may join the Results game remotely even if they did not attend the circuit. Their prediction remains eligible to win whether or not they personally join the Results judging. A Crew member/Passenger with **no locked prediction** is a spectator: they may view the Results experience and eventual winner reveal, but they cannot press WE'RE READY, judge candidates or cast a vote. In short: **Prediction submitted = contestant; WE'RE READY = active Results voter; track-day attendance is separate.**

**LOCKED** — Bingo's car pool preserves **cars committed to the Trip**, not merely the final attending-car list. If a Crew member later marks **Can No Longer Attend / Not Attending**, the car they had booked remains in Bingo because the reason for non-attendance may itself be a car failure and is therefore legitimate Bingo territory. Likewise, if a member originally books one car and later changes the car they intend to bring, **both the originally booked car and the replacement car remain available in Bingo**. Changing attendance or replacing a booked car must not silently erase a car that Crew predictions could reasonably have been made against. This requires historical Trip car commitments rather than deriving Bingo subjects only from the current `confirmed_event_bookings.car_snapshot` value. Exact UI wording for original/replacement/non-attending cars can be polished later; the preserved car identities are the important rule.

**LOCKED — changed-car replacement prediction.** If the car targeted by a player's prediction is genuinely replaced before the Event, the original prediction is **preserved for Points/history** rather than overwritten or deleted. The player receives one active replacement pick against a current Event car so they retain a fair shot at Broken Car Bingo. The preserved prediction is Points-only; the replacement is the player's sole active Bingo entry. A changed-car replacement may be made after the normal Departure lock but must be completed **before the Event starts**. This does not create two Bingo entries.

**LOCKED** — Only **one car per person is the actual event-day car**. Preserving earlier/replaced cars in Bingo does not mean multiple cars attended. Track Day/History should retain the final actual car separately from the wider Bingo car pool.

**LOCKED** — The Broken Car Log must be able to record a defect against **any preserved Bingo car**, not only the final attending-car list. This includes (a) the booked car of someone who later becomes Not Attending and (b) an originally booked car that was replaced by a different event-day car. A pre-event failure that causes either the non-attendance or the car change is valid Bingo evidence. The log therefore needs to target a stable Trip/Bingo car identity rather than only the current member booking. The replacement/current car remains separately identifiable as the one actually brought to the event.

**LOCKED — Broken Car Log ownership/trust rule.** Defect entry is deliberately trust-based: no witness, approval or Crew verification step is required when logging a defect. The app records the defect, target car/person, timestamp and the actor who entered it. **Only the person who created a defect entry may delete that entry.** Other Crew members may view it but cannot delete it. This protects the factual/audit trail without adding friction to event-day logging. The normal Broken Car Log lock still applies; once the log reaches its permanent lock time, entries are no longer deletable even by their creator.

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

## 11. Awards and Trip Legend

### 11.1 Performance awards

**LOCKED DESIGN** — Submitted award-eligible session data can calculate three objective performance awards:

**Fastest Lap** — driver's single fastest valid recorded lap. Driver award, not car award. Actual car driven remains attached to the record.

**Best Improved** — representative early pace → best sustained pace later, not simplistic first lap/session → final/best. Preferred representative session pace is average of the best **3 representative laps**; **2** are enough for a shortened/anomalous session; **1** alone is insufficient. Anomaly handling should consider the driver's whole dataset/progression and must not invent reasons for slow/fast anomalies.

**Fastest Average** — mean of representative session pace across all award-eligible sessions, using the same best-3/valid-best-2 logic. Every valid session is included by default.

A driver can exclude any session from **all three calculated awards** before results are finalised. Exclusion is not award-specific. Results should transparently show how many sessions counted (for example `5/6 sessions counted`). This relies on Crew honesty rather than anti-cheating machinery.

### 11.2 Trip Legend nominations and voting

**LOCKED** — Trip Legend covers the entire Trip experience, not just driving performance.

**LOCKED** — Trip Legend nominations unlock at the **same point as Bingo picks**, so they can cover the whole active Trip rather than only the circuit day.

**LOCKED** — Trip Legend is accessible from the **TRAVEL Home** once unlocked and from a dedicated **TRIP LEGEND** tab within EVENT. It is not needed in PLAN. RESULTS is not an entry point for live nominations; after presentation, the completed Trip Legend result can remain in historical Event records.

**LOCKED** — EVENT remains available through the post-track/journey-home period. **Trip Legend nomination closure and final EVENT closure are the same lifecycle point: scheduled Event end +36 hours.** At that cutoff, nominations close and the active Event archives into Previous Track Days.

Each confirmed Trip participant — Driver or Passenger — can submit up to **2 nominations**, including two different reasons for the same person. Drivers and Passengers are equally eligible to be nominated. Self-nomination is not allowed.

Nominations are grouped by **person** on the ballot, with all reasons grouped beneath that person.

At nomination/Event close, a **48-hour secret vote** opens automatically and closes **48 hours after that shared +36-hour cutoff**. Each Crew member gets one vote for one person and can change it while voting is open. No running totals are visible.

If tied, automatically open a **24-hour secret tie-break** between tied candidates. If tied again, the current/previous Trip Legend receives the deciding vote, secretly. No joint winners.

### 11.3 Physical trophy reveal

**LOCKED** — The app does **not** publicly reveal the winner when voting finishes.

Normally the current Trip Legend privately receives the result and arranges a real-world meet-up/trophy presentation.

Each Trip Legend selects a **Reveal Deputy** from the Private Group. If the current Legend wins again, the result goes privately to the Deputy instead. The Deputy can also act as backup if the current holder cannot organise the reveal.

The person holding the secret result gets **TROPHY PRESENTED**. Until that action is confirmed, the new winner remains secret in TDH. Once presented, TDH can reveal/archive the result, record the new current Trip Legend and prompt the new Legend to select their Reveal Deputy. The Deputy can be changed later.

**LOCKED** — Trip Legend is optional for Groups; it must not be a dependency for using or completing TDH.

---

## 12. History

**LOCKED** — Completed Trip History is a permanent snapshot of the event as it happened, not a dead archive.

Preserve Crew, Passengers, cars brought, who actually drove which cars, sessions/laps, attendance, Bingo data/results, Broken Car Log, performance awards, Trip Legend once presented, and other meaningful Trip information.

Later profile/car changes or Group membership changes must not rewrite historical snapshots.

**LOCKED** — Passengers are first-class historical participants. Their data should survive and, if they later claim a permanent identity, historical activity should attach to that person rather than create a duplicate.

**LOCKED** — One underlying historical dataset supports **Crew/Trip History**, **My History**, and **Car History**.

**LOCKED** — One person can be connected to the same physical event through multiple Private Groups, but should have one underlying event attendance/activity record. Group-specific Bingo/Trip Legend remain isolated while factual Person/Car activity is not duplicated.

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

Important state changes can notify: bookings, Broken Car entries, Bingo lock, post-track Results readiness/winner, Trip Legend voting, and future Track Status/Help Me events. Routine chatter should not generate app-level noise.

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

**PARKED beyond Combe:** full Track Hub; public Help Me; community Track Status; full Awards/Trip Legend automation; deep History UI; future native Track Day/vehicle logger; complete offline-sync architecture; commercial packaging.

After Combe, review what the Crew actually used, ignored, found awkward, wished existed and unexpectedly valued. **Build → use → learn → prioritise.** Real-world behaviour determines the next feature priority without casually discarding the locked architecture/product principles above.

---

## 19. Current-build verification notes — 18 September 2026

**Verified from current repository:**

- `planning-v2.js` implements the 8-month selector, selected month ±7-day availability window, definite-date toggles, I DON'T MIND, three-stage Availability/Choices/Decide UI, month-change lock logic, real event display and diversity/scoring logic.
- `passenger.html` implements the smaller Home/Bingo/Laps shell, Crew-car lap selection, manual lap entry and LapTrophy import. Its Bingo panel is still placeholder and Passenger laps still use `localStorage`.
- `broken-car-bingo.js` implements server-backed Crew Bingo prediction entry; its current fixed 19:00 lock is now **SUPERSEDED** by the agreed Trip Departure-time lock and requires implementation. The old night-before reveal has been retired from the intended lifecycle; predictions remain sealed for post-track Results.
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

## Broken Car Bingo — Results judging hierarchy (LOCKED 18 Sep 2026)

The Results game is deliberately human-judged. The Broken Car Log is the factual event record, but TDH does not attempt semantic scoring or AI interpretation of prediction Details. The Crew can discuss what happened in real life, compare it with the anonymous predictions, and vote.

### 1. Car-match route
- If one or more cars with logged defects were predicted, Car is the primary gate.
- For each matched broken car, show **every prediction against that car**, regardless of predicted Category.
- Category does not filter, weight or automatically advance a prediction during Car judging.
- Active Results players independently vote for the prediction they believe came closest.
- A tied top vote immediately re-votes using only the tied anonymous predictions; repeat until separated.
- If only one broken car has predictions against it, that car vote directly determines the Bingo winner.
- If multiple broken cars have predictions against them, each car vote produces one finalist. Those finalists then face an anonymous **WHO GOT ABSOLUTELY CLOSEST? 🏆** vote to determine the single Bingo winner.

### 2. Category fallback
- Category judging happens **only when there are zero Car matches across the event**.
- Compare the Categories actually present in the Broken Car Log with locked predictions.
- Only predictions whose Category matches an actual logged failure Category enter that Category's judging.
- Wrong predicted car does not exclude a prediction once the game has fallen back to Category.
- Human voting and tie re-voting use the same mechanics as Car judging.
- If only one actual Category has matching predictions, its vote directly determines the Bingo winner.
- If multiple actual Categories have matching predictions, each Category produces one finalist and those finalists face **WHO GOT ABSOLUTELY CLOSEST? 🏆**.

### 3. Free-for-all fallback
- If something broke but there are **zero Car matches and zero Category matches**, TDH makes a playful point that the Crew were rubbish at predicting it and opens a **FREE FOR ALL 😂**.
- Show the actual Broken Car Log and **all locked predictions anonymously**.
- No AI Details matching, Maybe shortlist, semantic score or automatic interpretation.
- The Crew discusses what happened and votes for whichever prediction somehow came closest.
- Normal anonymous tie re-vote mechanics apply.

### 4. Spotless-day route
- If the Broken Car Log contains **no defects at all**, there is no closest-to-a-failure contest.
- TDH celebrates that, jokes that every prediction was wrong, and changes the payoff to **MOST RIDICULOUS PREDICTION 😂🏆**.
- Show every locked prediction anonymously and let all active Results players vote for the most ridiculous prediction.
- Normal anonymous tie re-vote mechanics apply.
- This route still produces a reveal/payoff even when every car survives the track day.

### Core principle
**Car → Category → Free For All 😂**, with a separate **Most Ridiculous Prediction 😂🏆** route for a spotless day.

The app supplies the evidence and anonymous voting mechanics; the humans judge reality. This intentionally supersedes the earlier intelligent Details/Maybe fallback and any assumption that every matched car must always produce a finalist for a later round.


---

## Future Previous Event personal contributions (PARKED / LOCKED ARCHITECTURE — 19 Sep 2026)

This is a future Results/history expansion, not current build scope.

- Each completed Event remains a permanent historical Event record. Starting a new Event must not move, convert, reset or delete additions attached to an earlier Event.
- Future Previous Event pages may allow people to add photos, stories/memories, car notes/setup changes, repairs, lessons learned and similar personal material.
- Every contribution belongs to the person who created it **and** is attached to the Event it concerns.
- Visibility is controlled **per contribution**, not by one Event-wide privacy switch. Planned audiences are **Personal / Crew / Public**:
  - **Personal** — visible only to its creator in that historical Event record.
  - **Crew** — visible to people associated with that Event.
  - **Public** — eligible to surface in the wider public Results / future Track Hub experience.
- Objective shared Event data (for example laps, Bingo result, Points and Broken Car Log) remains part of the Event record independently of these personal contributions.
- Different people may therefore see different personal/community material when opening the same historical Event, according to contribution ownership and visibility.
- A later Event becoming current has no effect on previous Event contributions. The Event association and creator ownership persist.
- This ownership/visibility model should be preserved when the future public/community Hub is designed so privacy does not need to be retrofitted later.


---

## Results / Event lifecycle architecture (AGREED NEXT / LOCKED — 19 Sep 2026)

Permanent top-level areas remain **PLAN · TRAVEL · EVENT · RESULTS**.

- **RESULTS** is the permanent records area with three primary destinations: **Bingo 🏆 · Points 🏁 · Previous Track Days**.
- The 20:00 pub Bingo reveal lives under Results. It does **not** close the active Event lifecycle or close the Broken Car Log.
- **EVENT** remains the live **LAPS | BROKEN CAR LOG** working page until the defect-log closure at scheduled Event end +36 hours, including the journey home / shortly-after-home defect window.
- At defect-log closure, the Trip/Event can archive into Results. EVENT then returns to its default role of summarising the most recent Event rather than remaining a stale live Track Day surface.
- Laps remain editable after archival, but later additions/edits should happen through the relevant **Results → Previous Track Day** record.
- **TRAVEL** should ultimately default to a **Stay** accommodation-finding role when there is no active Trip, with the existing richer Trip navigation/logistics appearing when relevant. Airbnb linking/import remains part of that direction.
- PLAN remains independently usable throughout all of these stages.

### Bingo + Points implementation rule
- Event-window **Car + Category** exact matches are checked first at the pub reveal. The app must not announce them during the Event.
- Exactly one active exact-match prediction resolves Bingo at reveal.
- Multiple active exact-match predictions go to anonymous Crew judging using **Description/Details** to decide who came closest; nobody can assume they have won before seeing the competing predictions.
- If there is no exact Car + Category match, use the locked fallback Results hierarchy.
- Points use the wider qualifying Trip defect record: each matching Car log = +1 and each matching Category log = +1, so one log can award +2 and totals are uncapped.

### EVENT pre-event waiting state (LIVE — 20 Sep 2026)
- Menu → EVENT now has a dedicated pre-event state instead of falling through to Travel when Track Day Mode is not yet open.
- This is a new front door around the existing tested Track Day page; the Build Test / tested **LAPS | BROKEN CAR LOG** implementation is deliberately left intact.
- Before Track Day Mode opens, EVENT shows the confirmed next Event, Event date/countdown and the live **Broken Car Log**.
- Broken Car Log is usable in this waiting state because its locked lifecycle begins at Trip confirmation. These pre-Event defects belong to the Trip record / Points but are not Bingo-winning evidence.
- At Track Day Mode readiness on Event day, EVENT hands over to the existing tested Track Day page; Start Track Day remains individual.
- Travel/accommodation/navigation are not duplicated into the pre-event Event page.

### Cadwell Post Event Build Test (LIVE TEST HARNESS — 20 Sep 2026)
- Post Event testing is based around the real Cadwell Park track day of 13 Aug 2026 rather than invented generic Event data.
- Build Test now exposes **Post Event · Cadwell** as a safe historical-record test surface independent of the live Castle Combe lifecycle.
- Initial historical tabs: Event, Laps, Log, Results. Real Crew/lap/defect/Bingo/Trophy data will replace placeholders progressively as supplied.
- Purpose: design and validate the Previous Track Day record and the three Trophy Award analyses using genuine historical data before Castle Combe archives.
- This test surface must not mutate the live Castle Combe Trip/Event.

- Cadwell attendance corrected: Dave (Clio 172), Tommy (Skoda Fabia), Frank (Honda Civic Type R FN2), Dex/Dexter (Clio RS 200), plus Frank's passenger Josh who also drove Frank's car. Joe did not attend.
- Cadwell Laps test now carries all five actual drivers/attendees into the Laps area and exposes a per-person historical lap-load entry point. This preserves Person → actual Car driven → Event/Session ownership, including passenger Josh driving Frank's car.

- Dave's real LapTrophy Cadwell export loaded into the Cadwell historical test dataset: 33 timed laps across 6 sessions. Session bests: 2:02.70, 1:56.63, 1:53.10, 1:52.33, 1:54.27, 1:55.24. Overall fastest 1:52.33 (Session 4 lap 4); highest recorded max speed 107.8 mph. Source export date 13 Aug 2026. Historical UI currently stores the session summaries in the isolated Cadwell test harness; production historical persistence remains to be designed rather than writing fake/live Castle Combe ownership IDs into track_day_laps.

- Cadwell historical Laps UX refined: once a driver's data exists, the summary/fastest-lap card is the primary collapsed state at the top. **Edit** expands the underlying session list; expanded state exposes **Delete Session** and **Load More Lap Data**, then **Done** collapses it again. Drivers without data retain **Load Lap Times**. This interaction is being proven in the isolated Cadwell harness before production persistence.

- Cadwell raw LapTrophy Share/GPS import proof added: the historical Laps loader now accepts the free/share semicolon GPS CSV format, detects repeated circuit passes, reconstructs lap durations from timestamped GPS samples, derives max speed, and labels these records **GPS calculated** rather than implying LapTrophy's exact processed timing. Tommy's supplied Cadwell data is seeded in the test record as one 4-lap GPS-calculated session (approximately 2:03 / 1:55 / 1:57 / 2:10, best ~1:55, max 105.0 mph), consistent with the LapTrophy screen evidence. Exact LapTrophy Export timing remains a distinct/higher-precision source; precedence/merge logic between multiple sources is deliberately left for later design when more real data is available.


### Laps / Trophy accessibility split (LOCKED — 20 Sep 2026)
- **FREE must remain complete and useful without a paid LapTrophy subscription.** A driver may supply readable LapTrophy screenshots; TDH can record the visible session/lap/sector timing and run the basic Results/Trophy analysis from those verified values.
- Basic/free analysis may use lap count, exact visible lap times, visible sectors, session bests, session progression, consistency/spread, max speed and other statistics directly supported by the supplied screenshots.
- **ENRICHED DATA** from LapTrophy Export and/or raw Share GPS can add deeper telemetry-derived analysis. This is an enhancement, not a prerequisite for participation, historical records or basic Trophy analysis.
- Source/provenance stays explicit (for example `LapTrophy screenshot`, `LapTrophy export`, `GPS calculated`, or combined evidence). Do not silently replace exact displayed timing with lower-precision GPS reconstruction.
- When multiple sources describe the same session, exact LapTrophy-displayed/exported timing should be retained for timing fields while raw GPS may enrich telemetry fields. Full automatic merge/precedence logic remains to be validated with more real files.
- Cadwell harness now carries Tommy's three screenshot-verified sessions: 13:36 (5 laps, best 1:57.33), 14:43 (4 laps, best 1:54.58, raw GPS also available), 15:47 (3 laps, best 1:54.68): **12 laps / 3 sessions / 1:54.58 overall fastest**. Results now exposes a basic timing-analysis proof from real Dave/Tommy data.


### Cadwell Trophy calculation correction (LIVE TEST HARNESS — 20 Sep 2026)
- Dave's Cadwell record now uses the **full 33-lap / 6-session LapTrophy CSV data** in the harness, including individual lap times, sectors and per-lap max speed, rather than session summaries only.
- Cadwell Results no longer uses the incorrect first-session → last-session comparison.
- The test now applies the locked performance-award model to both CSV and screenshot timing: **Fastest Lap**, **Best Improved** using representative session pace (average of best 3 laps; best 2 where only 2 are available; 1 is ineligible), and **Fastest Average** as the mean representative pace across eligible sessions.
- Source route does not change the Trophy formula. Tommy's screenshot-derived laps and Dave's full CSV-derived laps are evaluated by the same award logic. CSV remains the preferred richer source when later available.
- This is still a test-harness implementation. Anomaly/exclusion controls and final production persistence remain to be completed before treating automated award output as final.

- LIVE — Stay location model separates the accommodation's listed address from an editable **Destination postcode**. The destination postcode is the navigation/route-calculation target and may intentionally differ from the booking address (for example a host-provided parking/arrival point). Editing it prompts the user that Waze/travel calculations will change while the listed address remains untouched.

- LIVE — Passenger Home uses a passive **Trip setup in progress 🏁** state while Crew setup is incomplete; Passengers are not asked to resolve Stay/admin blockers. Bingo remains dependent on Trip readiness, while Laps and Trip Legend remain part of the Passenger experience.


### Non-attending Crew / Following a Trip (LIVE — 21 Sep 2026)
- A permanent Crew member marked **Not Attending** remains part of the confirmed Trip. Attendance changes permissions, not Crew membership or access to Trip history.
- Home becomes **Following this Trip** with countdown, attending Crew/cars, read-only meet/departure summary and live Trip activity. Attendance-specific travel/stay/driving jobs are removed; the member can switch back to attending.
- Broken Car Bingo remains fully playable under the normal secrecy, lock and scoring rules.
- Laps are view-only; non-attending Crew cannot add/import/delete driving laps.
- Broken Car Log is view-only; logged problems can be followed but not added/deleted by the non-attendee.
- Trip Legend is visible, but non-attending Crew cannot nominate and are not eligible nominees for that event.
- Results/history remain available in full.
- Server enforcement in trip-track-day mirrors these permissions for lap, log, Track Day start and Trip Legend write actions.


## 15. Deployment and cleanup checkpoint — 22 September 2026

**LIVE / LOCKED DEPLOYMENT SOURCE** — The active Track Day Heros frontend is deployed from GitHub `main` to Cloudflare at `track-day-planner.cf4y942fjm.workers.dev`. Cloudflare is the current test/live deployment path for this build. The old Netlify site is a stale legacy deployment (last production publish 10 September 2026) and must not be used to validate current frontend behaviour.

**LIVE / CLEANUP RULE** — GitHub code remains the implementation source of truth and this specification remains the product/architecture source of truth. Legacy Netlify files and unreferenced historical frontend files may remain temporarily for recovery/history, but they are not active architecture merely because they exist in the repository. Cleanup must be incremental and must not disturb the verified Castle Combe Stay data/flow.

**KNOWN TECHNICAL DEBT — STAY / AIRBNB IMPORT** — The current Trip shell can be destroyed and rebuilt by `booking-controller.js`, while the Airbnb screenshot file input lives inside that shell. Existing `__tdhStayEditing` protection covers the accommodation editor but not the period while the iOS screenshot picker owns the screen. Live-sync/render activity can therefore invalidate the picker DOM interaction. The approved cleanup direction is to isolate screenshot selection/import from the replaceable Trip shell rather than add further render guards. Until that replacement is built and verified, the known-good manual Stay editor and Castle Combe booking flow are to remain untouched.


## 16. Frontend / Netlify cleanup handover — 22 September 2026

**CURRENT TASK / IN PROGRESS.** Dave approved a non-destructive frontend and legacy Netlify cleanup after confirming the current Cloudflare Crew invite works. The current Crew entry link is `https://track-day-planner.cf4y942fjm.workers.dev/?invite=BB1F0D07`; Dave tested it successfully and it reconnected him to the existing Track Day Heros group. Do not use the bare Cloudflare URL as proof of group routing because a browser without a saved session needs the Crew invite parameter.

**COMPLETED CLEANUP CHECKPOINT.** Commit `6e833cd094a910c07f6b97ebeeec03a48f0ae140` recorded Cloudflare as the active deployment and the Stay/Airbnb technical-debt finding. Commit `ff9c7247fe4d7ce7a4902c546f18c7fb14c26271` changed only cache/version labels in `index.html`: `trip-nav-v2.js`, `airbnb-import.js`, `guided-trip-flow.js`, `live-sync.js` and `global-navigation.js` now use a clean `20260922-baseline` label instead of rollback labels. No functional Stay code was changed.

**AUDIT FINDING — UNREFERENCED FRONTEND FILES.** The following root JS files were found not loaded by current `index.html` and not referenced by `passenger.html`: `avatar-safari-fix.js`, `bingo-locked-teaser.js`, `bingo-not-attending.js`, `booked-layout.js`, `clean-ui.js`, `confirmed-event-fallback.js`, `confirmed-trip-hydrate.js`, `confirmed-trip-lock.js`, `crew-picks-clarity.js`, `decide-v2.js`, `decide-v3.js`, `dom-hotfix.js`, `flow-v2.js`, `multi-vote.js`, `passenger-bed-prompt.js`, `planning-tabs.js`, `session-recovery.js`, `stay-collapse.js`, `ui-v4.js`, `vote-clarity.js`, `vote-v3.js`. A deletion batch was started, but the tool call was interrupted / did not return before chat handover. **Do not assume any of these deletions succeeded.** In the next chat, inspect current GitHub main/tree first and verify exactly which files still exist before doing any further deletion.

**PASSENGER EXCEPTION.** `passenger-welcome.js` and `passenger-bingo.js` are not loaded by main `index.html` but ARE loaded by `passenger.html`; they are active and must not be deleted. `laps-shared.js` and `crew-legend.js` are also shared with Passenger.

**LEGACY NETLIFY MATERIAL IDENTIFIED, NOT YET REMOVED.** Repository still had `netlify.toml`, `netlify/functions/api.mts`, `netlify/functions/vote.mts`, `netlify/database/migrations/001_create-core/migration.sql`, `netlify/database/migrations/002_multi_votes/migration.sql`. `package.json` contained only Netlify dependencies: `@netlify/database` and `@netlify/functions`. Current Cloudflare config is `wrangler.jsonc` with Worker name `track-day-planner` and static assets directory `.`. Before removing Netlify files/dependencies, verify Cloudflare build/deploy does not rely on package installation side effects; then remove in a controlled batch and immediately test current Cloudflare Crew invite, Trip, Stay, Bingo and Passenger route.

**PROTECTED BASELINE.** Do not alter Castle Combe accommodation data or working Stay/manual-edit/Waze/Bingo-unlock flow during general cleanup. The current Airbnb screenshot importer still has genuine technical debt: its file input is inside the replaceable `.trip-mode-shell`, while `booking-controller.js` can destroy/rebuild that shell. `__tdhStayEditing` protects the editor but not the iOS picker period. Fix this later by isolating screenshot selection/import outside the replaceable Trip shell; do not revive old render-guard experiments.

**NEXT CHAT START PROCEDURE.** 1) Fetch current GitHub main SHA and this build spec. 2) Inspect current tree to see whether the interrupted legacy-file deletion batch changed anything. 3) Compare all remaining root JS against actual script references in `index.html`, `passenger.html` and any standalone test pages before deleting. 4) Continue only low-risk dead-file cleanup first. 5) Then inspect/remove legacy Netlify files and Netlify-only package dependencies in one controlled batch. 6) Let Cloudflare auto-deploy and have Dave test the Crew invite/current group before proceeding to Stay/Airbnb architectural work.


### POLISH BACKLOG — Global loading / transition screen (22 September 2026)
- Add a proper branded **Track Day Heros 🏁 loading/transition screen** for moments when the app is fetching live state or rebuilding a role/lifecycle surface.
- This is **global polish**, not a Ross-specific workaround. Use the same transition treatment wherever a noticeable blank/black state can occur, including initial launch/rejoin, navigation into EVENT, role-specific Crew/non-attending/passenger views, and other slower live-data transitions.
- Keep it lightweight: Track Day Heros branding, subtle loading animation, and context-aware copy where useful (for example **Loading Event…**).
- Do **not** disturb currently working navigation/state logic merely to remove a brief black transition. Implement this as a presentation layer once the underlying cleanup and lifecycle/role routing are stable.
- Current test note: Ross (non-attending Crew) reaches the correct read-only EVENT experience; a brief black screen occurs before that surface appears and is acceptable until this polish pass.


### EVENT countdown completion — pre-track essentials + helmet avatar discovery (AGREED NEXT / OPEN DESIGN — 22 September 2026)
- When the confirmed Track Day Event countdown reaches zero / the Event-day transition occurs, attending Crew receive a short **pre-track essentials prompt card** before entering the live Event experience.
- The exact checklist is deliberately **OPEN DESIGN** and must be agreed before deployment. Candidate essentials include wheel-nut torque, tyre pressures, fuel and other practical track-day checks.
- Include a playful **“Got your helmet?”** prompt. From that prompt, a member who has not discovered/selected the avatar system can open the existing **Helmet avatar picker** directly and choose one of the available helmet avatars.
- **Use my initial instead** remains a valid avatar choice; this feature should invite discovery, not force an avatar.
- Reuse the existing avatar IDs/persistence and Helmet picker rather than creating a separate event-only avatar system.
- The card should feel like useful Event-day preparation with a small personality/reward moment, not onboarding friction. Exact copy, checklist contents, dismissal/completion behaviour and whether it is one-time per Event remain to be settled before build.


### POLISH BACKLOG — Sound effects / audio system (22 September 2026)
- Sound effects are a viable future enhancement for the Track Day Heros web app/PWA. Keep them **short, purposeful and optional** rather than adding constant UI noise.
- Build a small central TDH audio system so features call named effects (for example `play('pb')`, `play('bingo-win')`) instead of each feature managing audio independently. Store approved audio assets in the repo.
- Candidate moments: **Track Day start** (engine/start sting), **Broken Car Bingo reveal** (spin/reveal/result), **Trip Legend winner** (podium/celebration sting), **Broken Car Log entry** (subtle mechanical/comedic failure sound), **new PB lap** (positive confirmation), **booking/major completion** (short confirmation), and **countdown zero/start-light sequence**.
- Add a user-facing **Sound Effects on/off setting** and keep playback volume deliberately modest.
- iOS/web autoplay restrictions must be respected. Initialise/unlock the audio system following a genuine user interaction so later Event/countdown effects can play where browser policy permits; tap-triggered effects are the simplest/reliable case.
- Exact sounds, licensing/source, volume, mute persistence and which moments make the final set are **OPEN DESIGN**. Do not add generic browser beeps as a shortcut.


### AVATAR POLISH — labels/descriptions need matching to final artwork (22 September 2026)
- The final Driver and Helmet artwork is now in the app, but several displayed names/descriptions no longer match the actual images.
- Examples visible in current build: Driver labels such as **Bald Beard** / **Long Hair** do not accurately describe their artwork; Helmet colour/style names are also mismatched (e.g. **Red Rocket**, **Blue Thunder**, **Matte Black**, **Orange Fury** are attached to helmets whose visible colours/designs do not correspond).
- This is a **copy/mapping cleanup**, not an artwork redesign. Keep the approved avatar images and systematically rename/remap every Driver and Helmet option so the displayed label matches the final asset.
- Do this after Combe-critical functional testing unless it becomes confusing during crew onboarding.


## POST-COMBE UX — joining a Crew with an already-confirmed active Trip

**Observed from real-user onboarding — 23 September 2026 (Joe).**

When a new/existing Crew member joins after the Crew has already confirmed and booked an active Track Day, the app currently allows them to land in PLAN. Joe naturally searched for Castle Combe on 28 September and tried to add himself to it. Because the live provider listing was now sold out, this made it appear that he could not join the Crew's existing trip, even though the trip was already confirmed in Track Day Heros.

### Required UX improvement
- Detect that the Crew already has a confirmed active Trip as soon as the member joins/reconnects.
- Make the existing Trip unmistakable before normal future-event planning, e.g. **“Your Crew already has a Track Day booked → OPEN TRIP”**.
- Joining/reconnecting to the Crew must not imply that the user needs to find or re-book the already-confirmed event from PLAN.
- Preserve PLAN as the ongoing/future Track Day search area; an active Trip and future planning can coexist.
- The live provider becoming **Sold Out** must not prevent a Crew member from accessing or participating in the already-confirmed Trip lifecycle.
- Respect the attendance lifecycle: Undecided members should be taken to the Join/Follow decision; Attending members to the active Trip; Following/Not Attending members to follower mode.

**Priority:** Post-Combe UX improvement. Do not destabilise the Combe production build for this unless it becomes a functional blocker.


## PRE-EVENT WEATHER — Travel Home countdown

**Requested 24 September 2026.** Add a compact weather forecast inside the large countdown hero on Travel Home for the confirmed event location/date.

### Intended UX
- Keep the existing countdown dominant.
- Add a very brief track-day overview, not a full weather page.
- Show two session snapshots: **MORNING** and **AFTERNOON**.
- Each snapshot should use an immediately readable predicted condition icon (sun / cloud / rain / showers etc.) plus a short condition/temperature summary.
- Forecast must be for the confirmed circuit/event date and location, not the user's current location.
- Refresh forecast data **automatically once per day** as the event approaches so the countdown card remains useful at a glance. Cache the latest successful daily forecast locally/backend-side as appropriate so opening Travel Home does not require repeated weather requests throughout the day.
- If forecast data is unavailable or the event is outside the provider's forecast horizon, fail quietly rather than showing misleading/stale weather.
- Consider the same compact forecast for follower Home where appropriate.

**Priority:** User-approved live-build addition before Castle Combe; keep implementation isolated and low-risk.


### WEATHER UX REVIEW — placement across the app

**Added 24 September 2026 after first live Travel Home implementation.**

The daily AM/PM forecast is now working on Travel Home, but its presentation and lifecycle placement need a deliberate post-Combe review rather than further live-build styling changes now.

Review **where and when weather should appear throughout the app**, including:
- Pre-event: whether Travel Home/countdown remains the primary forecast surface and how compact the hero should become.
- As event day approaches: whether weather should gain prominence or appear in other relevant Travel/Event surfaces.
- Event day: decide whether the forecast should transition into more useful current/session weather information in EVENT / Track Day mode rather than remaining a pre-event countdown forecast.
- Followers/non-attendees: decide whether their Home/Live experience should show the same weather context.
- After the event: weather should not clutter RESULTS/history unless historical conditions add genuine value.
- Define when forecast information first becomes visible, when it refreshes, when it changes from forecast to event-day conditions, and when it disappears.
- Review visual hierarchy/spacing of the current countdown + date + weather composition across phone sizes. Keep weather icons at the currently approved size unless later testing gives a reason to change them.

**Priority:** Post-Combe UX/polish. Current daily forecast is functional; freeze further weather layout work for today.
