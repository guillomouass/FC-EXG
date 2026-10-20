#!/usr/bin/env node
/* Quality check for every tactical sequence.
 * Run:  node tools/check-scenes.js
 * - every scene builds (valid players, passes start from the ball carrier)
 * - no collisions: teammates stay >= 1.4 m apart, any two players >= 1.0 m
 * - everybody stays on the pitch
 * - our passes and shots are not played through an opponent
 */
'use strict';
const path = require('path');
require(path.join(__dirname, '..', 'js', 'engine.js'));
require(path.join(__dirname, '..', 'js', 'scenes.js'));
const E = globalThis.FCEngine;
const S = globalThis.FCScenes;

const TEAMMATE_MIN = 1.4, ANY_MIN = 1.0, LANE_MIN = 1.1, NEAR_END = 2.2;
const side = id => (E.teamOf(id) === 'A' || E.teamOf(id) === 'K') ? 'A' : 'B';
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function segDist(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const L = vx * vx + vy * vy;
  let k = L ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L : 0;
  k = Math.max(0, Math.min(1, k));
  return dist(p, [a[0] + vx * k, a[1] + vy * k]);
}

const problems = [];
let checked = 0;
for (const scene of S.list) {
  const variants = scene.variants ? scene.variants.map(v => Object.assign({}, scene, v, { id: scene.id + ':' + v.id })) : [scene];
  for (const sc of variants) {
    let tl;
    try { tl = E.build(sc); } catch (e) { problems.push(`${sc.id}: BUILD ERROR ${e.message}`); continue; }
    checked++;
    const seen = new Set();
    const report = (key, msg) => { if (!seen.has(key)) { seen.add(key); problems.push(msg); } };

    for (let t = 0; t <= tl.total + 1e-9; t += 0.04) {
      const s = E.sample(tl, t);
      const ids = tl.ids;
      for (let i = 0; i < ids.length; i++) {
        const a = ids[i], pa = s.pos[a];
        if (pa[0] < 0.5 || pa[0] > 19.5 || pa[1] < 0.5 || pa[1] > 39.5)
          report(`b${a}${s.i}`, `${sc.id} step ${s.i + 1}: ${a} off the pitch at (${pa.map(v => v.toFixed(1))})`);
        for (let j = i + 1; j < ids.length; j++) {
          const b = ids[j], d = dist(pa, s.pos[b]);
          const min = side(a) === side(b) ? TEAMMATE_MIN : ANY_MIN;
          if (d < min) report(`c${a}${b}${s.i}`, `${sc.id} step ${s.i + 1} (p=${s.p.toFixed(2)}): ${a}–${b} only ${d.toFixed(2)} m apart`);
        }
      }
    }

    tl.steps.forEach((st, si) => {
      const a = st.act;
      if (!a || (a.type === 'pass' && a.turnover)) return;
      const shooter = a.from;
      const A = E.footAt(st, a.from, a.s);
      const B = a.type === 'pass' ? E.footAt(st, a.to, a.e) : a.to;
      const pm = (a.s + a.e) / 2;
      tl.ids.filter(id => side(id) !== side(shooter)).forEach(op => {
        if (op === 'OGK' && a.type === 'shot') return;
        const q = E.posAt(st, op, pm);
        if (dist(q, A) < NEAR_END || (a.type === 'pass' && dist(q, B) < NEAR_END)) return;
        const d = segDist(q, A, B);
        if (d < LANE_MIN) problems.push(`${sc.id} step ${si + 1}: ${a.type} ${a.from}→${a.type === 'pass' ? a.to : 'goal'} passes ${d.toFixed(2)} m from ${op}`);
      });
    });
  }
}

console.log(`Checked ${checked} sequences.`);
if (problems.length) {
  console.log(`${problems.length} problem(s):`);
  problems.forEach(p => console.log('  - ' + p));
  process.exit(1);
} else {
  console.log('All sequences pass: no collisions, everyone on the pitch, passing lanes clear.');
}
