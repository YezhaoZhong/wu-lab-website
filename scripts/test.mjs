// DOM tests do not substitute for real-browser layout/accessibility inspection.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modulePath = process.env.JSDOM_PATH || '/tmp/probe-v11-qa/node_modules/jsdom/lib/api.js';
const { JSDOM } = await import(pathToFileURL(modulePath).href);
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8').replaceAll('import.meta.url', '"http://localhost/app.js"');
let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions++; }
async function open(route, lang = 'en', reduced = false) {
  const pathname = route.split('?')[0];
  const file = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  const timers = new Map();
  let timer = 0;
  const errors = [];
  const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'), {
    url: 'http://localhost/' + route, runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window;
  w.localStorage.setItem('siteLang', lang);
  w.console.error = e => errors.push(e);
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.matchMedia = () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} });
  w.setTimeout = (fn, ms) => { const id = ++timer; timers.set(id, { fn, ms }); return id; };
  w.clearTimeout = id => timers.delete(id);
  w.fetch = async value => {
    const p = path.join(root, decodeURIComponent(new URL(String(value), w.location.href).pathname));
    const exists = fs.existsSync(p);
    return { ok: exists, status: exists ? 200 : 404, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')), text: async () => fs.readFileSync(p, 'utf8') };
  };
  await w.eval(`(async()=>{${source}\n})()`);
  await new Promise(resolve => setImmediate(resolve));
  check(!errors.length, `${route} ${lang}: ${errors}`);
  return { dom, w, d: w.document, timers, close: () => w.close() };
}
function htmlFiles(dir = root) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (['.git', 'assets', 'data', 'scripts', 'source'].includes(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [path.relative(root, p)] : [];
  });
}
for (const file of htmlFiles()) {
  let route = file;
  if (file.endsWith('/study.html')) route += '?study=spark-seq';
  if (file.endsWith('/story.html')) route += '?person=guoyan-luo';
  if (file.endsWith('/activity.html')) route += '?id=1';
  for (const lang of ['en', 'zh']) {
    const ctx = await open(route, lang);
    check(ctx.d.querySelectorAll('h1').length === 1, `${route}: one h1`);
    check(ctx.d.querySelector('#language'), 'Language switch exists');
    for (const e of ctx.d.querySelectorAll('a[href],img[src]')) {
      const target = new URL(e.getAttribute(e.tagName === 'IMG' ? 'src' : 'href'), ctx.w.location.href);
      if (target.origin !== 'http://localhost') continue;
      let file = path.join(root, decodeURIComponent(target.pathname));
      if (target.pathname.endsWith('/')) file = path.join(file, 'index.html');
      check(fs.existsSync(file), `${route}: missing linked file ${file}`);
    }
    ctx.close();
  }
}
{
  const c = await open('discoveries/publications/');
  check(c.d.querySelectorAll('.pub-item').length === 6, 'Six initial papers');
  c.d.querySelector('.pub-toggle').click();
  check(c.d.querySelectorAll('.pub-item').length === 20, 'All papers expanded');
  check(c.d.querySelectorAll('.pub-toggle').length === 2, 'Two Show Less controls');
  check(c.d.querySelector('#more-publications').previousElementSibling.querySelector('.pub-toggle'), 'Top Show Less before More Publications');
  c.d.querySelector('[data-mode="figures"]').click();
  check(c.d.querySelector('.subfigures'), 'Subfigure mode');
  check(c.d.querySelectorAll('.pub-toggle').length === 2, 'Both collapse controls in figures mode');
  c.d.querySelector('[data-position="bottom"]').click();
  check(c.d.querySelectorAll('.pub-item').length === 6, 'Bottom collapse works');
  c.d.querySelector('#query').value = 'SPARK';
  c.d.querySelector('#query').dispatchEvent(new c.w.Event('input'));
  check(c.d.querySelectorAll('.pub-item').length === 1, 'Keyword search');
  check(c.w.location.search.includes('q=SPARK'), 'Search persisted to URL');
  c.d.querySelector('#area').value = 'design';
  c.d.querySelector('#area').dispatchEvent(new c.w.Event('input'));
  check(c.d.querySelector('.empty-state'), 'Combined filter empty state');
  c.d.querySelector('#clear-filters').click();
  check(c.d.querySelectorAll('.pub-item').length === 6, 'Clear filters');
  c.d.querySelector('#language').click();
  check(c.d.documentElement.lang === 'zh-CN', 'Language toggle');
  check(c.d.querySelector('.subfigures'), 'Image mode preserved through language change');
  c.close();
}
{
  const c = await open('discoveries/publications/?year=2025&area=discover&expanded=1');
  check(c.d.querySelectorAll('.pub-item').length > 0, 'URL state restored');
  check([...c.d.querySelectorAll('.pub-item .eyebrow')].every(e => e.textContent.includes('2025')), 'Year filtering');
  c.close();
}
{
  const c = await open('news/');
  const el = c.d.querySelector('.carousel');
  check([...c.timers.values()].some(t => t.ms === 4000), 'News timer at four seconds');
  el.querySelector('[data-slide="2"]').click();
  check(el.querySelector('.carousel-track').style.transform.includes('-200%'), 'Clickable news dots');
  el.querySelector('.expand').click();
  check(el.classList.contains('expanded'), 'News expands');
  check(c.timers.size === 0, 'No timers while expanded');
  check([...el.querySelectorAll('.slide')].every(s => !s.inert), 'Expanded cards accessible');
  el.querySelector('.expand').click();
  check(c.timers.size === 1, 'Timer resumes on collapse');
  c.close();
}
{
  const c = await open('minds/');
  check(c.d.querySelectorAll('.researcher-card').length === 3, 'Only three selected people');
  check(c.d.querySelectorAll('.origin-chip').length === 17, '17 anonymous hometown provinces');
  check(c.d.querySelectorAll('.map-point').length === 17, 'Map points loaded');
  c.d.querySelector('.origin-chip').click();
  check(c.d.querySelector('.map-lines .selected'), 'Map focus connects location');
  check([...c.timers.values()].some(t => t.ms === 4500), 'Activities delay is 0.5 seconds');
  c.d.querySelector('.vertical [data-slide="1"]').click();
  check(c.d.querySelector('.vertical .carousel-track').style.transform === 'translateY(-100%)', 'Vertical activity slide');
  c.close();
}
{
  const c = await open('news/', 'en', true);
  check(c.timers.size === 0, 'Reduced motion prevents autoplay');
  c.close();
}
for (const lang of ['en', 'zh']) {
  const c = await open('join-us/', lang);
  check(!/2024|2025/.test(c.d.querySelector('main').textContent), 'Recruitment years updated');
  check(c.d.querySelector('h1').textContent === 'Join Us', 'Join Us heading retained');
  c.close();
}
{
  const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
  for (const study of site.studies) {
    const authors = study.publication.authorList;
    check(authors.length >= 4, `Full author list: ${study.id}`);
    check(authors.every(a => a.name && !/et al|\.\.\./i.test(a.name)), `No abbreviated author list: ${study.id}`);
    check(authors.some(a => a.corresponding), `Corresponding author: ${study.id}`);
    check(study.publication.authorSource.page > 0, `PDF provenance: ${study.id}`);
  }
  for (const language of ['en', 'zh']) {
    const c = await open('discoveries/publications/?expanded=1', language);
    check(c.d.querySelectorAll('.full-authors').length === 20, 'All publication author lists are accessible');
    c.d.querySelector('.full-authors').open = true;
    check(c.d.querySelector('.full-authors[open] .author-source'), 'Expanded authors expose the source PDF');
    c.d.querySelector('#query').value = 'Genevieve Deblois';
    c.d.querySelector('#query').dispatchEvent(new c.w.Event('input'));
    check(c.d.querySelectorAll('.pub-item').length === 3, 'Search finds authors omitted from abbreviated citations');
    c.close();
  }
  const c = await open('research/study.html?study=spark-seq');
  const names = c.d.querySelector('.full-authors').textContent;
  check(names.includes('Guoyan Luo') && names.includes('Jia Song'), 'Study page preserves both co-first authors');
  c.close();
}
console.log(`PASS: ${assertions} assertions; 39 routes in both languages, local links, filters, image modes, collapse controls, timers, map and recruitment. Real-browser visual QA still required.`);
