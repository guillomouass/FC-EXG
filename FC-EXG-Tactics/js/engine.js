/* FC EXG Tactical Board — animation engine.
 * Pure functions: turns a scene (initial positions + numbered steps) into a
 * timeline, then samples player and ball positions at any time t (seconds).
 * Pitch units are metres: x 0→20 (left→right), y 0→40 (opponent goal at the
 * top, our goal at the bottom). Works in the browser and in Node (for tests).
 */
(function (root) {
  'use strict';

  function teamOf(id) {
    if (id === 'GK') return 'K';
    if (id === 'OGK') return 'OK';
    return id.charAt(0) === 'O' ? 'B' : 'A';
  }
  // Ball sits just in front of the carrier, towards the goal his team attacks.
  function ballOffset(id) {
    var t = teamOf(id);
    return (t === 'A' || t === 'K') ? -0.95 : 0.95;
  }
  function sameSide(a, b) {
    var ta = teamOf(a), tb = teamOf(b);
    var side = function (t) { return (t === 'A' || t === 'K') ? 'A' : 'B'; };
    return side(ta) === side(tb);
  }

  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; };
  var easeOut = function (p) { return 1 - (1 - p) * (1 - p); };
  var lerp = function (a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
  var clone = function (o) { var r = {}; for (var k in o) r[k] = o[k].slice(); return r; };

  function build(scene) {
    var init = scene.init;
    var ids = Object.keys(init).filter(function (k) { return k !== 'ball'; });
    var pos = {};
    ids.forEach(function (id) { pos[id] = init[id].slice(0, 2); });
    var owner = typeof init.ball === 'string' ? init.ball : null;
    var point = Array.isArray(init.ball) ? init.ball.slice() : null;
    var shape = !!scene.shape, links = scene.links || [], cond = scene.cond || null;
    var t = 0, steps = [];

    scene.steps.forEach(function (s, idx) {
      var start = clone(pos), end = clone(pos), moves = {};
      var m = s.m || {};
      Object.keys(m).forEach(function (id) {
        if (!(id in pos)) throw new Error(scene.id + ' step ' + (idx + 1) + ': unknown player ' + id);
        var v = m[id];
        end[id] = [v[0], v[1]];
        moves[id] = [v[2] == null ? 0 : v[2], v[3] == null ? 1 : v[3]];
      });

      var act = null, ownerBefore = owner, pointBefore = point;
      var b = s.ball;
      if (b && b.pass) {
        var from = b.pass[0], to = b.pass[1];
        if (from !== owner) throw new Error(scene.id + ' step ' + (idx + 1) + ': ' + from + ' passes but ball is with ' + owner);
        if (!(to in pos)) throw new Error(scene.id + ' step ' + (idx + 1) + ': unknown receiver ' + to);
        act = { type: 'pass', from: from, to: to, s: b.at ? b.at[0] : 0.1, e: b.at ? b.at[1] : 0.6,
                turnover: !sameSide(from, to) };
        owner = to; point = null;
      } else if (b && b.shot) {
        if (!owner) throw new Error(scene.id + ' step ' + (idx + 1) + ': shot without a carrier');
        act = { type: 'shot', from: owner, to: b.shot.slice(), s: b.at ? b.at[0] : 0.1, e: b.at ? b.at[1] : 0.5,
                goal: b.goal !== false };
        owner = null; point = b.shot.slice();
      }

      // Goalkeepers (5v5 variants) follow the ball laterally unless scripted.
      if (scene.gk) {
        var bEnd = owner ? end[owner] : point;
        if (bEnd) {
          if ('GK' in pos && !m.GK) {
            end.GK = [10 + (bEnd[0] - 10) * 0.28, bEnd[1] > 20 ? 38.1 : 37.2];
            moves.GK = [0.1, 1];
          }
          if ('OGK' in pos && !m.OGK) {
            end.OGK = [10 + (bEnd[0] - 10) * 0.28, bEnd[1] < 20 ? 1.9 : 2.8];
            moves.OGK = [0.1, 1];
          }
        }
      }

      if ('shape' in s) shape = !!s.shape;
      if ('links' in s) links = s.links || [];
      if ('cond' in s) cond = s.cond;

      steps.push({
        index: idx, src: s, t0: t, d: s.d, start: start, end: end, moves: moves, act: act,
        ownerBefore: ownerBefore, pointBefore: pointBefore, ownerAfter: owner, pointAfter: point,
        shape: shape, links: links, cond: cond
      });
      pos = end; t += s.d;
    });
    return { scene: scene, ids: ids, steps: steps, total: t };
  }

  function posAt(st, id, p) {
    var mv = st.moves[id];
    if (!mv) return st.start[id];
    var k = ease(clamp01((p - mv[0]) / Math.max(1e-6, mv[1] - mv[0])));
    return lerp(st.start[id], st.end[id], k);
  }
  function footAt(st, id, p) {
    var q = posAt(st, id, p);
    return [q[0], q[1] + ballOffset(id)];
  }
  // Who has the ball at progress p of a step (null while it travels / after a shot).
  function holderAt(st, p) {
    var a = st.act;
    if (!a) return st.ownerBefore;
    if (p <= a.s) return a.from;
    if (p >= a.e) return a.type === 'pass' ? a.to : null;
    return null;
  }
  function ballAt(st, p) {
    var a = st.act;
    if (!a) return st.ownerBefore ? footAt(st, st.ownerBefore, p) : st.pointBefore;
    if (p <= a.s) return footAt(st, a.from, p);
    if (p >= a.e) return a.type === 'pass' ? footAt(st, a.to, p) : a.to;
    var k = (p - a.s) / (a.e - a.s);
    var A = footAt(st, a.from, a.s);
    var B = a.type === 'pass' ? footAt(st, a.to, p) : a.to;
    return lerp(A, B, easeOut(k));
  }

  function stepIndexAt(tl, t) {
    var steps = tl.steps;
    for (var i = 0; i < steps.length; i++) {
      if (t < steps[i].t0 + steps[i].d) return i;
    }
    return steps.length - 1;
  }

  function sample(tl, t) {
    t = Math.max(0, Math.min(tl.total, t));
    var i = stepIndexAt(tl, t);
    var st = tl.steps[i];
    var p = clamp01((t - st.t0) / st.d);
    var pos = {};
    tl.ids.forEach(function (id) { pos[id] = posAt(st, id, p); });
    return { t: t, i: i, p: p, st: st, pos: pos, ball: ballAt(st, p), holder: holderAt(st, p) };
  }

  root.FCEngine = {
    build: build, sample: sample, posAt: posAt, footAt: footAt, ballAt: ballAt, holderAt: holderAt,
    teamOf: teamOf, ballOffset: ballOffset, sameSide: sameSide, ease: ease, stepIndexAt: stepIndexAt
  };
})(typeof window !== 'undefined' ? window : globalThis);
