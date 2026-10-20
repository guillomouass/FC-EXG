/* FC EXG Tactical Board — tactical sequences.
 *
 * Coordinates are metres on a 20 x 40 futsal pitch, seen from above:
 *   x: 0 = left touchline, 20 = right touchline
 *   y: 0 = opponent goal line (top), 40 = our goal line (bottom)
 * Team A (FC EXG starters, blue): DEF, LW, RW, PIV (+ GK in 5v5 variants)
 * Team B (substitutes playing the opponent, orange): O1–O4 (+ OGK)
 *
 * Each step:  d      duration in seconds (at normal speed)
 *             t / x  title / short explanation ({DEF}, {LW}… become player names)
 *             m      moves: { ID: [x, y, startFraction, endFraction] }
 *             ball   { pass: [from, to], at: [s, e] } or { shot: [x, y], at: [s, e] }
 *             shout  { who, text }  — what a player calls out
 *             tags   { ID: 'label' } — small labels next to players
 *             zone   { x, y, r, label } — highlighted space
 *             shape  true/false — draw our team's shape (1-2-1 diamond / 2-2 box)
 *             links  [[coverer, covered]] — who covers whom
 *             cond   [lostHigh, twoClose] — pressing conditions panel
 *             call   coach call shown above the pitch for this step
 */
