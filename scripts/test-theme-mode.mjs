import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code = fs.readFileSync(new URL('../theme.js', import.meta.url), 'utf8');
function setup(saved, dark = false, blocked = false) {
  const events = {};
  const media = { matches: dark, addEventListener(_, fn) { this.change = fn; } };
  const document = { documentElement: { dataset: {} } };
  const localStorage = {
    getItem() { if (blocked) throw Error(); return saved; },
    setItem(_, value) { if (blocked) throw Error(); saved = value; }
  };
  const window = { matchMedia: () => media, addEventListener: (name, fn) => { events[name] = fn; }, dispatchEvent() {} };
  vm.runInNewContext(code, { window, document, localStorage, Event: class {} });
  return { window, media, events, state: document.documentElement.dataset, saved: () => saved };
}
for (const dark of [false, true]) {
  const s = setup(null, dark);
  assert.equal(s.state.theme, dark ? 'dark' : 'light');
  s.media.matches = !dark; s.media.change();
  assert.equal(s.state.theme, dark ? 'light' : 'dark');
  s.window.probeTheme.cycle();
  assert.equal(s.state.theme, 'light');
  assert.equal(s.saved(), 'light');
  s.media.matches = true; s.media.change();
  assert.equal(s.state.theme, 'light');
  s.window.probeTheme.cycle(); assert.equal(s.state.theme, 'dark');
  s.window.probeTheme.cycle(); assert.equal(s.state.themeMode, 'system');
  s.events.storage({ key: 'siteTheme', newValue: 'light' });
  assert.equal(s.state.theme, 'light');
  s.events.storage({ key: null, newValue: null });
  assert.equal(s.state.themeMode, 'system');
}
assert.equal(setup('light', true).state.theme, 'light');
assert.equal(setup('dark', false).state.theme, 'dark');
assert.equal(setup('invalid').state.themeMode, 'system');
const privateMode = setup(null, true, true);
privateMode.window.probeTheme.cycle();
assert.equal(privateMode.state.theme, 'light');
console.log('PASS: system changes, manual cycle, saved choice, cross-tab sync and unavailable storage.');
