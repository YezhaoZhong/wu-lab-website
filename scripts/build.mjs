import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
const write = (name, text) => {
  const dest = path.join(root, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text);
};
const asset = value => value?.replace(/^\.\.\//, '') || '';
const original = read('research-map.json');
const articles = read('study-articles.json');
const publications = read('publications.json');
const authorRecords = read('publication-authors.json');
for (const publication of publications) {
  const record = authorRecords[publication.doi];
  if (!record) throw new Error(`Missing full author record: ${publication.doi}`);
  const names = record.names.split(';').map(name => name.trim());
  if (names.some(name => !name || /et al|\.\.\./i.test(name))) throw new Error(`Incomplete authors: ${publication.doi}`);
  for (const index of [...record.equal, ...record.corresponding]) {
    if (!Number.isInteger(index) || index < 1 || index > names.length) throw new Error(`Invalid author role: ${publication.doi}`);
  }
  publication.authorList = names.map((name, i) => ({ name, equal: record.equal.includes(i + 1), corresponding: record.corresponding.includes(i + 1) }));
  publication.authorSource = { pdf: asset(publication.pdf), page: record.authorPage, equalPage: record.equalPage || null, reviewed: '2026-10-21' };
}
const newsText = read('news.json');
const newsSource = fs.readFileSync(path.join(root, 'source/news-v10.html'), 'utf8');
const names = [
  ['discover', 'Discover', 'Molecular Recognition & Omics', '分子识别与组学',
    'Read the molecular signatures that define a cell.', '读取定义细胞状态的分子信号。',
    ['spark-seq', 'apt-seq', 'tumor-marker-ms', 'molecular-medicine-era']],
  ['design', 'Design', 'Structure-Guided Molecular Design', '结构引导的分子设计',
    'Connect molecular structure to selective recognition.', '连接分子结构与特异性识别。',
    ['atp-aptamer', 'blocker-selex']],
  ['engineer', 'Engineer', 'Functional Aptamers & Therapeutics', '功能适配体与治疗策略',
    'Turn recognition into a programmable biological function.', '让分子识别成为可编程的生物功能。',
    ['blocker-selex', 'dnazyme-evolution', 'aptamer-lytacs', 'ptf-sriapt', 'cd4-aptamer-cells']],
  ['translate', 'Translate', 'Precision Medicine & Translation', '精准医学与转化',
    'Link disease mechanisms to strategies for intervention.', '从疾病机制出发，寻找干预路径。',
    ['glut1-tnbc', 'bromodomain-toolbox', 'prmt-review', 'taf1-bay299', 'prmt-viral-mimicry',
      'prmt5-vulnerability', 'ezh2-rb1', 'interferon-prmt5', 'prmt1-pd1', 'drug-resistance-protocol',
      'ptf-sriapt', 'cd4-aptamer-cells', 'aptamer-lytacs']]
];
const areas = names.map(([id, title, en, zh, leadEn, leadZh, studies]) =>
  ({ id, title, subtitle: { en, zh }, lead: { en: leadEn, zh: leadZh }, studies }));
const studies = Object.entries(original.studies).map(([id, study]) => {
  const pub = publications.find(p => p.doi_url === study.doiUrl);
  if (!pub || !articles[id]) throw new Error(`Missing publication/article: ${id}`);
  return { id, ...study, areas: areas.filter(a => a.studies.includes(id)).map(a => a.id),
    article: articles[id], publication: pub, cover: asset(study.cover),
    paperCover: asset(pub.cover), pdf: asset(pub.pdf) };
}).sort((a, b) => Number(b.year) - Number(a.year) || a.id.localeCompare(b.id));
const news = [...newsSource.matchAll(/<article class="resource-card news-card"[^>]*>([\s\S]*?)<\/article>/g)].map(([, body]) => {
  const number = body.match(/resources\.news\.(\d+)\.title/)[1];
  const slug = body.match(/href="\.\/([^"]+)\.html"/)[1];
  const date = body.match(/class="news-kicker">([^<]+)/)[1];
  return { id: slug, date, ...Object.fromEntries(['en', 'zh'].map(lang => [lang, {
    title: newsText[lang][`resources.news.${number}.title`],
    summary: newsText[lang][`resources.news.${number}.summary`],
    body: newsText[lang][`resources.detail.${slug}.body.html`] || ''
  }])) };
}).sort((a, b) => b.date.localeCompare(a.date));
const activities = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, ...Object.fromEntries(['en', 'zh'].map(lang => [lang,
    Object.fromEntries(['title', 'summary', 'date'].map(key =>
      [key, newsText[lang][`resources.activity.${i + 1}.${key}`] || '']))]))
})).sort((a, b) => (parseInt(b.en.date) || 0) - (parseInt(a.en.date) || 0));
const join = read('join.json');
for (const lang of ['en', 'zh']) {
  for (const [key, value] of Object.entries(join[lang])) {
    join[lang][key] = value.replace(/\b202[45]\b/g, '2026')
      .replaceAll('Wu Lab', 'PROBE Lab').replaceAll('吴芩课题组', '功能核酸组学团队');
  }
}
// Do not turn old named notices into invented 2026 announcements.
join.en['join.path1.body'] = 'For 2026 summer-camp dates, eligibility and application procedures, please consult the current official institute notice or contact us.';
join.zh['join.path1.body'] = '2026 年夏令营的时间、资格和申请流程，请以研究所当年正式通知为准，或邮件咨询。';
join.en['join.path2.body'] = 'For recommended admission and direct PhD entry in 2026, consult the official admissions notice and confirm availability by email.';
join.zh['join.path2.body'] = '2026 年推免与直博申请请查阅正式招生通知，并通过邮件确认名额与申请安排。';
join.en['join.path3.body'] = 'For 2026 graduate entrance examinations, consult the institute admissions brochure and programme catalogue. Deadlines follow official notices.';
join.zh['join.path3.body'] = '2026 年研究生招生考试请参考研究所正式招生简章及专业目录，具体时间以官方通知为准。';
const logo = 'assets/branding/probe-logo.png';
const data = {
  version: 11, logo: fs.existsSync(path.join(root, logo)) ? logo : null,
  areas, studies, news, activities, join, people: read('people.json'),
  origins: fs.existsSync(path.join(root, 'data/origins.json')) ? read('origins.json') : { locations: [] },
  researchers: [
    { id: 'guoyan-luo', en: 'Guoyan Luo', zh: '罗国焰', study: 'spark-seq' },
    { id: 'xiaoqiu-wu', en: 'Xiaoqiu Wu', zh: '武晓秋', study: 'apt-seq' },
    { id: 'tongqing-li', en: 'Tongqing Li', zh: '李同庆', study: 'blocker-selex' }
  ]
};
for (const s of studies) {
  if (!s.areas.length) throw new Error(`Unclassified study: ${s.id}`);
  for (const file of [s.pdf, s.cover, s.paperCover]) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing asset: ${file}`);
  }
}
write('data/site.json', JSON.stringify(data, null, 2) + '\n');
const routes = new Map([
  ['index.html', ['home', 'PROBE Lab']],
  ['vision/index.html', ['vision', 'Vision']],
  ['research/index.html', ['research', 'Research']],
  ['research/tools/index.html', ['tools', 'Tools & Resources']],
  ['research/study.html', ['study', 'Research story']],
  ['discoveries/index.html', ['discoveries', 'Discoveries']],
  ['discoveries/study.html', ['study', 'Discovery']],
  ['discoveries/publications/index.html', ['publications', 'All Publications']],
  ['minds/index.html', ['minds', 'Minds']],
  ['minds/pi/index.html', ['pi', 'Qin Wu']],
  ['minds/story.html', ['person', 'Meet the Discoverer']],
  ['minds/activity.html', ['activity', 'Culture']],
  ['join-us/index.html', ['join', 'Join Us']],
  ['news/index.html', ['news', 'News']],
  ['people/index.html', ['minds', 'Minds']],
  ['publications/index.html', ['publications', 'All Publications']],
  ['software/index.html', ['tools', 'Tools & Resources']],
  ['join/index.html', ['join', 'Join Us']]
]);
for (const a of areas) routes.set(`research/${a.id}/index.html`, [`area:${a.id}`, a.title]);
for (const n of news) routes.set(`news/${n.id}.html`, [`news:${n.id}`, 'News']);
for (const [old, area] of [['explore', 'engineer'], ['decode', 'discover'], ['protect', 'translate']]) {
  routes.set(`research/${old}.html`, [`area:${area}`, 'Research']);
}
const legacyStudies = { 'single-cell-aptamer-seq': 'apt-seq', 'aptamer-screening': 'blocker-selex', 'tnbc-targets': 'glut1-tnbc' };
// Replace inherited HTML entry points so no old roster or navigation remains public.
function inherited(dir = root) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'assets', 'data', 'source', 'scripts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) inherited(full);
    else if (entry.name.endsWith('.html')) {
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (legacyStudies[entry.name.replace('.html', '')]) {
        routes.set(rel, [`study:${legacyStudies[entry.name.replace('.html', '')]}`, 'Research story']);
      } else if (!routes.has(rel)) {
        const old = entry.name.replace('.html', '');
        routes.set(rel, [legacyStudies[old] ? `study:${legacyStudies[old]}` : 'research', 'PROBE Lab']);
      }
    }
  }
}
inherited();
for (const [file, [page, title]] of routes) {
  const depth = file.split('/').length - 1;
  const base = '../'.repeat(depth) || './';
  write(file, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | PROBE Lab</title><meta name="description" content="PROBE Lab. Functional nucleic acid omics, molecular recognition and precision medicine.">
<link rel="icon" href="${base}${data.logo || 'assets/branding/logo.svg'}">
<link rel="stylesheet" href="${base}probe.css"><script type="module" src="${base}app.js"></script></head>
<body data-page="${page}"><a class="skip-link" href="#main">Skip to content</a>
<div id="app"><main id="main" class="loading"><p>PROBE Lab</p><p>Loading research and stories...</p></main></div>
<noscript>This website requires JavaScript. Please enable it to browse our research. Contact: wuqin@him.cas.cn</noscript>
</body></html>\n`);
}
console.log(`Built ${routes.size} routes, ${studies.length} studies, ${news.length} news items and ${activities.length} activities.`);