(function (root) {
  'use strict';

  var ROLES = {
    DEF: { code: 'DEF', name: 'Defender', team: 'A' },
    LW:  { code: 'LW',  name: 'Left Winger', team: 'A' },
    RW:  { code: 'RW',  name: 'Right Winger', team: 'A' },
    PIV: { code: 'PIV', name: 'Pivot', team: 'A' },
    GK:  { code: 'GK',  name: 'Goalkeeper', team: 'K' },
    O1:  { code: 'O1',  name: 'Opponent 1', team: 'B' },
    O2:  { code: 'O2',  name: 'Opponent 2', team: 'B' },
    O3:  { code: 'O3',  name: 'Opponent 3', team: 'B' },
    O4:  { code: 'O4',  name: 'Opponent 4', team: 'B' },
    OGK: { code: 'GK',  name: 'Opp. Keeper', team: 'OK' }
  };

  var QUOTES = {
    home: 'FC EXG — ONE TEAM. ONE MINDSET. ONE MISSION.',
    q1: 'Talent makes the difference. Discipline wins.',
    q2: 'One player can win a duel. A team wins a tournament.',
    q3: 'We don’t all chase the ball. We play for each other.',
    q4: 'Every run must create space. Every pass must have intent.',
    q5: 'The first pass secures. The second movement hurts.',
    q6: 'When we lose it, react instantly. When we win it, decide smartly.',
    q7: 'If we press, we press together. If we defend, we defend together.',
    q8: 'Communication is our first advantage.'
  };

  var COACH_CALLS = [
    'One winger cuts, the other stays wide.',
    'Pivot, hold or come short: give us a decision.',
    'High loss and two players close: PRESS!',
    'Otherwise, DROP!',
    'First pass safe.',
    'GO if the space is open, CALM if their block is set.',
    'We defend together, we attack together.',
    'If you step out, a teammate covers you.'
  ];

  /* ------------------------------------------------------------------ */
  /* 02 — Identity: 1-2-1 in attack, 2-2 in defence                       */
  /* ------------------------------------------------------------------ */
  var identity = {
    id: 'identity', num: '02', nav: 'Identity',
    kicker: 'Our game identity',
    title: '1-2-1 with the ball, 2-2 without it',
    system: 'Attack 1-2-1 · Defence 2-2 compact',
    format: '4v4 training drill · no goalkeeper',
    quote: QUOTES.q1,
    call: 'We defend together, we attack together.',
    situation: 'We have the ball in our half. The opponent waits in a 2-2 block.',
    players: {
      DEF: 'Lowest player. Builds from behind, can step up to halfway, never higher than the ball. Protects the middle and the depth when we lose it.',
      LW: 'Holds the left touchline to stretch the opponent. Attacks the middle when the other winger stays wide.',
      RW: 'Holds the right touchline. Same rule: one winger attacks the middle, the other keeps the width.',
      PIV: 'Highest player. Pins the defenders or comes short to create space. Creator and finisher.'
    },
    ballPath: 'Defender → Left Winger → Defender → Right Winger. Lost, then won back and played safe to the Defender.',
    decision: 'With the ball: stay wide and deep (1-2-1). Without it: drop together into a compact 2-2 between ball and goal.',
    mistake: 'Four players in a line or three on one side: no passing angles, and nobody covers when we lose it.',
    notes: [
      'Training format: 4v4 without goalkeepers. A simplified drill to learn the movements, not a full copy of the tournament.',
      'Tournament format: 5v5 futsal with a goalkeeper. The keeper adds safety behind the 2-2 and calls GO! or CALM!.',
      '2-2 rule: positions, not names. The two players nearest our goal form the back pair, the other two form the front pair.'
    ],
    init: { DEF: [10, 27], LW: [3, 19], RW: [17, 19], PIV: [10, 10],
            O1: [7.5, 17], O2: [12.5, 17], O3: [8, 8.5], O4: [12.5, 8.5], ball: 'DEF' },
    shape: true,
    steps: [
      { d: 2.2, t: 'Attack shape: 1-2-1',
        x: 'One low ({DEF}), two wide ({LW} and {RW}), one high ({PIV}). The diamond gives the ball carrier a pass on every side.',
        ball: { pass: ['DEF', 'LW'], at: [0.15, 0.6] },
        m: { LW: [3, 18], DEF: [9, 26, 0.3, 1], O1: [5.5, 16.5, 0.3, 1], O2: [10, 16.5, 0.3, 1], O3: [6.5, 9.5, 0.3, 1], O4: [11, 9, 0.3, 1] } },
      { d: 2.0, t: 'Circulate through the defender',
        x: '{LW} is pressed, so the ball goes back to {DEF}, our safe option.',
        ball: { pass: ['LW', 'DEF'], at: [0.1, 0.55] },
        m: { DEF: [10, 25.5], O1: [5, 17, 0.2, 1], O2: [9.5, 18, 0.4, 1] } },
      { d: 2.0, t: 'Switch to the far side',
        x: 'The block has shifted left. {DEF} switches the play to {RW}, who kept the width.',
        ball: { pass: ['DEF', 'RW'], at: [0.1, 0.55] },
        m: { RW: [17, 17.5], DEF: [11, 26], O2: [14.5, 16, 0.35, 1], O1: [9, 17.5, 0.35, 1], O3: [8.5, 9, 0.3, 1], O4: [13.5, 9.5, 0.3, 1] } },
      { d: 1.6, t: 'Ball lost',
        x: 'The pass inside is intercepted. This is the moment that decides matches.',
        ball: { pass: ['RW', 'O2'], at: [0.1, 0.45] },
        m: { O2: [14, 18.5, 0, 0.45] }, tags: { RW: 'Lost' } },
      { d: 2.8, t: 'DROP! Rebuild the 2-2 together',
        x: 'Everyone sprints back between ball and goal. The two nearest our goal form the back pair, the other two the front pair.',
        shout: { who: 'RW', text: 'DROP!' }, call: 'Drop first, press only if it’s winnable.',
        m: { O2: [12.5, 23.5, 0.1, 1], O1: [4.5, 20.5, 0, 0.7], O3: [6, 16, 0.2, 1], O4: [15.5, 18, 0.2, 1],
             PIV: [7.5, 25.5], RW: [13.5, 26], LW: [7.5, 31], DEF: [12.5, 31] } },
      { d: 1.6, t: 'Ball won back',
        x: 'The compact block closes the passing lane. {PIV} intercepts.',
        ball: { pass: ['O2', 'PIV'], at: [0.1, 0.45] },
        m: { PIV: [8.6, 24, 0, 0.4] }, tags: { PIV: 'Won' } },
      { d: 2.6, t: 'Secure it, then rebuild the 1-2-1',
        x: 'First pass safe to {DEF}. The others spread out again: two wide, one high.',
        ball: { pass: ['PIV', 'DEF'], at: [0.05, 0.4] },
        m: { DEF: [11, 28.5, 0, 0.4], LW: [3, 21, 0.3, 1], RW: [17, 20, 0.3, 1], PIV: [10, 13, 0.3, 1],
             O2: [12, 17, 0.2, 1], O1: [7.5, 16, 0.2, 1], O3: [8, 8.5, 0.2, 1], O4: [12.5, 9, 0.2, 1] } }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* 03 — Build-up and rotations                                          */
  /* ------------------------------------------------------------------ */
  var attack = {
    id: 'attack', num: '03', nav: 'Build-up',
    kicker: 'Attacking organisation',
    title: 'Build-up, switch and rotation',
    system: '1-2-1 vs 2-2 block',
    format: '4v4 training drill · no goalkeeper',
    quote: QUOTES.q4,
    call: 'One winger cuts, the other stays wide.',
    rule: 'One winger attacks the middle, the other keeps the width.',
    situation: '{DEF} has the ball in our half. The opponent defends in a 2-2 block.',
    players: {
      DEF: 'Steps up to draw the press, gives a safe option behind the ball, then switches play. Stays as the safety player: never past halfway.',
      LW: 'Receives wide, drives at the block, then attacks the space in the middle at speed when the ball is on the other side.',
      RW: 'Keeps the width while the ball is on the left. Receives the switch and plays the ball into the run.',
      PIV: 'Comes short towards the ball to drag his marker out. That movement opens the space behind him.'
    },
    ballPath: 'Defender → Left Winger → Defender → Right Winger → into the run of the Left Winger → shot.',
    decision: 'Pressure on one side means space on the other: switch, then exploit the space the pivot creates.',
    mistake: 'Both wingers coming inside at the same time, or the Defender joining the attack and leaving nobody behind the ball.',
    init: { DEF: [10, 28], LW: [2.5, 20], RW: [17.5, 20], PIV: [10, 10.5],
            O1: [8, 18], O2: [12, 18], O3: [8, 8.5], O4: [12.5, 8.5], ball: 'DEF' },
    shape: true,
    steps: [
      { d: 1.8, t: '{DEF} receives and steps up',
        x: '{DEF} carries the ball towards halfway to draw the first opponent out.',
        m: { DEF: [10, 24], O1: [9.5, 20.5, 0.3, 1], O2: [12.5, 19.5, 0.3, 1], LW: [2.5, 19.5], RW: [17.5, 19.5] } },
      { d: 2.0, t: 'Pass to {LW}',
        x: 'The ball goes wide. {DEF} moves across to stay available behind the ball.',
        ball: { pass: ['DEF', 'LW'], at: [0.05, 0.5] },
        m: { LW: [2.5, 18.5, 0, 0.5], O1: [5.5, 17, 0.3, 1], O2: [9, 17, 0.35, 1], O3: [6, 10, 0.2, 1], O4: [10.5, 8.4, 0.2, 1],
             DEF: [8.5, 24.5, 0.4, 1], PIV: [10.5, 10.5] } },
      { d: 1.8, t: '{LW} drives, the press comes to the ball',
        x: 'Three opponents slide to the left. {RW} does not follow: he keeps the width on the far side.',
        m: { LW: [3.5, 15], O1: [5.2, 14.2, 0.1, 1], O2: [7.2, 16.6, 0.1, 1], O3: [4.8, 11.2, 0.2, 1], O4: [9.8, 8.8, 0.2, 1],
             DEF: [7.5, 24], RW: [17, 18.5], PIV: [10.5, 10.8] },
        tags: { RW: 'Width' } },
      { d: 1.6, t: 'Too much pressure: back to {DEF}',
        x: 'No forward pass is on, so {LW} plays back to the safety player.',
        ball: { pass: ['LW', 'DEF'], at: [0.15, 0.6] },
        m: { DEF: [8.5, 24.5, 0, 0.6], O2: [8.3, 19.8, 0.4, 1], O1: [5, 14.6], O4: [10.5, 9], RW: [17.5, 18] } },
      { d: 2.0, t: '{DEF} draws the press, then switches',
        x: 'The press is concentrated on the left, so the space is on the right. {DEF} switches the play to {RW}.',
        ball: { pass: ['DEF', 'RW'], at: [0.4, 0.85] },
        m: { DEF: [9.5, 23.5, 0, 0.4], RW: [17, 16.5, 0.3, 1], O2: [12, 18.5, 0.5, 1], O1: [7, 15.5, 0.5, 1],
             O3: [9, 9, 0.5, 1], O4: [13, 9.5, 0.5, 1], PIV: [11, 10.5] },
        tags: { RW: 'Switch' } },
      { d: 1.8, t: '{PIV} comes short towards the ball',
        x: '{PIV} drops towards {RW}. His marker follows him and the other defender is pulled across: space opens in the middle.',
        m: { PIV: [12, 14.5, 0, 0.8], O4: [12.3, 12.6, 0.1, 0.9], O3: [12, 8, 0.2, 1], O2: [14.8, 17.4, 0, 0.7],
             O1: [6.5, 14.5], DEF: [10.5, 23.5] },
        zone: { x: 8.5, y: 6.5, r: 3, label: 'SPACE', from: 0.5 }, tags: { PIV: 'Comes short' } },
      { d: 2.0, t: '{LW} attacks the space, {RW} plays him in',
        x: 'The far winger arrives at speed into the space. {RW} stays wide and threads the pass between the two defenders.',
        ball: { pass: ['RW', 'LW'], at: [0.35, 0.85] },
        m: { LW: [8.5, 6.5], O1: [7, 11.5, 0.3, 1] },
        tags: { LW: 'Attacks the middle', RW: 'Keeps the width', DEF: 'Safety' } },
      { d: 1.4, t: '{LW} finishes',
        x: 'Shot first time. If the pass is not on, recycle back to {DEF} and start again.',
        ball: { shot: [9.3, 0.2], at: [0.15, 0.55] },
        m: { LW: [9, 5.6], O3: [10.6, 6.6, 0.2, 1], O4: [11.5, 10, 0.2, 1], PIV: [11.5, 11.8] } }
    ]
  };

  /* Screen 02 gets two options: the complete attack when everything works, and attack -> loss -> drop. */
  (function () {
    var loss = { id: 'B', label: 'Attack, loss and drop' };
    ['call', 'situation', 'players', 'ballPath', 'decision', 'mistake', 'init', 'shape', 'steps'].forEach(function (k) {
      loss[k] = identity[k];
      delete identity[k];
    });
    var good = {
      id: 'A', label: 'Complete attack: everything works',
      call: 'One winger cuts, the other stays wide.',
      rule: 'One winger attacks the middle, the other keeps the width.',
      situation: 'We have the ball in our half and everything works: the shape holds, the ball circulates, the pivot creates space and a winger finishes.',
      players: {
        DEF: 'Lowest player. Steps up to halfway at most to draw the press, relays the ball and switches play. Never higher than the ball.',
        LW: 'Holds the left touchline. Receives wide, drives at the block, then attacks the middle once the ball is on the other side.',
        RW: 'Holds the right touchline while the ball is on the left, receives the switch and plays the ball into the run.',
        PIV: 'Highest player. Comes short to drag his marker away and open the space behind him.'
      },
      ballPath: 'Defender → Left Winger → Defender → Right Winger → Left Winger (into the run) → shot.',
      decision: 'Stay in the 1-2-1 and move the ball until the block opens: pressure on one side means space on the other.',
      mistake: 'Both wingers cutting inside together, or the Defender joining the attack and leaving nobody behind the ball.',
      init: clone(attack.init),
      shape: true,
      steps: [{
        d: 2.2, t: 'Attack shape: 1-2-1',
        x: 'One low ({DEF}), two wide ({LW} and {RW}), one high ({PIV}). This is where every attack starts.',
        tags: { DEF: 'Low', LW: 'Wide', RW: 'Wide', PIV: 'High' }
      }].concat(clone(attack.steps)).concat([{
        d: 2.0, t: 'After the shot: stay balanced',
        x: '{DEF} stays back as the safety player. {RW} and {PIV} follow up the rebound. Nobody is stranded if we lose it.',
        m: { DEF: [10, 24.5], RW: [15.5, 12.5], PIV: [11.8, 12.6] },
        tags: { DEF: 'Safety' }
      }])
    };
    identity.variants = [good, loss];
  })();

  /* ------------------------------------------------------------------ */
  /* 04 — The pivot: come short or hold                                   */
  /* ------------------------------------------------------------------ */
  var pivotDrop = {
    id: 'A', label: 'Option A · Pivot comes short',
    call: 'Pivot, hold or come short: give us a decision.',
    situation: '{DEF} has the ball centrally. {PIV} is marked closely from behind.',
    players: {
      DEF: 'Carries forward, then plays the ball into the run behind the pivot’s marker.',
      LW: 'Nearest winger to the space. Times the run and arrives at speed to finish.',
      RW: 'Keeps the width on the far side and stays ready for a rebound.',
      PIV: 'Comes short towards the ball. His marker follows him and the space appears behind.'
    },
    ballPath: 'Defender carries → pass into the run of the Left Winger → shot.',
    decision: 'If the marker follows the pivot, the space is behind him: the nearest winger attacks it.',
    mistake: 'The winger runs too early and stands still in the space, or the pivot comes short without dragging anyone.',
    init: { DEF: [10.5, 25], LW: [2.5, 18], RW: [17.5, 18], PIV: [9.5, 9.5],
            O1: [7.5, 18.5], O2: [12.5, 19], O3: [8.5, 7.6], O4: [12.5, 8.5], ball: 'DEF' },
    steps: [
      { d: 1.6, t: '{DEF} carries, the pivot reads the ball',
        x: '{DEF} moves forward with the ball. {PIV} watches the carrier and his marker.',
        m: { DEF: [11, 22.5], O2: [13, 20, 0.3, 1], O1: [6.5, 18, 0.3, 1] } },
      { d: 1.8, t: '{PIV} comes short',
        x: '{PIV} drops towards the ball. His marker follows: a space opens behind them.',
        m: { PIV: [8, 14.2, 0, 0.85], O3: [8.2, 12.4, 0.15, 1], O4: [12.2, 9.5, 0.3, 1] },
        zone: { x: 9, y: 6.5, r: 3, label: 'SPACE', from: 0.55 }, tags: { PIV: 'Comes short' } },
      { d: 2.0, t: '{LW} attacks the space',
        x: 'The nearest winger cuts inside at speed. {DEF} plays the ball into his run, not to his feet.',
        ball: { pass: ['DEF', 'LW'], at: [0.4, 0.85] },
        m: { LW: [9, 6.2], RW: [17.5, 16], O1: [6, 14, 0.35, 1] },
        tags: { LW: 'Into the space', RW: 'Width' } },
      { d: 1.3, t: '{LW} finishes',
        x: 'The winger becomes the finisher. {PIV} turns to follow up a rebound.',
        ball: { shot: [10.6, 0.2], at: [0.1, 0.55] },
        m: { LW: [9.5, 5.2], O3: [8.9, 9.6, 0.1, 1], PIV: [7.6, 13.4] } }
    ]
  };
  var pivotHold = {
    id: 'B', label: 'Option B · Pivot holds',
    call: 'Pivot, hold or come short: give us a decision.',
    situation: '{PIV} stays high between the two defenders. We move the ball until the lane to him opens.',
    players: {
      DEF: 'Circulates the ball patiently from side to side to move the block.',
      LW: 'Receives the switch and looks forward first: is the lane to the pivot open?',
      RW: 'Moves the block to his side, then attacks the far post.',
      PIV: 'Holds his position and pins two defenders. When the ball arrives: turn, combine or finish.'
    },
    ballPath: 'Defender → Right Winger → Defender → Left Winger → Pivot → turn and shot.',
    decision: 'Play into the pivot only when the pass is clean. Otherwise keep circulating.',
    mistake: 'Forcing the pass into the pivot while his marker is in front of him.',
    init: { DEF: [10, 25], LW: [2.5, 18], RW: [17.5, 18], PIV: [10, 8.5],
            O1: [7.5, 18], O2: [12.5, 18], O3: [10, 6.7], O4: [13, 8], ball: 'DEF' },
    steps: [
      { d: 1.8, t: '{PIV} holds and pins the defenders',
        x: '{PIV} stays high. Two defenders have to watch him, so there is more room for the others.',
        ball: { pass: ['DEF', 'RW'], at: [0.1, 0.6] },
        m: { PIV: [10.5, 8.3], O3: [10.4, 6.5], RW: [17.5, 17], O2: [14.5, 16.5, 0.3, 1], O1: [10, 17, 0.3, 1] },
        tags: { PIV: 'Pins two' } },
      { d: 1.8, t: 'Circulate: back to {DEF}',
        x: '{RW} is pressed. The ball goes back to {DEF}.',
        ball: { pass: ['RW', 'DEF'], at: [0.1, 0.55] },
        m: { DEF: [9, 24, 0, 0.55], O2: [16.2, 15.2, 0, 0.5], O1: [9.5, 19.5, 0.3, 1] } },
      { d: 1.8, t: 'Switch to {LW}: the block slides',
        x: 'The ball changes side faster than the opponent can slide.',
        ball: { pass: ['DEF', 'LW'], at: [0.1, 0.55] },
        m: { LW: [2.5, 15.5, 0, 0.7], O1: [6, 16, 0.4, 1], O2: [10.5, 15.5, 0.3, 1], O4: [12.3, 9.2, 0.3, 1], RW: [17.5, 16] } },
      { d: 1.8, t: 'The lane opens: into {PIV}’s feet',
        x: '{PIV} shows for the ball. The pass is clean, so {LW} plays it in. {RW} attacks the far post.',
        ball: { pass: ['LW', 'PIV'], at: [0.35, 0.8] },
        m: { PIV: [9, 9.8, 0, 0.5], O3: [9, 8, 0.2, 0.7], O4: [11.5, 9.5, 0.4, 1], RW: [15.5, 10, 0.3, 1] },
        tags: { RW: 'Far post' } },
      { d: 1.6, t: '{PIV} turns and finishes',
        x: 'He turns away from his marker and shoots. Other options: lay it off or find the far post.',
        ball: { shot: [9.4, 0.2], at: [0.55, 0.9] },
        m: { PIV: [7.2, 8.6, 0, 0.55], O3: [8.7, 7.3, 0.2, 0.8], RW: [14.5, 7.5] },
        tags: { PIV: 'Turn & shoot' } }
    ]
  };
  var pivot = {
    id: 'pivot', num: '04', nav: 'Pivot',
    kicker: 'Pivot play',
    title: 'The pivot: come short or hold',
    system: '1-2-1 · pivot as creator and finisher',
    format: '4v4 training drill · no goalkeeper',
    quote: QUOTES.q5,
    variants: [pivotDrop, pivotHold]
  };

  /* ------------------------------------------------------------------ */
  /* 05 — Ball lost: drop and cover                                       */
  /* ------------------------------------------------------------------ */
  var dropSteps = [
    { d: 1.6, t: 'We build on the left',
      x: '{LW} carries the ball near halfway.',
      m: { LW: [3.5, 19.5], O1: [5, 18.2, 0.2, 1] } },
    { d: 1.4, t: 'Ball lost in midfield',
      x: 'The pass inside is cut out at halfway. Lost high? No. So we do not press.',
      ball: { pass: ['LW', 'O2'], at: [0.1, 0.45] },
      m: { O2: [8.5, 19, 0, 0.45] }, tags: { LW: 'Lost' }, cond: [false, false] },
    { d: 2.6, t: 'DROP! The nearest player delays',
      x: '{LW} calls it and sprints back. {DEF} backs off in front of the carrier: between ball and goal, without diving in.',
      shout: { who: 'LW', text: 'DROP!' },
      m: { O2: [9.5, 23.5, 0.1, 1], DEF: [9.6, 28.6, 0.1, 1], LW: [7.5, 26.5], RW: [14, 27], PIV: [12, 22],
           O1: [3.5, 22.5, 0.2, 1], O3: [5.5, 17, 0.2, 1], O4: [15, 19, 0.2, 1] },
      tags: { DEF: 'Delays' }, cond: null },
    { d: 2.2, t: 'Compact 2-2 between ball and goal',
      x: 'Front pair {LW} and {PIV}, back pair {DEF} and {RW}. Close together, closing the middle.',
      m: { O2: [10, 25], LW: [7.6, 27.6], PIV: [12.3, 27.2], DEF: [8.4, 32], RW: [12.6, 32],
           O1: [4, 24.5], O3: [6.5, 20], O4: [15.5, 22.5] },
      shape: true, tags: { DEF: 'Protects the middle' } },
    { d: 2.0, t: 'The block slides with the ball',
      x: 'The ball goes wide, all four slide together. {PIV} closes the new carrier without diving in.',
      ball: { pass: ['O2', 'O4'], at: [0.1, 0.55] },
      m: { O4: [15.5, 23, 0, 0.4], O2: [10.5, 23.5, 0.4, 1], LW: [10, 27.4, 0.3, 1], PIV: [14.4, 26, 0.3, 1],
           DEF: [10.4, 32, 0.3, 1], RW: [14.6, 31, 0.3, 1] },
      tags: { PIV: 'Delays' } }
  ];
  var dropInit = { DEF: [10, 27], LW: [3, 21], RW: [17, 19], PIV: [10, 11],
                   O1: [6, 18], O2: [11, 18], O3: [8, 9], O4: [12.5, 9.5], ball: 'LW' };

  var recoverDefault = {
    id: 'A', label: 'Default drop · 4v4',
    call: 'Otherwise, DROP!',
    rule: 'On the loss: drop first, press only if it’s winnable.',
    situation: 'We attack on the left and lose the ball at halfway.',
    players: {
      DEF: 'Nearest player between ball and goal: backs off to slow the carrier, then takes his place in the back pair.',
      LW: 'Lost the ball: calls DROP! and sprints back. Never stands still.',
      RW: 'Comes back inside to close the middle and joins the back pair.',
      PIV: 'Sprints back past the ball to join the front pair.'
    },
    ballPath: 'Left Winger loses it → carrier drives forward → pass wide.',
    decision: 'Ball lost at halfway: not winnable. Drop first, build the 2-2, then defend together.',
    mistake: 'One player chases the ball alone while the others jog back: the middle is open.',
    init: dropInit,
    steps: dropSteps
  };
  var recoverCover = {
    id: 'B', label: 'Mutual cover',
    call: 'If you step out, a teammate covers you.',
    situation: 'Our 2-2 is set. The opponent attacks down our left.',
    players: {
      DEF: 'Covers {LW}. When he is beaten, steps out to the carrier.',
      LW: 'Presses the carrier. When beaten, recovers inside to a useful position. No standing and watching.',
      RW: 'Covers {DEF}. When {DEF} steps out, slides into the middle behind him.',
      PIV: 'Narrows to the middle to close the pass inside.'
    },
    ballPath: 'Opponent 1 dribbles past the Left Winger → ball won by the Defender.',
    decision: 'Every player knows who he covers, who covers him, which zone he protects, and where he goes if a teammate is beaten.',
    mistake: 'The beaten player stops, or the cover arrives late because nobody was watching.',
    init: { LW: [7.5, 26], PIV: [12.5, 26], DEF: [8, 31], RW: [12.5, 31],
            O1: [5, 22], O2: [10, 20], O3: [15, 21], O4: [9.5, 15.5], ball: 'O1' },
    shape: true,
    links: [['DEF', 'LW'], ['RW', 'PIV'], ['RW', 'DEF']],
    steps: [
      { d: 2.0, t: 'Everyone knows who covers whom',
        x: '{LW} steps to the carrier. {DEF} covers behind him, {RW} covers {DEF}, {PIV} closes the middle.',
        m: { LW: [6.2, 24.6, 0.2, 1], DEF: [7, 29, 0.2, 1], RW: [11, 30.5, 0.2, 1], PIV: [10.5, 25.6, 0.2, 1], O1: [4.6, 22.4] } },
      { d: 1.6, t: '{LW} is beaten',
        x: 'The carrier goes past {LW}. It happens. What matters is the next second.',
        m: { O1: [4, 27.5], LW: [5.9, 25.6, 0, 0.7] }, tags: { LW: 'Beaten' } },
      { d: 1.8, t: '{DEF} steps out, {RW} covers him',
        x: '{DEF} takes the carrier. {RW} slides behind {DEF} to protect the middle and the depth.',
        shout: { who: 'DEF', text: 'MINE!' },
        m: { DEF: [5.9, 30.2, 0, 0.7], RW: [8.9, 32], PIV: [9.6, 27.8], O1: [4.4, 28.2, 0, 0.8], O2: [9, 22, 0.2, 1] },
        links: [['RW', 'DEF'], ['PIV', 'LW']], tags: { RW: 'Covers' } },
      { d: 2.0, t: '{LW} recovers, ball won',
        x: '{LW} sprints back inside to a useful position. The carrier has no way through: {DEF} wins it.',
        ball: { pass: ['O1', 'DEF'], at: [0.45, 0.7] },
        m: { LW: [7.4, 28.4, 0, 0.8], DEF: [5.6, 29.6, 0.3, 0.7], RW: [10.2, 31.5, 0.2, 1], PIV: [11, 26.6, 0.2, 1], O1: [4.6, 28.6, 0, 0.5] },
        tags: { LW: 'Recovers inside', DEF: 'Won' } }
    ]
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // Move a whole sequence sideways (metres) to give it room on the pitch.
  function shiftX(v, dx) {
    Object.keys(v.init).forEach(function (k) { if (Array.isArray(v.init[k])) v.init[k][0] += dx; });
    v.steps.forEach(function (st) { Object.keys(st.m || {}).forEach(function (k) { st.m[k][0] += dx; }); });
    return v;
  }
  shiftX(recoverCover, 2.5);
  var recoverGK = (function () {
    var steps = clone(dropSteps);
    steps[1].x = 'The pass inside is cut out at halfway. {GK} reads it: not winnable.';
    steps[2].shout = [{ who: 'GK', text: 'DROP!' }, { who: 'LW', text: 'DROP!' }];
    steps[2].x = '{GK} and the nearest player call it. {DEF} delays the carrier; {GK} protects the space behind.';
    steps[3].x = 'Same compact 2-2, with {GK} behind it. {DEF} is no longer the last player.';
    var init = clone(dropInit);
    init.GK = [10, 38.2]; init.OGK = [10, 1.8];
    return {
      id: 'C', label: 'Official 5v5 · with goalkeeper',
      gk: true,
      call: 'Otherwise, DROP!',
      rule: 'On the loss: drop first, press only if it’s winnable.',
      situation: 'Tournament format: same loss at halfway, now with a goalkeeper on each side.',
      players: {
        DEF: 'Delays the carrier, then joins the back pair. The keeper covers the depth behind him.',
        LW: 'Lost the ball: calls DROP! and sprints back.',
        RW: 'Comes back inside to the back pair.',
        PIV: 'Sprints back to the front pair.',
        GK: 'Sees the whole game: calls DROP!, GO! or CALM!. Protects the space behind the block.'
      },
      ballPath: 'Left Winger loses it → carrier drives forward → pass wide.',
      decision: 'Same rule as in training. The keeper adds a voice and a last line of defence.',
      mistake: 'Thinking the keeper will fix it: the 2-2 still has to drop together.',
      init: init,
      steps: steps
    };
  })();

  var recover = {
    id: 'recover', num: '05', nav: 'Drop',
    kicker: 'Defensive organisation',
    title: 'Ball lost: drop and cover',
    system: 'Defence 2-2 compact',
    format: '4v4 drill · 5v5 variant',
    quote: QUOTES.q6,
    variants: [recoverDefault, recoverCover, recoverGK]
  };

  /* ------------------------------------------------------------------ */
  /* 06 — Pressing triggers                                               */
  /* ------------------------------------------------------------------ */
  var pressInit = { RW: [15, 8.5], LW: [4, 12], PIV: [9, 6], DEF: [10, 19],
                    O1: [6, 14], O2: [13.5, 13.5], O3: [8.5, 4.2], O4: [13.5, 6], ball: 'RW' };
  var pressStart = [
    { d: 1.4, t: 'We attack high',
      x: '{RW} carries the ball near the opponent’s box.',
      m: { RW: [14.6, 7], O4: [13.4, 5.4, 0.2, 1] } },
    { d: 1.3, t: 'Ball lost high',
      x: 'Lost close to their goal, and {PIV} and {RW} are both near the ball. Both conditions are met.',
      ball: { pass: ['RW', 'O3'], at: [0.1, 0.5] },
      m: { O3: [11, 5, 0, 0.5] }, tags: { RW: 'Lost' }, cond: [true, true] }
  ];
  function pressJump(defTarget) {
    return { d: 1.6, t: 'PRESS! The two nearest go together',
      x: '{PIV} and {RW} close the carrier together. {LW} cuts the pass to the left, {DEF} covers behind.',
      shout: { who: 'PIV', text: 'PRESS!' },
      m: { O3: [11.3, 6.4], PIV: [10, 7.9, 0.1, 1], RW: [12.8, 7.6, 0.1, 1], LW: [7.8, 10.6, 0.1, 1], DEF: defTarget },
      tags: { LW: 'Cuts the lane', DEF: 'Covers' } };
  }
  var pressBeatenSteps = [
    { d: 1.5, t: 'The press is beaten',
      x: 'The pass escapes the first two players. Chasing now would leave us four against nobody behind.',
      ball: { pass: ['O3', 'O2'], at: [0.1, 0.5] },
      m: { O2: [13.6, 14.2, 0, 0.5] }, tags: { PIV: 'Beaten', RW: 'Beaten' }, cond: null },
    { d: 2.4, t: 'STOP chasing. DROP together',
      x: '{DEF} calls it and backs off in front of the ball. The others sprint back goal-side, no more chasing.',
      shout: { who: 'DEF', text: 'DROP!' }, call: 'No half-pressing: press together or drop together.',
      m: { O2: [13, 19.5, 0.1, 1], DEF: [12.4, 23.2], LW: [8.5, 19.5], PIV: [10, 17], RW: [14.8, 14.5],
           O1: [5, 19, 0.2, 1], O3: [10.5, 11.5, 0.2, 1], O4: [16, 12.5, 0.2, 1] },
      tags: { DEF: 'Delays' } },
    { d: 2.2, t: '2-2 block set',
      x: 'Front pair {LW} and {RW}, back pair {DEF} and {PIV}. Positions, not names.',
      m: { O2: [12.5, 22], LW: [8.5, 25.5], RW: [14, 25.5], DEF: [9, 30], PIV: [12.6, 30],
           O1: [5, 23], O3: [10, 16], O4: [16, 18.5] },
      shape: true }
  ];

  var pressWin = {
    id: 'A', label: 'Lost high + 2 close · PRESS',
    call: 'High loss and two players close: PRESS!',
    rule: 'No half-pressing: press together or drop together.',
    situation: 'We attack high and lose the ball near their goal, with two players close to it.',
    players: {
      DEF: 'Steps up behind the press to mark the outlet. Last player: protects the middle and the depth.',
      LW: 'Cuts the pass to the left side. Does not press the ball.',
      RW: 'Lost the ball: second presser, closes from the outside.',
      PIV: 'Nearest player: calls PRESS! and closes the carrier.'
    },
    ballPath: 'Right Winger loses it → trapped by two players → ball won → shot.',
    decision: 'Both conditions met: press immediately, two on the ball, two covering.',
    mistake: 'Only one player presses while the others watch: the opponent plays through easily.',
    init: pressInit,
    steps: pressStart.concat([
      pressJump([12.6, 15.6, 0.1, 1]),
      { d: 1.3, t: 'Trapped: ball won back',
        x: 'No way out for the carrier. {PIV} wins it back high up the pitch.',
        ball: { pass: ['O3', 'PIV'], at: [0.25, 0.45] },
        m: { PIV: [10.3, 7.2, 0.3, 0.8], O3: [11.6, 5.6, 0.4, 1] }, tags: { PIV: 'Won' }, cond: null },
      { d: 1.3, t: 'Finish fast',
        x: 'Won close to goal: shoot before they reorganise.',
        ball: { shot: [9, 0.2], at: [0.4, 0.8] },
        m: { PIV: [9.6, 6, 0, 0.4] } }
    ])
  };
  var pressBeaten = {
    id: 'B', label: 'Press beaten · DROP',
    call: 'No half-pressing: press together or drop together.',
    rule: 'No half-pressing: press together or drop together.',
    situation: 'Same high loss, same press, but the opponent escapes with a pass.',
    players: {
      DEF: 'Sees the press is beaten: calls DROP! and delays the carrier.',
      LW: 'Stops chasing, sprints back to the front pair.',
      RW: 'Stops chasing, recovers goal-side to the front pair.',
      PIV: 'Stops chasing, recovers to the back pair.'
    },
    ballPath: 'Right Winger loses it → press → pass escapes → carrier drives forward.',
    decision: 'Once the first line is beaten, stop chasing and rebuild the 2-2.',
    mistake: 'Chasing the ball in a disorganised way after the press is beaten.',
    init: pressInit,
    steps: pressStart.concat([pressJump([11.5, 18, 0.1, 1])], pressBeatenSteps)
  };
  var pressAlone = {
    id: 'C', label: 'Only one close · DROP',
    call: 'Otherwise, DROP!',
    rule: 'No half-pressing: press together or drop together.',
    situation: 'Lost high again, but this time only {RW} is close to the ball.',
    players: {
      DEF: 'Calls DROP!, then delays the carrier from in front.',
      LW: 'Sprints back to the back pair.',
      RW: 'Alone near the ball: does not dive in, chases back and closes from behind.',
      PIV: 'Sprints back to the front pair.'
    },
    ballPath: 'Right Winger loses it → carrier drives through midfield.',
    decision: 'One condition is missing, so we drop. One player alone cannot win it back.',
    mistake: 'The player who lost it dives in alone and gets beaten: the opponent is now 4 against 3.',
    init: { RW: [15, 8.5], LW: [3.5, 15], PIV: [6, 12], DEF: [10, 22],
            O1: [7, 16.5], O2: [12.5, 15], O3: [9, 5], O4: [13.5, 6], ball: 'RW' },
    steps: [
      pressStart[0],
      { d: 1.4, t: 'Ball lost: only one of us is close',
        x: 'Lost high, yes. But only {RW} is near the ball. One condition is missing.',
        ball: { pass: ['RW', 'O4'], at: [0.1, 0.4] },
        m: { O4: [13.8, 5.8, 0, 0.4] }, tags: { RW: 'Alone' }, cond: [true, false] },
      { d: 2.4, t: 'DROP! Recover goal-side',
        x: '{DEF} calls it and holds in front of the carrier. The others sprint back. {RW} chases from behind.',
        shout: { who: 'DEF', text: 'DROP!' },
        m: { O4: [12.5, 14, 0.1, 1], DEF: [12, 18.5], PIV: [8.5, 19.5], LW: [7, 22.5], RW: [15, 13],
             O1: [5, 19, 0.2, 1], O2: [15.5, 17, 0.1, 0.8], O3: [10, 10, 0.2, 1] },
        tags: { DEF: 'Delays' }, cond: null },
      { d: 2.2, t: '2-2 compact',
        x: 'Front pair {PIV} and {RW}, back pair {LW} and {DEF}. Now we defend together.',
        m: { O4: [12, 18.5], PIV: [8.8, 22.6], RW: [13.4, 22.6], LW: [8.4, 27.3], DEF: [12.6, 27.3],
             O1: [4.5, 22], O2: [16, 20.5], O3: [9.5, 14] },
        shape: true }
    ]
  };
  var press = {
    id: 'press', num: '06', nav: 'Pressing',
    kicker: 'Pressing triggers',
    title: 'Press only when it’s winnable',
    system: 'Press 2 + cover 2, or drop to 2-2',
    format: '4v4 training drill · no goalkeeper',
    quote: QUOTES.q7,
    variants: [pressWin, pressBeaten, pressAlone]
  };

  /* ------------------------------------------------------------------ */
  /* 07 — Fast transition                                                 */
  /* ------------------------------------------------------------------ */
  var counter = {
    id: 'counter', num: '07', nav: 'Fast break',
    kicker: 'Transition defence → attack',
    title: 'Win it, secure it, GO!',
    system: '2-2 block → fast attack',
    format: '4v4 training drill · no goalkeeper',
    quote: QUOTES.q5,
    call: 'GO if the space is open.',
    rule: 'Safety first. Then we speed up if the space is open.',
    situation: 'We defend in our 2-2. The opponent attacks with three players high and only one behind.',
    players: {
      DEF: 'Receives the safe first pass, sees the open space and calls GO!. Plays the pivot.',
      LW: 'Wins the ball, plays safe, then sprints wide and keeps the width.',
      RW: 'Sprints up the right, then cuts into the space behind the last defender.',
      PIV: 'Sprints forward, comes short to receive and lays it off first time.'
    },
    ballPath: 'Left Winger wins it → Defender (safe) → Pivot → one touch to the Right Winger → shot.',
    decision: 'Opponent unbalanced, space behind them: attack fast and finish in 2–3 passes. If the space closes, recycle and build.',
    mistake: 'Forcing the first pass forward into traffic, or everybody running without the ball and nobody keeping the width.',
    init: { LW: [7.5, 26], PIV: [12.5, 25.5], DEF: [8.5, 31], RW: [13, 31],
            O1: [5.5, 22.5], O2: [9, 20.5], O3: [15, 22.5], O4: [10, 15], ball: 'O1' },
    shape: true,
    steps: [
      { d: 1.5, t: 'Ball won',
        x: '{LW} wins the ball from the carrier. The opponent has three players in front of the ball.',
        ball: { pass: ['O1', 'LW'], at: [0.45, 0.65] },
        m: { O1: [6, 24, 0, 0.5], LW: [6.8, 25.6, 0, 0.5] }, tags: { LW: 'Won' } },
      { d: 1.4, t: 'First pass: safe',
        x: 'A short, safe pass to {DEF}. Secure the ball before anything else.',
        call: 'First pass safe.',
        ball: { pass: ['LW', 'DEF'], at: [0.1, 0.55] },
        m: { DEF: [9.5, 29.5, 0, 0.55], O1: [4.5, 22.5] }, shape: false },
      { d: 1.7, t: 'GO! The space is open',
        x: '{DEF} sees the space behind them and calls GO!. Everyone sprints forward: two wide, {PIV} in the middle.',
        shout: { who: 'DEF', text: 'GO!' },
        m: { DEF: [10, 26], PIV: [11, 16.5, 0, 0.85], RW: [17, 20], LW: [4, 17],
             O4: [9.5, 12, 0.1, 1], O1: [6.5, 21.5, 0.35, 1], O2: [8.5, 19, 0.2, 1], O3: [15, 21, 0.3, 1] } },
      { d: 1.4, t: '{PIV} comes short and receives',
        x: '{PIV} drops towards the ball and drags the last defender with him.',
        ball: { pass: ['DEF', 'PIV'], at: [0.05, 0.5] },
        m: { PIV: [10.6, 17.6, 0, 0.6], O4: [9.3, 14.4, 0.2, 1], RW: [16.5, 18.5] } },
      { d: 1.6, t: 'One touch into {RW}’s run',
        x: '{RW} cuts into the space behind the defender. {PIV} lays it into his path first time. {LW} keeps the width.',
        ball: { pass: ['PIV', 'RW'], at: [0.3, 0.75] },
        m: { RW: [12.6, 10], LW: [3.5, 12], O4: [9.4, 15.2, 0, 0.5], O3: [15.2, 15.5, 0.2, 1] },
        zone: { x: 12.5, y: 10, r: 2.8, label: 'SPACE', from: 0 }, tags: { LW: 'Width', RW: 'Cuts in' } },
      { d: 1.3, t: 'Finish: three passes after the win',
        x: 'Safe pass, pass to the pivot, lay-off, shot. Fast and simple.',
        ball: { shot: [10.8, 0.2], at: [0.15, 0.6] },
        m: { RW: [12, 8.6], O4: [10.5, 11.5, 0.1, 1] } }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* 08 — Calm transition                                                 */
  /* ------------------------------------------------------------------ */
  var calm = {
    id: 'calm', num: '08', nav: 'Calm',
    kicker: 'Transition defence → attack',
    title: 'Win it, CALM, rebuild',
    system: '2-2 block → 1-2-1 build-up',
    format: '4v4 training drill · no goalkeeper',
    quote: QUOTES.q8,
    call: 'CALM if their block is set.',
    rule: 'Safety first. Then we speed up if the space is open.',
    situation: 'We win the ball, but the opponent is already running back into a compact block.',
    players: {
      DEF: 'Calls CALM!, receives the safe pass and becomes the relay to restart the build-up.',
      LW: 'Moves back to the left touchline to give width.',
      RW: 'Moves back to the right touchline, ready for the switch.',
      PIV: 'Wins the ball, plays safe, then goes back up to pin the defenders.'
    },
    ballPath: 'Pivot wins it → Defender → Left Winger → Defender → switch to the Right Winger.',
    decision: 'No space behind them: keep the ball, rebuild the 1-2-1 and move the block until it opens.',
    mistake: 'Forcing a fast attack into a set block and losing the ball again.',
    init: { LW: [7.5, 26], PIV: [12.5, 25.5], DEF: [8.5, 31], RW: [13, 31],
            O1: [6, 21.5], O2: [10.5, 22.5], O3: [14.5, 24], O4: [9, 16], ball: 'O3' },
    shape: true,
    steps: [
      { d: 1.4, t: 'Ball won',
        x: '{PIV} intercepts the pass.',
        ball: { pass: ['O3', 'PIV'], at: [0.1, 0.4] },
        m: { PIV: [12.3, 24.4, 0, 0.4] }, tags: { PIV: 'Won' } },
      { d: 2.4, t: 'CALM! Their block is set',
        x: 'The opponent is already back. {DEF} calls CALM!. First pass safe to him.',
        shout: { who: 'DEF', text: 'CALM!' }, call: 'First pass safe.',
        ball: { pass: ['PIV', 'DEF'], at: [0.1, 0.5] },
        m: { DEF: [10, 29.5, 0, 0.5], O1: [7.5, 16, 0.2, 1], O2: [12.5, 16.5, 0.2, 1], O3: [12.5, 9.5, 0.2, 1], O4: [8, 9.5, 0.2, 1] },
        shape: false },
      { d: 2.2, t: '{DEF} is the relay: rebuild the 1-2-1',
        x: 'The others take their positions again: two wide, {PIV} high.',
        m: { DEF: [10, 27], LW: [3, 20], RW: [17, 21], PIV: [9.5, 11] }, shape: true },
      { d: 1.8, t: 'Circulate: {DEF} to {LW}',
        x: 'Move the ball to move the block.',
        ball: { pass: ['DEF', 'LW'], at: [0.05, 0.5] },
        m: { LW: [3, 19, 0, 0.5], O1: [5.5, 16.5, 0.3, 1], O2: [9.5, 17, 0.3, 1], O3: [11, 9.5, 0.3, 1], O4: [6.5, 10, 0.3, 1], DEF: [9, 26, 0.4, 1] } },
      { d: 1.6, t: 'Back through {DEF}',
        x: 'The block has slid left. Back to the relay.',
        ball: { pass: ['LW', 'DEF'], at: [0.1, 0.55] },
        m: { DEF: [9.5, 25.5], O1: [5, 17], O2: [9, 18.5, 0.4, 1] } },
      { d: 1.8, t: 'Switch: {RW} has space',
        x: 'The ball changes side faster than the block. Now we relaunch our attack.',
        ball: { pass: ['DEF', 'RW'], at: [0.1, 0.55] },
        m: { RW: [17, 18.5, 0, 0.6], O2: [12.5, 17, 0.45, 1], O1: [8, 17, 0.45, 1], O3: [12.5, 10, 0.45, 1], O4: [8, 9.5, 0.45, 1] },
        zone: { x: 16, y: 15, r: 3, label: 'SPACE', from: 0.4 } }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* 09 — Full cycle                                                      */
  /* ------------------------------------------------------------------ */
  var cycleFull = {
    id: 'A', label: 'Full cycle',
    call: 'We defend together, we attack together.',
    situation: 'A complete sequence: build, lose it, drop, win it, attack.',
    players: {
      DEF: 'Builds, calls DROP! and delays, then calls GO! after the recovery.',
      LW: 'Width in the build-up, back pair in defence, finisher on the break.',
      RW: 'Loses the ball, recovers to the front pair, wins it back.',
      PIV: 'Recovers past the ball, then comes short and lays it off on the break.'
    },
    ballPath: 'Defender → Right Winger → lost → won by the Right Winger → Defender → Pivot → Left Winger → shot.',
    decision: 'Every phase has its decision: build wide, drop on the loss, secure the win, GO if the space is open.',
    mistake: 'Switching off between phases: one player still attacking while the team defends, or still defending while we attack.',
    init: { DEF: [10, 28], LW: [2.5, 20], RW: [17.5, 20], PIV: [10, 10.5],
            O1: [8, 18], O2: [12, 18], O3: [8, 8.5], O4: [12.5, 8.5], ball: 'DEF' },
    shape: true,
    steps: [
      { d: 1.6, t: 'BUILD: {DEF} steps up',
        x: 'Our 1-2-1. {DEF} draws the first opponent.',
        m: { DEF: [10, 24], O1: [9, 21, 0.3, 1], O2: [12.5, 19.5, 0.3, 1] } },
      { d: 1.8, t: 'BUILD: pass to {RW}',
        x: 'The ball goes wide right.',
        ball: { pass: ['DEF', 'RW'], at: [0.05, 0.5] },
        m: { RW: [17.5, 18.5, 0, 0.5], O2: [14.8, 17.3, 0.3, 1], O1: [11.5, 19.5, 0.35, 1], DEF: [11, 24.5, 0.4, 1],
             O4: [13.5, 9.5, 0.3, 1], O3: [9.5, 8.5, 0.3, 1] } },
      { d: 1.4, t: 'LOSS: pass intercepted',
        x: 'The pass inside is cut out at halfway. Not high, not winnable.',
        ball: { pass: ['RW', 'O1'], at: [0.1, 0.45] },
        m: { O1: [13, 20.5, 0, 0.45] }, tags: { RW: 'Lost' }, cond: [false, false] },
      { d: 2.4, t: 'DROP! Everyone sprints back',
        x: '{DEF} calls it and delays the carrier. Nobody stands still, {RW} included.',
        shout: { who: 'DEF', text: 'DROP!' }, call: 'Otherwise, DROP!',
        m: { O1: [11.5, 24.5, 0.1, 1], DEF: [10.8, 28.8], RW: [14.5, 26], LW: [7.5, 26], PIV: [8.8, 21.5],
             O2: [16, 22.5, 0.2, 1], O3: [6.5, 16.5, 0.2, 1], O4: [13, 16, 0.2, 1] },
        cond: null, shape: false },
      { d: 2.2, t: '2-2 COMPACT',
        x: 'Front pair {PIV} and {RW}, back pair {LW} and {DEF}.',
        m: { O1: [11, 26], PIV: [8, 28], LW: [8.5, 32.5], DEF: [12.6, 32.5], RW: [13.4, 28.2],
             O2: [16.5, 26], O3: [5.5, 22.5], O4: [12.5, 19.5] },
        shape: true },
      { d: 1.4, t: 'RECOVERY: ball won',
        x: 'The pass wide is read. {RW} intercepts.',
        ball: { pass: ['O1', 'RW'], at: [0.15, 0.45] },
        m: { RW: [14.4, 27.4, 0, 0.45] }, tags: { RW: 'Won' } },
      { d: 1.8, t: 'GO! First pass safe, then sprint',
        x: 'Two opponents are caught high. {DEF} calls GO!. Safe pass to him, everyone else sprints forward.',
        shout: { who: 'DEF', text: 'GO!' }, call: 'First pass safe.',
        ball: { pass: ['RW', 'DEF'], at: [0.05, 0.45] },
        m: { DEF: [12, 30, 0, 0.45], PIV: [9, 17.5, 0.2, 1], LW: [3.5, 19, 0.2, 1], RW: [16.8, 21, 0.4, 1],
             O1: [9.2, 24.5, 0.2, 1], O2: [16.5, 24.5, 0.3, 1], O3: [6, 20, 0.2, 1], O4: [11.5, 15.5, 0.2, 1] },
        shape: false },
      { d: 1.4, t: '{PIV} comes short',
        x: '{PIV} drops to receive. The last defender follows him.',
        ball: { pass: ['DEF', 'PIV'], at: [0.05, 0.55] },
        m: { PIV: [9.5, 19.2, 0, 0.6], O4: [10.2, 16.8, 0.2, 1], RW: [16.5, 15] } },
      { d: 1.6, t: 'Lay-off into {LW}’s run',
        x: '{LW} attacks the space behind the defender. {RW} keeps the width.',
        ball: { pass: ['PIV', 'LW'], at: [0.3, 0.75] },
        m: { LW: [8.2, 10], O3: [7, 15, 0.2, 1], RW: [16.5, 13] },
        tags: { LW: 'Attacks the middle', RW: 'Width' } },
      { d: 1.3, t: 'FINISH',
        x: 'From defence to goal in four passes.',
        ball: { shot: [9.4, 0.2], at: [0.15, 0.55] },
        m: { LW: [8.6, 8.8], O4: [9.5, 13.5, 0.1, 1] } }
    ]
  };
  var cycleFail = {
    id: 'B', label: 'Press fails → drop → CALM',
    call: 'No half-pressing: press together or drop together.',
    situation: 'We lose the ball high and press, but the press is beaten.',
    players: {
      DEF: 'Covers the press, calls DROP! when it is beaten, then CALM! after the recovery.',
      LW: 'Cuts the lane during the press, then recovers to the front pair.',
      RW: 'Presses, recovers, then wins the ball back.',
      PIV: 'Presses, recovers to the back pair, then goes back up to pin the defenders.'
    },
    ballPath: 'Lost high → press → beaten → drop → won by the Right Winger → Defender → switch.',
    decision: 'When the press fails, drop together. After the win, their block is set: CALM and rebuild.',
    mistake: 'Continuing to chase after the press is beaten, then forcing a fast attack into a set block.',
    init: pressInit,
    steps: pressStart.concat([pressJump([11.5, 18, 0.1, 1])], clone(pressBeatenSteps), [
      { d: 1.5, t: 'RECOVERY: ball won',
        x: 'The carrier runs into our block. {RW} wins it.',
        ball: { pass: ['O2', 'RW'], at: [0.45, 0.65] },
        m: { O2: [12.8, 23.5, 0, 0.5], RW: [13.6, 24.8, 0, 0.5] }, tags: { RW: 'Won' } },
      { d: 2.4, t: 'CALM! Their block is back',
        x: 'The opponent is already running back. {DEF} calls CALM!. Safe pass to him.',
        shout: { who: 'DEF', text: 'CALM!' }, call: 'GO if the space is open, CALM if their block is set.',
        ball: { pass: ['RW', 'DEF'], at: [0.1, 0.5] },
        m: { DEF: [10.5, 29, 0, 0.5], O1: [7.5, 16, 0.2, 1], O2: [12.5, 16.5, 0.2, 1], O3: [8, 9.5, 0.2, 1], O4: [12.5, 9.5, 0.2, 1] },
        shape: false },
      { d: 2.8, t: 'Rebuild the 1-2-1',
        x: '{DEF} is the relay. The others go back to their attacking positions.',
        m: { DEF: [10, 27], LW: [3, 20], RW: [17, 20], PIV: [10, 11] }, shape: true },
      { d: 1.8, t: 'Switch and relaunch',
        x: 'Move the block, find the space, attack again.',
        ball: { pass: ['DEF', 'RW'], at: [0.1, 0.55] },
        m: { RW: [17, 18.5, 0, 0.6], O2: [14.5, 16.5, 0.35, 1], O1: [10, 17, 0.35, 1] },
        zone: { x: 16.5, y: 14.5, r: 2.6, label: 'SPACE', from: 0.4 } }
    ])
  };
  var cycle = {
    id: 'cycle', num: '09', nav: 'Full cycle',
    kicker: 'Attack → defence → attack',
    title: 'The full cycle',
    system: '1-2-1 → 2-2 → 1-2-1',
    format: '4v4 training drill · no goalkeeper',
    quote: QUOTES.q3,
    variants: [cycleFull, cycleFail]
  };

  root.FCScenes = {
    ROLES: ROLES,
    QUOTES: QUOTES,
    COACH_CALLS: COACH_CALLS,
    list: [identity, attack, pivot, recover, press, counter, calm, cycle]
  };
})(typeof window !== 'undefined' ? window : globalThis);
