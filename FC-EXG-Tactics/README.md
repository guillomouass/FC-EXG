# FC EXG Tactical Board

An animated, interactive futsal briefing for FC EXG (Head Coach: Guillo), ahead of Friday's tournament.
Eight animated sequences show the movements, runs, passes, rotations, cover and transitions of our system:
**1-2-1 with the ball, compact 2-2 without it**.

## Opening it

**Easiest: one file.** Double-click `dist/FC-EXG-Tactics.html`. It opens in any browser (Chrome, Safari, Edge, Firefox), works
offline, and can be sent to the players over WhatsApp or by email. Everything is inside: animations, crest and photos.

**From the project folder.** Double-click `index.html`. Same board, but the `css/`, `js/` and `assets/` folders must stay next to it.

**Fonts:** the board uses the Barlow fonts when online. Offline it falls back to the system fonts, so nothing breaks.

## The 10 screens

| # | Screen | What it shows |
|---|--------|---------------|
| 01 | Home | Crest, Coach Guillo, the objective |
| 02 | Identity | Option A: the complete 1-2-1 attack when everything works (shape, switch, pivot comes short, finish, stay balanced). Option B: attack, loss, drop into the 2-2, ball won back |
| 03 | Build-up | Defender steps up, switch of play, pivot comes short, far winger attacks the middle |
| 04 | Pivot | Option A: pivot comes short, winger attacks the space. Option B: pivot holds, turns and finishes |
| 05 | Drop | Default drop into the 2-2, mutual cover, and the official 5v5 version with goalkeepers |
| 06 | Pressing | When to press (lost high + two players close), press beaten, only one player close |
| 07 | Fast break | Win it, safe first pass, GO!, pivot lay-off, finish in 2–3 passes |
| 08 | Calm | Win it, CALM!, rebuild the 1-2-1, circulate, switch |
| 09 | Full cycle | Build → loss → drop → 2-2 → recovery → transition → finish (and a "press fails" version) |
| 10 | Final words | The eight coach calls, the closing message, signed Guillo |

Training format is **4 v 4 without goalkeepers**: a simplified drill, not a copy of the tournament.
Screen 05 has an **Official 5v5 · with goalkeeper** option for the tournament format.

## Controls

| Button | Key | What it does |
|--------|-----|--------------|
| ▶ / ❚❚ | Space | Play / pause |
| ↺ | R | Restart the sequence |
| ⏮ / ⏭ | ← / → (or a presentation clicker) | Previous step / play the next step. At the end of a sequence, → opens the next screen |
| Freeze | Z | Freeze frame: the animation stops and you can **drag any player** to show a position. Press play to snap back |
| Slow · Normal · Fast | 1 · 2 · 3 | Animation speed |
| Pause each step | | The animation stops after every numbered step |
| Arrows · Names | | Show or hide the movement arrows and the names under the markers |
| Landscape pitch | L | Turns the pitch sideways (our goal on the left). Bigger on a TV or projector |
| Panel | P | Hides the explanation panel for a bigger pitch |
| Present | F | Full screen |
| Timeline | | Drag to any moment. Click a step in the list to replay just that step |
| N / B | | Next / previous screen |

## Entering the players' names

Click **Squad** (top right) or **Enter player names** on the home screen. Type the 8 names (plus the goalkeeper for 5v5)
and save. Names appear under the markers and inside every explanation. They are saved on that device.
**Reset to roles** brings back Defender, Left Winger, Right Winger, Pivot, Opponent 1–4.

## Guide for Guillo: using it in training

1. **Before the session (5 min).** Open the board on a laptop or TV. Enter the names. Choose the Landscape pitch on a wide screen.
2. **Start with screen 02, Identity.** Play it once at normal speed. Then tick **Pause each step** and replay it, so each step
   stops and you can explain it. Point at the coach call at the top: that is the sentence the players must remember.
3. **One sequence, one drill.** Show a sequence (03 to 09), then go straight onto the pitch and play it 4 v 4.
   Starters (blue) against the substitutes (orange), who play the opponent.
4. **Use Freeze when something goes wrong.** Back at the screen, find the moment on the timeline, press Freeze and
   drag the players to show where they should have been. Then press play to show the correct movement.
5. **Repeat the calls.** Each sequence has a short call (GO!, CALM!, DROP!, PRESS!). Make the players say them out loud
   during the drill. Communication is our first advantage.
6. **Finish on screen 10.** The eight principles, one last time, before Friday.

Suggested order for one session: 02 → 03 → 04 → (drill) → 05 → 06 → (drill) → 07 → 08 → (drill) → 09 → 10.

## For whoever edits the sequences

- `js/scenes.js` holds every sequence as data: starting positions in metres on a 20 × 40 pitch, then numbered steps
  with moves, passes, shots, calls and labels. The comment at the top of the file explains each field.
- `js/engine.js` turns a sequence into a timeline and computes positions at any moment.
- `js/app.js` draws the pitch and handles the controls.
- `node tools/check-scenes.js` checks every sequence: no collisions, everyone on the pitch, no pass played through an opponent.
- `node tools/build.js` rebuilds the single-file versions in `dist/`.
- `tools/browser-check.js` is an in-browser test of all buttons and sequences (paste it into the browser console).
