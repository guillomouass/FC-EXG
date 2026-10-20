/* FC EXG Tactical Board — interface: screens, pitch rendering, playback controls. */
(function () {
  'use strict';
  var E = window.FCEngine, S = window.FCScenes;
  var NS = 'http://www.w3.org/2000/svg';
  var U = 10; // SVG units per metre
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- Names ---------------- */
  var STORE_KEY = 'fcexg-names-v1';
  var names = {};
  function defaultNames() { var r = {}; Object.keys(S.ROLES).forEach(function (k) { r[k] = S.ROLES[k].name; }); return r; }
  function loadNames() {
    names = defaultNames();
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      Object.keys(saved).forEach(function (k) { if (saved[k] && names[k] !== undefined) names[k] = String(saved[k]).slice(0, 18); });
    } catch (e) { /* storage unavailable: keep defaults */ }
  }
  function saveNames() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(names)); } catch (e) { /* ignore */ }
  }
  function tpl(str) {
    return String(str || '').replace(/\{(\w+)\}/g, function (m, id) { return names[id] || m; });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------------- Screens ---------------- */
  var SCREENS = [{ key: 'home', nav: 'Home' }]
    .concat(S.list.map(function (sc) { return { key: sc.id, nav: sc.nav, scene: sc }; }))
    .concat([{ key: 'final', nav: 'Final words' }]);

  var state = {
    screen: -1, variant: 0, cur: null, tl: null, t: 0, playing: false, speed: 1,
    stepMode: false, playUntil: null, freeze: false, arrows: true, labels: true,
    drag: {}, lastStep: -1, lastShotStep: -1, dirty: true, panel: true
  };
  var variantMemory = {};

  function buildNav() {
    var nav = $('nav');
    nav.innerHTML = '';
    SCREENS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.go = i;
      b.innerHTML = '<b>' + String(i + 1).padStart(2, '0') + '</b>' + esc(s.nav);
      nav.appendChild(b);
    });
    var ag = $('agenda');
    ag.innerHTML = '';
    S.list.forEach(function (sc, i) {
      var li = document.createElement('li');
      li.innerHTML = '<button type="button" data-go="' + (i + 1) + '"><span class="n">' + sc.num + '</span>' +
        '<span class="t">' + esc(sc.nav) + '</span><span class="s">' + esc(sc.title) + '</span></button>';
      ag.appendChild(li);
    });
    var pr = $('principles');
    pr.innerHTML = S.COACH_CALLS.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
  }

  function setScreen(i, opts) {
    opts = opts || {};
    i = Math.max(0, Math.min(SCREENS.length - 1, i));
    var s = SCREENS[i];
    var changed = i !== state.screen;
    state.screen = i;
    Array.prototype.forEach.call($('nav').children, function (b, k) { b.classList.toggle('on', k === i); });
    var active = $('nav').children[i];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    $('screen-home').hidden = s.key !== 'home';
    $('screen-final').hidden = s.key !== 'final';
    $('screen-board').hidden = !s.scene;
    try { history.replaceState(null, '', '#' + s.key); } catch (e) { /* ignore */ }

    if (s.scene) {
      var v = variantMemory[s.key] || 0;
      loadScene(s.scene, v, false);
      if (changed && opts.quote !== false && s.scene.quote) {
        showQuote(s.scene.quote, function () { play(); });
      } else {
        play();
      }
    } else {
      pause();
      if (changed) window.scrollTo(0, 0);
      var scr = s.key === 'home' ? $('screen-home') : $('screen-final');
      scr.scrollTop = 0;
    }
  }

  /* ---------------- Quote interstitial ---------------- */
  var quoteTimer = null, quoteDone = null;
  function showQuote(text, done) {
    var ov = $('quoteOverlay');
    $('quoteText').textContent = text;
    ov.classList.remove('out');
    ov.hidden = false;
    quoteDone = done;
    clearTimeout(quoteTimer);
    quoteTimer = setTimeout(hideQuote, 2600);
  }
  function hideQuote() {
    var ov = $('quoteOverlay');
    if (ov.hidden) return;
    clearTimeout(quoteTimer);
    ov.classList.add('out');
    setTimeout(function () { ov.hidden = true; ov.classList.remove('out'); }, 380);
    var d = quoteDone; quoteDone = null;
    if (d) d();
  }

  /* ---------------- Scene loading ---------------- */
  function loadScene(scene, vIndex) {
    var variants = scene.variants || null;
    vIndex = variants ? Math.min(vIndex, variants.length - 1) : 0;
    state.variant = vIndex;
    variantMemory[scene.id] = vIndex;
    var cur = variants ? Object.assign({}, scene, variants[vIndex]) : scene;
    state.cur = cur;
    state.tl = E.build(cur);
    state.t = 0;
    state.playUntil = null;
    state.drag = {};
    setFreeze(false);
    state.lastStep = -1;
    state.lastShotStep = -1;

    // Variant buttons
    var vb = $('variants');
    vb.innerHTML = '';
    if (variants) {
      variants.forEach(function (v, k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', k === vIndex ? 'true' : 'false');
        b.className = k === vIndex ? 'on' : '';
        b.textContent = v.label;
        b.addEventListener('click', function () { loadScene(scene, k); play(); });
        vb.appendChild(b);
      });
    }
    buildPlayers();
    renderPanel();
    buildTicks();
    state.dirty = true;
    render();
  }

  /* ---------------- Panel ---------------- */
  function renderPanel() {
    var c = state.cur;
    $('pKicker').textContent = c.num + ' · ' + c.kicker;
    $('pTitle').textContent = c.title;
    $('pChips').innerHTML = '<span class="sys">' + esc(c.system) + '</span><span>' + esc(c.format) + '</span>' +
      (c.label ? '<span>' + esc(c.label) + '</span>' : '');
    $('pSituation').textContent = tpl(c.situation);
    $('pDecision').textContent = tpl(c.decision);
    $('pMistake').textContent = tpl(c.mistake);
    $('pBall').textContent = tpl(c.ballPath);
    var roles = ['DEF', 'LW', 'RW', 'PIV', 'GK'].filter(function (r) { return c.players && c.players[r]; });
    $('pRoles').innerHTML = roles.map(function (r) {
      var role = S.ROLES[r];
      var nm = names[r] !== role.name ? '<b>' + esc(names[r]) + '</b> — ' : '';
      return '<dt><span class="' + (r === 'GK' ? 'k' : '') + '">' + role.code + '</span></dt><dd>' + nm + esc(tpl(c.players[r])) + '</dd>';
    }).join('');
    var notes = $('pNotes');
    if (c.notes && c.notes.length) {
      notes.hidden = false;
      notes.innerHTML = c.notes.map(function (n) { return '<li>' + esc(tpl(n)) + '</li>'; }).join('');
    } else { notes.hidden = true; notes.innerHTML = ''; }
    var ol = $('pSteps');
    ol.innerHTML = '';
    state.tl.steps.forEach(function (st, k) {
      var li = document.createElement('li');
      li.innerHTML = '<button type="button"><span class="st-t">' + esc(tpl(st.src.t)) + '</span><span class="st-x">' + esc(tpl(st.src.x)) + '</span></button>';
      li.firstChild.addEventListener('click', function () { playStep(k); });
      ol.appendChild(li);
    });
  }

  function updateStepUI(st) {
    var i = st.index;
    Array.prototype.forEach.call($('pSteps').children, function (li, k) {
      li.classList.toggle('cur', k === i);
      li.classList.toggle('done', k < i);
    });
    var cur = $('pSteps').children[i];
    var panel = $('panel');
    if (cur && panel && getComputedStyle(panel).overflowY === 'auto') {
      var top = cur.offsetTop - panel.offsetTop, bottom = top + cur.offsetHeight;
      if (top < panel.scrollTop || bottom > panel.scrollTop + panel.clientHeight) panel.scrollTo({ top: Math.max(0, top - 80), behavior: 'smooth' });
    }
    $('caption').innerHTML = '<b>' + (i + 1) + '/' + state.tl.steps.length + '</b><span>' + esc(tpl(st.src.t)) + '</span>';
    $('callText').textContent = tpl(st.src.call || state.cur.call || '');
    $('stepDetail').textContent = tpl(st.src.x);
    var rule = state.cur.rule;
    $('ruleText').hidden = !rule;
    $('ruleText').textContent = rule || '';
    renderCond(st.cond);
    Array.prototype.forEach.call($('ticks').children, function (tk, k) { tk.classList.toggle('done', k <= i); });
  }

  function renderCond(cond) {
    var box = $('condBox');
    if (!cond) { box.hidden = true; return; }
    var ok = cond[0] && cond[1];
    box.hidden = false;
    box.innerHTML = '<h4>Press now?</h4>' +
      '<div class="cond-row ' + (cond[0] ? 'yes' : 'no') + '"><i>' + (cond[0] ? '✓' : '✕') + '</i>Lost high, near their goal</div>' +
      '<div class="cond-row ' + (cond[1] ? 'yes' : 'no') + '"><i>' + (cond[1] ? '✓' : '✕') + '</i>Two of us close to the ball</div>' +
      '<div class="verdict ' + (ok ? 'press' : 'drop') + '">' + (ok ? 'PRESS!' : 'DROP!') + '</div>';
  }

  function buildTicks() {
    var tk = $('ticks');
    tk.innerHTML = '';
    state.tl.steps.forEach(function (st) {
      var s = document.createElement('span');
      s.style.left = (st.t0 / state.tl.total * 100) + '%';
      tk.appendChild(s);
    });
  }

  /* ---------------- SVG helpers ---------------- */
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  var svg, L = {};
  var R = 11; // marker radius (SVG units)
  // Pitch metres -> SVG units. Portrait: our goal at the bottom. Landscape: our goal on the left.
  function M(q) { return state.landscape ? [(40 - q[1]) * U, q[0] * U] : [q[0] * U, q[1] * U]; }
  function tr(q) { var m = M(q); return 'translate(' + m[0].toFixed(2) + ' ' + m[1].toFixed(2) + ')'; }

  function buildPitch() {
    svg = $('pitch');
    svg.innerHTML = '';
    var defs = el('defs', null, svg);
    [['a', 'arrowhead-a'], ['b', 'arrowhead-b'], ['k', 'arrowhead-k'], ['gold', 'arrowhead-gold'],
     ['red', 'arrowhead-red'], ['green', 'arrowhead-green'], ['silver', 'arrowhead-silver']].forEach(function (m) {
      var mk = el('marker', { id: 'ah-' + m[0], viewBox: '0 0 10 10', refX: '7', refY: '5', markerWidth: '7', markerHeight: '7',
        markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: m[1] }, mk);
    });

    var land = state.landscape;
    svg.setAttribute('viewBox', land ? '-24 -14 448 228' : '-14 -22 228 444');
    svg.setAttribute('aria-label', land ? 'Futsal pitch, our goal on the left' : 'Futsal pitch, our goal at the bottom');
    if (land) el('rect', { x: -24, y: -14, width: 448, height: 228, rx: 6, class: 'g-edge' }, svg);
    else el('rect', { x: -14, y: -22, width: 228, height: 444, rx: 6, class: 'g-edge' }, svg);
    var g = el('g', { class: 'pitch-static', transform: land ? 'matrix(0 1 -1 0 400 0)' : '' }, svg);
    for (var i = 0; i < 10; i++) el('rect', { x: 0, y: i * 40, width: 200, height: 40, class: i % 2 ? 'g-stripe-b' : 'g-stripe-a' }, g);
    el('rect', { x: 0, y: 0, width: 200, height: 400, class: 'chalk' }, g);
    el('line', { x1: 0, y1: 200, x2: 200, y2: 200, class: 'chalk' }, g);
    el('circle', { cx: 100, cy: 200, r: 30, class: 'chalk' }, g);
    el('circle', { cx: 100, cy: 200, r: 1.6, class: 'chalk-dot' }, g);
    // Futsal penalty areas: 6 m quarter circles from each post, joined by a straight line
    el('path', { d: 'M25 0 A60 60 0 0 0 85 60 L115 60 A60 60 0 0 0 175 0', class: 'chalk' }, g);
    el('path', { d: 'M25 400 A60 60 0 0 1 85 340 L115 340 A60 60 0 0 1 175 400', class: 'chalk' }, g);
    [60, 100, 340, 300].forEach(function (y) { el('circle', { cx: 100, cy: y, r: 1.4, class: 'chalk-dot' }, g); });
    [[0, 0, 'M2.5 0 A2.5 2.5 0 0 1 0 2.5'], [200, 0, 'M197.5 0 A2.5 2.5 0 0 0 200 2.5'],
     [0, 400, 'M0 397.5 A2.5 2.5 0 0 1 2.5 400'], [200, 400, 'M200 397.5 A2.5 2.5 0 0 0 197.5 400']].forEach(function (c) {
      el('path', { d: c[2], class: 'chalk' }, g);
    });
    el('rect', { x: 85, y: -10, width: 30, height: 10, class: 'goal-net' }, g);
    el('rect', { x: 85, y: 400, width: 30, height: 10, class: 'goal-net' }, g);
    L.goalFlash = el('rect', { x: 85, y: -10, width: 30, height: 10, class: 'goal-flash' }, g);
    var lab = el('g', null, svg), t1, t2, t3;
    if (land) {
      t1 = el('text', { x: 418, y: 100, transform: 'rotate(90 418 100)', 'text-anchor': 'middle', class: 'pitch-label' }, lab);
      t2 = el('text', { x: -18, y: 100, transform: 'rotate(-90 -18 100)', 'text-anchor': 'middle', class: 'pitch-label gold' }, lab);
      el('path', { d: 'M250 208 L242 212 L242 209 L150 209 L150 207 L242 207 L242 204 Z', class: 'attack-arrow' }, lab);
      t3 = el('text', { x: 200, y: 203, 'text-anchor': 'middle', class: 'pitch-label gold' }, lab);
    } else {
      t1 = el('text', { x: 100, y: -13, 'text-anchor': 'middle', class: 'pitch-label' }, lab);
      t2 = el('text', { x: 100, y: 418, 'text-anchor': 'middle', class: 'pitch-label gold' }, lab);
      el('path', { d: 'M-7 150 L-3 158 L-6 158 L-6 250 L-8 250 L-8 158 L-11 158 Z', class: 'attack-arrow' }, lab);
      t3 = el('text', { x: -7, y: 262, transform: 'rotate(-90 -7 262)', 'text-anchor': 'end', class: 'pitch-label gold' }, lab);
    }
    t1.textContent = 'Opponent goal'; t2.textContent = 'Our goal'; t3.textContent = 'FC EXG attack';

    L.hull = el('polygon', { class: 'hull', points: '' }, svg);
    L.prev = el('g', { class: 'prev' }, svg);
    L.cur = el('g', null, svg);
    L.links = el('g', null, svg);
    L.zone = el('g', { class: 'zone' }, svg);
    L.players = el('g', null, svg);
    L.names = el('g', { class: 'names-layer' }, svg);
    L.ball = el('g', { class: 'ball' }, svg);
    el('ellipse', { cx: 1.3, cy: 1.8, rx: 4.2, ry: 2.8, class: 'b-shadow' }, L.ball);
    el('circle', { r: 4.2, class: 'b-core' }, L.ball);
    el('path', { d: 'M0 -1.9 L1.8 -.6 L1.1 1.5 L-1.1 1.5 L-1.8 -.6 Z', class: 'b-patch' }, L.ball);
    L.tags = el('g', null, svg);
    L.shouts = el('g', null, svg);
  }

  var P = {}, PN = {}; // player marker and name label refs
  function buildPlayers() {
    L.players.innerHTML = '';
    L.names.innerHTML = '';
    P = {}; PN = {};
    state.tl.ids.forEach(function (id) {
      var team = E.teamOf(id);
      var g = el('g', { class: 'pl ' + team, 'data-id': id }, L.players);
      el('circle', { cx: 1.3, cy: 2, r: R, class: 'shadow' }, g);
      el('circle', { r: R, class: 'disc' }, g);
      var code = el('text', { class: 'code' }, g); code.textContent = S.ROLES[id].code;
      // Opponents' default labels ("Opponent 1") repeat the code on the marker: show them only once renamed.
      var label = names[id] || id;
      var isOpp = team === 'B' || team === 'OK';
      if (!isOpp || label !== S.ROLES[id].name) {
        var nm = el('text', { y: R + 10.5, class: 'name' }, L.names);
        PN[id] = nm;
        nm.textContent = label.length > 14 ? label.slice(0, 13) + '…' : label;
      }
      P[id] = g;
    });
  }

  function shorten(a, b, startCut, endCut) {
    var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    return [[a[0] + dx / d * startCut, a[1] + dy / d * startCut], [b[0] - dx / d * endCut, b[1] - dy / d * endCut]];
  }
  function drawStepArrows(st, layer) {
    layer.innerHTML = '';
    if (!st) return;
    Object.keys(st.moves).forEach(function (id) {
      var a = st.start[id], b = st.end[id];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.8) return;
      var team = E.teamOf(id);
      var cls = team === 'A' ? 'a' : team === 'K' ? 'k' : 'b';
      if (team === 'OK') cls = 'b';
      var s = shorten(M(a), M(b), R + 1, R + 2);
      el('line', { x1: s[0][0], y1: s[0][1], x2: s[1][0], y2: s[1][1], class: 'run-' + cls, 'marker-end': 'url(#ah-' + cls + ')' }, layer);
    });
    var act = st.act;
    if (act) {
      var A = E.footAt(st, act.from, act.s);
      var B = act.type === 'pass' ? E.footAt(st, act.to, act.e) : act.to;
      var s2 = shorten(M(A), M(B), 4, act.type === 'pass' ? 6 : 1);
      var cls2 = 'pass-line', mk = 'gold';
      if (act.type === 'shot') cls2 = 'shot-line';
      else if (act.turnover) {
        var weLose = E.teamOf(act.from) === 'A' || E.teamOf(act.from) === 'K';
        cls2 = weLose ? 'pass-lost' : 'pass-won';
        mk = weLose ? 'red' : 'green';
      }
      el('line', { x1: s2[0][0], y1: s2[0][1], x2: s2[1][0], y2: s2[1][1], class: cls2, 'marker-end': 'url(#ah-' + mk + ')' }, layer);
    }
  }

  function drawZone(st) {
    L.zone.innerHTML = '';
    var z = st.src.zone;
    if (!z) return;
    var g = el('g', { class: 'pulse' }, L.zone);
    var zc = M([z.x, z.y]);
    el('circle', { cx: zc[0], cy: zc[1], r: z.r * U }, g);
    var t = el('text', { x: zc[0], y: zc[1] - z.r * U + 8 }, g);
    t.textContent = z.label || 'SPACE';
  }

  function shoutList(st) {
    var s = st.src.shout;
    if (!s) return [];
    return Array.isArray(s) ? s : [s];
  }
  function drawLabels(st) {
    L.tags.innerHTML = '';
    L.shouts.innerHTML = '';
    var shouted = {};
    shoutList(st).forEach(function (s) {
      shouted[s.who] = true;
      var g = el('g', { class: 'shout', 'data-id': s.who }, L.shouts);
      var inner = el('g', { class: 'pop' }, g);
      var w = Math.max(30, s.text.length * 7 + 12);
      el('rect', { x: -w / 2, y: -R - 32, width: w, height: 17, rx: 4 }, inner);
      el('path', { d: 'M-4 ' + (-R - 15.5) + ' L4 ' + (-R - 15.5) + ' L0 ' + (-R - 9) + ' Z' }, inner);
      var tx = el('text', { x: 0, y: -R - 23.5 }, inner); tx.textContent = s.text;
    });
    var tags = st.src.tags || {};
    Object.keys(tags).forEach(function (id) {
      if (!P[id]) return;
      var team = E.teamOf(id);
      var below = shouted[id];
      var g = el('g', { class: 'tag ' + (team === 'OK' ? 'B' : team), 'data-id': id, 'data-below': below ? '1' : '' }, L.tags);
      var text = tags[id];
      var w = text.length * 4.1 + 11;
      var y = below ? R + 20 : -R - 10;
      el('rect', { x: -w / 2, y: y - 6, width: w, height: 12, rx: 6 }, g);
      var tx = el('text', { x: 0, y: y }, g); tx.textContent = text;
    });
  }

  function drawLinks(st, pos) {
    L.links.innerHTML = '';
    (st.links || []).forEach(function (pair) {
      var a = pos[pair[0]], b = pos[pair[1]];
      if (!a || !b) return;
      var s = shorten(M(a), M(b), R + 2, R + 3);
      el('line', { x1: s[0][0], y1: s[0][1], x2: s[1][0], y2: s[1][1], class: 'cover-line', 'marker-end': 'url(#ah-silver)' }, L.links);
    });
  }

  function hullPoints(pos) {
    var ids = ['DEF', 'LW', 'RW', 'PIV'].filter(function (id) { return pos[id]; });
    if (ids.length < 3) return '';
    var cx = 0, cy = 0;
    ids.forEach(function (id) { cx += pos[id][0]; cy += pos[id][1]; });
    cx /= ids.length; cy /= ids.length;
    ids.sort(function (a, b) {
      return Math.atan2(pos[a][1] - cy, pos[a][0] - cx) - Math.atan2(pos[b][1] - cy, pos[b][0] - cx);
    });
    return ids.map(function (id) { var m = M(pos[id]); return m[0].toFixed(1) + ',' + m[1].toFixed(1); }).join(' ');
  }

  /* ---------------- Render ---------------- */
  function render() {
    if (!state.tl) return;
    var s = E.sample(state.tl, state.t);
    var st = s.st;
    var pos = {};
    Object.keys(s.pos).forEach(function (id) { pos[id] = state.drag[id] || s.pos[id]; });

    if (s.i !== state.lastStep) {
      drawStepArrows(st, L.cur);
      drawStepArrows(s.i > 0 ? state.tl.steps[s.i - 1] : null, L.prev);
      drawZone(st);
      drawLabels(st);
      updateStepUI(st);
      state.lastStep = s.i;
    }
    L.cur.style.display = L.prev.style.display = state.arrows ? '' : 'none';

    Object.keys(P).forEach(function (id) {
      var q = pos[id];
      P[id].setAttribute('transform', tr(q));
      if (PN[id]) PN[id].setAttribute('transform', tr(q));
      P[id].classList.toggle('has-ball', s.holder === id);
    });

    var ball = s.ball;
    if (s.holder && state.drag[s.holder]) {
      var d = state.drag[s.holder];
      ball = [d[0], d[1] + E.ballOffset(s.holder)];
    }
    if (ball) {
      L.ball.style.display = '';
      L.ball.setAttribute('transform', tr(ball));
    } else L.ball.style.display = 'none';

    L.hull.setAttribute('points', st.shape ? hullPoints(pos) : '');
    L.hull.style.opacity = st.shape ? 1 : 0;
    drawLinks(st, pos);

    var z = st.src.zone;
    L.zone.style.opacity = z && s.p >= (z.from || 0) ? 1 : 0;

    Array.prototype.forEach.call(L.tags.children, function (g) {
      var q = pos[g.getAttribute('data-id')];
      if (q) g.setAttribute('transform', tr(q));
    });
    Array.prototype.forEach.call(L.shouts.children, function (g) {
      var q = pos[g.getAttribute('data-id')];
      if (q) g.setAttribute('transform', tr(q));
    });

    // Goal flash when a shot arrives
    if (st.act && st.act.type === 'shot' && st.act.goal && s.p >= st.act.e && state.lastShotStep !== s.i) {
      state.lastShotStep = s.i;
      L.goalFlash.classList.remove('on');
      void L.goalFlash.getBoundingClientRect();
      L.goalFlash.classList.add('on');
    }
    if (st.act && st.act.type === 'shot' && s.p < st.act.e && state.lastShotStep === s.i) state.lastShotStep = -1;

    $('scrub').value = Math.round(state.t / state.tl.total * 1000);
    $('btnPlay').classList.toggle('playing', state.playing);
    $('btnPlay').setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
    state.dirty = false;
  }

  /* ---------------- Playback ---------------- */
  var lastTs = null;
  function loop(ts) {
    if (lastTs == null) lastTs = ts;
    var dt = Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;
    advance(dt);
    requestAnimationFrame(loop);
  }
  function advance(dt) {
    if (state.playing && state.tl) {
      var before = state.t;
      state.t += dt * state.speed;
      if (state.playUntil != null && state.t >= state.playUntil) {
        state.t = state.playUntil; state.playUntil = null; pause();
      } else if (state.stepMode) {
        var i = E.stepIndexAt(state.tl, before);
        var end = state.tl.steps[i].t0 + state.tl.steps[i].d;
        if (state.t >= end && i < state.tl.steps.length - 1) { state.t = end - 1e-4; pause(); }
      }
      if (state.t >= state.tl.total) { state.t = state.tl.total; pause(); }
      state.dirty = true;
    }
    if (state.dirty && !$('screen-board').hidden) render();
  }

  function play() {
    if (!state.tl) return;
    if (state.t >= state.tl.total - 1e-3) { state.t = 0; state.lastStep = -1; }
    setFreeze(false);
    state.drag = {};
    state.playing = true;
    state.dirty = true;
  }
  function pause() { state.playing = false; state.dirty = true; }
  function togglePlay() { if (state.playing) pause(); else { state.playUntil = null; play(); } }
  function restart() { state.t = 0; state.playUntil = null; state.lastStep = -1; play(); }
  function seek(t) { state.t = Math.max(0, Math.min(state.tl.total, t)); state.drag = {}; state.dirty = true; }

  function playStep(k) {
    var st = state.tl.steps[k];
    seek(st.t0);
    state.playUntil = st.t0 + st.d - 1e-4;
    play();
  }
  function nextStep() {
    if (!state.tl) return;
    if (state.t >= state.tl.total - 1e-3) { setScreen(state.screen + 1); return; }
    var s = E.sample(state.tl, state.t);
    var k = s.p > 0.995 ? s.i + 1 : s.i;
    if (k >= state.tl.steps.length) { setScreen(state.screen + 1); return; }
    var st = state.tl.steps[k];
    if (k !== s.i) seek(st.t0);
    state.playUntil = st.t0 + st.d - 1e-4;
    if (k === state.tl.steps.length - 1) state.playUntil = state.tl.total;
    play();
  }
  function prevStep() {
    if (!state.tl) return;
    var s = E.sample(state.tl, state.t);
    var k = s.p > 0.2 && s.p < 0.995 ? s.i : s.i - 1;
    if (s.p >= 0.995) k = s.i;
    if (k < 0) k = 0;
    pause();
    state.playUntil = null;
    seek(state.tl.steps[k].t0);
  }

  function setFreeze(on) {
    state.freeze = on;
    if (on) pause();
    $('btnFreeze').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('freezeBadge').hidden = !on;
    var box = $('pitchBox');
    if (box) box.classList.toggle('dragging', on);
    if (!on) state.drag = {};
    state.dirty = true;
  }

  /* ---------------- Dragging (freeze frame) ---------------- */
  function svgPoint(evt) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var m = svg.getScreenCTM();
    if (!m) return null;
    var p = pt.matrixTransform(m.inverse());
    return state.landscape ? [p.y / U, 40 - p.x / U] : [p.x / U, p.y / U];
  }
  function initDrag() {
    var dragId = null;
    svg.addEventListener('pointerdown', function (e) {
      if (!state.freeze) return;
      var g = e.target.closest && e.target.closest('.pl');
      if (!g) return;
      dragId = g.getAttribute('data-id');
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    svg.addEventListener('pointermove', function (e) {
      if (!dragId) return;
      var p = svgPoint(e);
      if (!p) return;
      state.drag[dragId] = [Math.max(0, Math.min(20, p[0])), Math.max(-0.5, Math.min(40.5, p[1]))];
      state.dirty = true;
    });
    var end = function () { dragId = null; };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

  /* ---------------- Names modal ---------------- */
  function openNames() {
    pause();
    Object.keys(names).forEach(function (id) { var inp = $('n-' + id); if (inp) inp.value = names[id]; });
    $('namesModal').hidden = false;
    setTimeout(function () { $('n-DEF').focus(); }, 30);
  }
  function closeNames() { $('namesModal').hidden = true; }
  function applyNames() {
    if (state.tl) { buildPlayers(); renderPanel(); state.lastStep = -1; state.dirty = true; render(); }
  }

  /* ---------------- Fullscreen ---------------- */
  function toggleFull() {
    var d = document;
    var isFull = d.fullscreenElement || d.webkitFullscreenElement;
    try {
      if (!isFull) {
        var r = (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement);
        if (r && r.catch) r.catch(function () {});
      } else {
        var x = (d.exitFullscreen || d.webkitExitFullscreen).call(d);
        if (x && x.catch) x.catch(function () {});
      }
    } catch (e) { /* fullscreen not available (some phones / embedded views) */ }
  }
  function onFullChange() {
    var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    $('app').classList.toggle('present', on);
    $('btnFull').querySelector('span').textContent = on ? 'Exit' : 'Present';
  }

  /* ---------------- Wiring ---------------- */
  function init() {
    loadNames();
    buildNav();
    try { state.landscape = localStorage.getItem('fcexg-landscape') === '1'; } catch (e) { state.landscape = false; }
    $('tgLand').checked = state.landscape;
    $('screen-board').classList.toggle('landscape', state.landscape);
    buildPitch();
    initDrag();

    document.addEventListener('click', function (e) {
      var go = e.target.closest && e.target.closest('[data-go]');
      if (go) { setScreen(parseInt(go.dataset.go, 10)); return; }
      if (e.target.closest && e.target.closest('[data-open-names]')) openNames();
    });
    $('btnPlay').addEventListener('click', togglePlay);
    $('btnRestart').addEventListener('click', restart);
    $('btnNext').addEventListener('click', nextStep);
    $('btnPrev').addEventListener('click', prevStep);
    $('btnFreeze').addEventListener('click', function () { setFreeze(!state.freeze); });
    $('speedSeg').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      setSpeed(parseFloat(b.dataset.speed));
    });
    $('tgStep').addEventListener('change', function (e) { state.stepMode = e.target.checked; });
    $('tgArrows').addEventListener('change', function (e) { state.arrows = e.target.checked; state.dirty = true; });
    $('tgNames').addEventListener('change', function (e) { $('pitchBox').classList.toggle('hide-names', !e.target.checked); });
    $('btnPanel').addEventListener('click', togglePanel);
    $('tgLand').addEventListener('change', function (e) { setLandscape(e.target.checked); });
    $('scrub').addEventListener('input', function (e) {
      pause(); state.playUntil = null;
      seek(e.target.value / 1000 * state.tl.total);
    });
    $('btnNames').addEventListener('click', openNames);
    $('btnFull').addEventListener('click', toggleFull);
    document.addEventListener('fullscreenchange', onFullChange);
    document.addEventListener('webkitfullscreenchange', onFullChange);
    $('quoteOverlay').addEventListener('click', hideQuote);

    $('namesForm').addEventListener('submit', function (e) {
      e.preventDefault();
      Array.prototype.forEach.call(document.querySelectorAll('#namesForm input[data-id]'), function (inp) {
        var v = inp.value.trim();
        names[inp.dataset.id] = v || S.ROLES[inp.dataset.id].name;
      });
      saveNames(); closeNames(); applyNames();
    });
    $('namesCancel').addEventListener('click', closeNames);
    $('namesReset').addEventListener('click', function () {
      var d = defaultNames();
      Object.keys(d).forEach(function (id) { var inp = $('n-' + id); if (inp) inp.value = d[id]; });
    });
    $('namesModal').addEventListener('click', function (e) { if (e.target === $('namesModal')) closeNames(); });

    document.addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('input, textarea, select')) {
        if (e.key === 'Escape') closeNames();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!$('quoteOverlay').hidden && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'PageDown')) { e.preventDefault(); hideQuote(); return; }
      if (!$('namesModal').hidden) { if (e.key === 'Escape') closeNames(); return; }
      var onBoard = !$('screen-board').hidden;
      switch (e.key) {
        case ' ': if (onBoard) { e.preventDefault(); togglePlay(); } break;
        case 'ArrowRight': case 'PageDown':
          e.preventDefault(); if (onBoard) nextStep(); else setScreen(state.screen + 1); break;
        case 'ArrowLeft': case 'PageUp':
          e.preventDefault(); if (onBoard) prevStep(); else setScreen(state.screen - 1); break;
        case 'n': case 'N': setScreen(state.screen + 1); break;
        case 'b': case 'B': setScreen(state.screen - 1); break;
        case 'r': case 'R': if (onBoard) restart(); break;
        case 'z': case 'Z': if (onBoard) setFreeze(!state.freeze); break;
        case 'f': case 'F': toggleFull(); break;
        case 'p': case 'P': togglePanel(); break;
        case 'l': case 'L': setLandscape(!state.landscape); break;
        case '1': setSpeed(0.5); break;
        case '2': setSpeed(1); break;
        case '3': setSpeed(1.6); break;
        case 'Escape': if (state.freeze) setFreeze(false); break;
      }
    });

    var hash = (location.hash || '').replace('#', '');
    var start = SCREENS.findIndex(function (s) { return s.key === hash; });
    setScreen(start >= 0 ? start : 0, { quote: false });
    window.addEventListener('hashchange', function () {
      var k = SCREENS.findIndex(function (s) { return s.key === (location.hash || '').replace('#', ''); });
      if (k >= 0 && k !== state.screen) setScreen(k);
    });
    requestAnimationFrame(loop);
  }
  function setSpeed(v) {
    state.speed = v;
    Array.prototype.forEach.call($('speedSeg').children, function (b) { b.classList.toggle('on', parseFloat(b.dataset.speed) === v); });
  }
  function setLandscape(on) {
    state.landscape = !!on;
    $('tgLand').checked = state.landscape;
    $('screen-board').classList.toggle('landscape', state.landscape);
    try { localStorage.setItem('fcexg-landscape', state.landscape ? '1' : '0'); } catch (e) { /* ignore */ }
    buildPitch();
    if (state.tl) { buildPlayers(); state.lastStep = -1; state.dirty = true; render(); }
  }
  function togglePanel() {
    state.panel = !state.panel;
    $('screen-board').classList.toggle('no-panel', !state.panel);
    $('btnPanel').textContent = state.panel ? 'Panel' : 'Show panel';
  }

  // Small hook for automated checks (tools/browser-check.js); not needed to use the board.
  window.FCApp = { state: state, setScreen: setScreen, advance: advance, loadScene: function (k) { loadScene(SCREENS[state.screen].scene, k); }, render: render };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
