import fs from 'node:fs';
import assert from 'node:assert/strict';
const css = fs.readFileSync(new URL('../probe.css', import.meta.url), 'utf8');
const parseTokens = block => Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1], m[2]]));
// Theme and component scopes must never overwrite one another during extraction.
const tokens = parseTokens(css.match(/:root\{([^}]+)\}/)?.[1] || '');
const light = { ...tokens, ...parseTokens(css.match(/:root\[data-theme="light"\]\{([^}]+)\}/)?.[1] || '') };
const luminance = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255)
  .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
let count = 0;
function check(fg, bg, minimum, label) {
  const ratio = contrast(fg, bg);
  assert.ok(ratio >= minimum, `${label}: ${ratio.toFixed(2)} < ${minimum}`);
  console.log(`${label}: ${ratio.toFixed(2)}:1`);
  count++;
}
for (const surface of ['paper', 'soft', 'surface']) {
  for (const text of ['ink', 'muted', 'cyan']) check(tokens[text], tokens[surface], 4.5, `${text} on ${surface}`);
  check(tokens['control-line'], tokens[surface], 3, `Control border on ${surface}`);
}
check(tokens.navy, tokens.cyan, 4.5, 'Primary button / active control');
check(tokens.navy, tokens['accent-hover'], 4.5, 'Primary button hover');
check(tokens['accent-hover'], tokens.soft, 4.5, 'Outline button hover');
check(tokens['figure-ink'], tokens['figure-paper'], 4.5, 'Brand text on image panel');
check('#506773', tokens['figure-paper'], 4.5, 'Image-panel caption');
check(tokens.ink, '#174449', 4.5, 'Activity title on teal gradient end');
check(tokens.cyan, '#174449', 4.5, 'Activity link on teal gradient end');
for (const surface of ['paper', 'soft', 'surface']) {
  for (const text of ['ink', 'muted', 'cyan']) check(light[text], light[surface], 4.5, `Light ${text} on ${surface}`);
  check(light['control-line'], light[surface], 3, `Light control border on ${surface}`);
}
check('#ffffff', light.cyan, 4.5, 'Light button text');
assert.match(css, /color-scheme:dark/);
assert.match(css, /\.button\.outline:hover\{[^}]*color:var\(--accent-hover\)/);
assert.doesNotMatch(css, /filter:\s*(invert|hue-rotate)/);
console.log(`PASS: ${count} palette contrast pairs. This does not replace rendered-page visual QA.`);
