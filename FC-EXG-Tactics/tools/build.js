#!/usr/bin/env node
/* Builds single-file versions of the tactical board.
 *   node tools/build.js
 * dist/FC-EXG-Tactics.html  one self-contained file (CSS, JS and images inside): open it anywhere, even offline
 * dist/artifact.html        same content without the <html>/<head>/<body> wrapper, for web publishing
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const dataUri = f => `data:${mime[path.extname(f)]};base64,${fs.readFileSync(path.join(root, f)).toString('base64')}`;
const inlineAssets = s => s.replace(/assets\/[\w.-]+\.(?:jpg|jpeg|png|webp)/g, m => dataUri(m));

let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${read('css/style.css')}\n</style>`);
html = html.replace(/<script src="(js\/[\w.-]+\.js)"><\/script>/g, (m, f) => `<script>\n${read(f)}\n</script>`);
html = inlineAssets(html);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'FC-EXG-Tactics.html'), html);

const artifact = html
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<html[^>]*>\s*/i, '')
  .replace(/<\/?head>\s*/gi, '')
  .replace(/<meta charset="utf-8">\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<body>\s*/i, '')
  .replace(/<\/body>\s*/i, '')
  .replace(/<\/html>\s*/i, '');
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), artifact);

const kb = f => (fs.statSync(path.join(root, 'dist', f)).size / 1024).toFixed(0) + ' KB';
console.log('dist/FC-EXG-Tactics.html', kb('FC-EXG-Tactics.html'));
console.log('dist/artifact.html', kb('artifact.html'));
