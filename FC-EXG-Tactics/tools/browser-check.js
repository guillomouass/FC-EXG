/* In-browser functional check. Open index.html, then paste this into the browser console
 * (or run it from an automation tool). Returns a JSON report. */
(async () => {
const A = window.FCApp, run = sec => { for (let k = 0; k < sec * 60; k++) A.advance(1 / 60); }, st = A.state, out = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = [];
window.addEventListener('error', e => errs.push(e.message));
const q = s => document.querySelector(s);
const tf = id => q(`#pitch .pl[data-id="${id}"]`)?.getAttribute('transform');
for (let i = 1; i <= 8; i++) {
  A.setScreen(i, { quote: false });
  const sc = window.FCScenes.list[i - 1];
  const nv = sc.variants ? sc.variants.length : 1;
  for (let v = 0; v < nv; v++) {
    if (sc.variants) A.loadScene(v);
    st.playing = false;
    const ids = st.tl.ids;
    st.t = 0; st.lastStep = -1; A.render();
    const p0 = Object.fromEntries(ids.map(id => [id, tf(id)]));
    let moved = new Set(), ballMoves = 0, prevBall = q('#pitch .ball').getAttribute('transform'), caps = new Set();
    for (let t = 0; t <= st.tl.total + 0.01; t += 0.1) {
      st.t = Math.min(t, st.tl.total); A.render();
      ids.forEach(id => { if (tf(id) !== p0[id]) moved.add(id); });
      const b = q('#pitch .ball').getAttribute('transform'); if (b !== prevBall) ballMoves++; prevBall = b;
      caps.add(q('#caption b').textContent);
    }
    out.push(`${sc.id}${sc.variants ? ':' + sc.variants[v].id : ''}: ${st.tl.steps.length} steps, ${st.tl.total.toFixed(1)}s, players moved ${moved.size}/${ids.length}, ball frames ${ballMoves}, captions ${caps.size}`);
  }
}
A.setScreen(2, { quote: false }); await sleep(100);
st.playing = false;
q('#btnPlay').click(); run(0.7); const t1 = st.t; const playingNow = st.playing;
q('#btnPlay').click(); run(0.3); const t2 = st.t; run(0.3); const pausedHolds = st.t === t2 && !st.playing;
q('#btnRestart').click(); await sleep(50); const restarted = st.t < 0.2 && st.playing;
q('#btnPlay').click();
q('#btnPrev').click(); await sleep(30);
q('#btnNext').click(); await sleep(50); const nextPlays = st.playing && st.playUntil != null;
run(2.4); const stoppedAtStepEnd = !st.playing && Math.abs(st.t - (st.tl.steps[0].t0 + st.tl.steps[0].d)) < 0.01;
q('#btnPrev').click(); await sleep(50); const prevOk = !st.playing && st.t === 0;
q('#speedSeg [data-speed="0.5"]').click(); const slow = st.speed === 0.5;
q('#speedSeg [data-speed="1.6"]').click(); const fast = st.speed === 1.6;
q('#speedSeg [data-speed="1"]').click();
q('#btnFreeze').click(); const frozen = st.freeze && q('#btnFreeze').getAttribute('aria-pressed') === 'true' && !q('#freezeBadge').hidden;
const svg = q('#pitch'), g = q('#pitch .pl[data-id="DEF"]'), r = g.getBoundingClientRect();
const ev = (type, x, y) => new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 });
g.querySelector('.disc').dispatchEvent(ev('pointerdown', r.x + r.width / 2, r.y + r.height / 2));
svg.dispatchEvent(ev('pointermove', r.x + 60, r.y - 40)); svg.dispatchEvent(ev('pointerup', r.x + 60, r.y - 40));
await sleep(50); const dragged = !!st.drag.DEF;
q('#btnPlay').click(); await sleep(50); const unfrozen = !st.freeze && !st.drag.DEF;
q('#tgStep').click(); const stepMode = st.stepMode; q('#tgStep').click();
q('#tgArrows').click(); st.dirty = true; A.advance(0); const arrowsHidden = q('#pitch g.prev').style.display === 'none'; q('#tgArrows').click();
q('#tgNames').click(); const namesHidden = getComputedStyle(q('.names-layer')).display === 'none'; q('#tgNames').click();
q('#btnNames').click(); await sleep(60); const modalOpen = !q('#namesModal').hidden;
q('#n-PIV').value = 'Karim'; q('#namesForm').requestSubmit(); await sleep(60);
const renamed = [...document.querySelectorAll('.names-layer .name')].some(n => n.textContent === 'Karim') && q('#pSteps').textContent.includes('Karim');
q('#btnNames').click(); await sleep(30); q('#namesReset').click(); q('#namesForm').requestSubmit(); await sleep(30);
const resetOk = [...document.querySelectorAll('.names-layer .name')].some(n => n.textContent === 'Pivot');
A.setScreen(4, { quote: false }); document.querySelectorAll('#variants button')[2].click(); await sleep(50);
const gkVariant = !!q('#pitch .pl[data-id="GK"]') && !!q('#pitch .pl[data-id="OGK"]');
q('#tgLand').click(); await sleep(80); const landscapeViewBox = q('#pitch').getAttribute('viewBox'); q('#tgLand').click(); await sleep(50);
A.setScreen(2, { quote: false }); document.querySelectorAll('#pSteps button')[3].click(); run(0.1);
const stepClick = q('#pSteps li.cur') === document.querySelectorAll('#pSteps li')[3];
st.t = st.tl.total; st.playing = false; q('#btnNext').click(); await sleep(50); const nextScreen = st.screen === 3;
q('#quoteOverlay').click();
return JSON.stringify({ sequences: out, controls: { t1: +t1.toFixed(2), playingNow, pausedHolds, restarted, nextPlays, stoppedAtStepEnd, prevOk, slow, fast, frozen, dragged, unfrozen, stepMode, arrowsHidden, namesHidden, modalOpen, renamed, resetOk, gkVariant, landscapeViewBox, stepClick, nextScreen }, errs }, null, 1);
})();
