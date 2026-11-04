# Test Town: the game layer of Amni-Test

Test Town turns testing into a small 3D world that testers return to every day. It sits on top of the money rules in [`../README.md`](../README.md) and never changes them:

- **XP, ranks, badges, streaks, quests, leaderboards and cosmetics never pay money.** Money comes only from finished tests, as before.
- **Pay level is separate from rank.** The level that sets a tester's $1–$5 price still comes from merits and demerits. XP only drives rank and cosmetics.
- **XP never goes down.** Mistakes are already handled by demerits, so the game layer only rewards.

## Surfaces

- **The town** (`/test/town/`): a three.js scene that works in any browser and inside the Android app.
- **The Android app** (`/apps/amni-test-android/`):
  - A native shell with Google sign-in through Credential Manager.
  - A WebView showing the town.
  - Reminders for check-ins.
  - It reports which test apps are installed.
  - It is installed from amni-scient.com (sideloaded), so it can use `QUERY_ALL_PACKAGES`.

## XP

| Event | XP |
|---|---|
| First visit of the UTC day (`POST /api/game/visit`) | 5 |
| Accept a test | 10 |
| File a check-in | 20 |
| Detailed check-in (worked + broke together 200 characters or more) | +10 more |
| A developer marks your check-in helpful | 30 |
| Finish a test (`completed`) | 100 |
| Quest rewards | as listed below |

## Ranks (by XP)

| Rank | XP |
|---|---|
| Rookie | 0 |
| Scout | 100 |
| Tinkerer | 300 |
| Bug Hunter | 700 |
| Pathfinder | 1,500 |
| Architect | 3,000 |
| Legend | 6,000 |

## Streak

- A day counts when the tester visits (`POST /api/game/visit`) on that UTC day.
- Visiting on consecutive days adds 1 to the streak. Missing a day resets it to 1 on the next visit.
- The best streak is kept.

## Badges

| id | Name | Earned when |
|---|---|---|
| first_steps | First Steps | You accept your first test |
| first_report | First Report | You file your first check-in |
| finisher | Finisher | You finish 1 test |
| veteran | Veteran | You finish 10 tests |
| marathon | Marathoner | You finish 25 tests |
| sharp_eye | Sharp Eye | You file 10 detailed check-ins |
| helpful_hand | Helpful Hand | You get 5 helpful votes |
| streak_7 | Week Lit | You reach a 7-day streak |
| streak_30 | Month Lit | You reach a 30-day streak |
| clean_sheet | Clean Sheet | You finish 5 tests with no missed check-ins |
| questor | Questor | You complete 10 quests |
| top_level | Top Shelf | You reach pay level 5 |

## Quests

- **Periods:**
  - Daily quests reset at 00:00 UTC (period key `d:<days since epoch>`).
  - Weekly quests reset on Monday 00:00 UTC (period key `w:<Monday's days since epoch>`).
- **Progress** is counted from XP events in the period.
- **Rewards** are awarded automatically when progress reaches the target, once per period.

| id | Period | Title | Target | XP |
|---|---|---|---|---|
| d_visit | daily | Stop by town | 1 visit | 10 |
| d_checkin | daily | File a check-in | 1 check-in | 25 |
| w_finish | weekly | Finish a test | 1 completed | 100 |
| w_helpful | weekly | Be helpful | 1 helpful vote | 50 |
| w_detail | weekly | Three sharp reports | 3 detailed check-ins | 60 |
| w_accept | weekly | Take on a new test | 1 accept | 30 |

## Profile and cosmetics

- **Nickname:** 3–20 characters from `A–Z a–z 0–9 _ -`, unique regardless of case. A short blocklist of slurs and words like "admin" or "amni" is refused.
- **Privacy:** leaderboards and other testers only ever see the nickname, never the email.
- **Avatar:** JSON `{ color, shape, hat, trail }`. Every value must be a cosmetic the tester has unlocked:
  - **color:** `c0`–`c3` are free. `c4`–`c7` unlock at Scout, Tinkerer, Bug Hunter and Pathfinder.
  - **shape:** `cube` and `capsule` are free. `cone` unlocks at Tinkerer and `star` at Architect.
  - **hat:** `none` and `cap` are free. `crown` unlocks at Legend; `goggles` with sharp_eye, `hardhat` with finisher, `halo` with clean_sheet.
  - **trail:** `none` is free. `sparks` unlocks with streak_7 and `comet` with streak_30.
- **Leaderboard visibility:** `showOnBoard` defaults to on once a nickname is set. Turning it off hides the tester from leaderboards.

## Installs reported by the app

- The Android app sends `POST /api/app/installs { installed: [package…] }` listing which packages from the tester's running tests are installed.
- The server records a ping with `src = 'app'` for each matching active test.
- Developers see "installed (reported by tester's app)".
- Only SDK pings (`src = 'sdk'`) can approve a completion automatically, because the app's report comes from the tester's own phone.

## API (all signed in)

Actions that earn XP (`accept`, `checkin`, `visit`) add a `game` object to their normal response, so the town can celebrate:
`{ xp, rank, rankUp: bool, newBadges: [badge], questsDone: [quest] }`.
`xp` here is the XP gained by that action.

| Method and path | What it does |
|---|---|
| `POST /api/game/visit` | Counts today for the streak. Returns `{ game, streak: { current, best }, firstToday: bool }` |
| `GET /api/game/state` | Returns `{ xp, rank: { name, min, next, nextName }, streak: { current, best, lastDay }, badges: [{ id, name, description, earnedAt\|null }], quests: [{ id, period, title, target, progress, rewardXp, done }], profile: { nickname, avatar, showOnBoard }, cosmetics: [{ kind, id, name, unlocked, how }], stats: { completed, checkins, detailed, helpful, accepted } }` |
| `POST /api/game/profile { nickname?, avatar?, showOnBoard? }` | Returns `{ profile }`. 409 if the nickname is taken; 400 if a cosmetic is locked |
| `GET /api/game/leaderboard?period=week\|all` | Returns `{ period, rows: [{ place, nickname, avatar, xp, rank }], me: { place\|null, xp } }`. Top 50, only testers with a nickname and `showOnBoard` |
| `GET /api/game/town` | One call for the scene: `{ me: <state>, market: <GET /api/tests>.tests, myTests: <GET /api/assignments>.assignments, podium: <weekly top 3 rows>, balanceCents, tester: <the /api/me tester block>, user: <the /api/me user block> }` |
| `POST /api/app/installs { installed: [package] }` | Returns `{ verified: [assignmentId] }` |

`GET /api/campaigns/:id` assignments also include `tester.nickname`, `tester.rank` and `tester.badges` (a count), so developers see a tester card.
