import fs from 'node:fs';
import { createHash } from 'node:crypto';
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
const newsContent = read('news-content.json');
const activityMedia = read('activity-media.json');
const newsSource = fs.readFileSync(path.join(root, 'source/news-v10.html'), 'utf8');
const names = [
  ['discover', 'Discover', 'Molecular Recognition & Omics', '分子识别与组学技术',
    'Use aptamers and sequencing to discover molecular recognition relationships, cell states and disease-associated biomarkers at scale.', '利用适体和测序技术，大规模发现分子识别关系、细胞状态与疾病相关标志物。',
    ['spark-seq', 'apt-seq', 'tumor-marker-ms', 'molecular-medicine-era']],
  ['design', 'Design', 'AI & Structure-Guided Molecular Design', 'AI与结构驱动的分子设计',
    'Combine nucleic acid–target complex structures, computational methods and artificial intelligence to understand molecular recognition and design new functional nucleic acids.', '结合核酸–靶标复合物结构、计算方法与人工智能，理解分子识别规律，并据此设计新型功能核酸。',
    ['atp-aptamer', 'blocker-selex']],
  ['engineer', 'Engineer', 'Functional Molecular Discovery & Therapeutics', '功能分子筛选与药物发现',
    'Advance Functional Aptomics to discover and optimize aptamers with inhibitory, activating or allosteric activities and develop new therapeutic molecules.', '以功能适体组学（Functional Aptomics）为核心，发现和优化具有抑制、激活、变构调控等活性的适体，开发新型治疗分子。',
    ['blocker-selex', 'dnazyme-evolution', 'aptamer-lytacs', 'ptf-sriapt', 'cd4-aptamer-cells']],
  ['translate', 'Translate', 'Precision Medicine & Clinical Translation', '精准医学与临床转化',
    'Develop molecular diagnostics, patient stratification and personalized treatment strategies for major diseases, advancing molecular probes and functional nucleic acids toward clinical translation.', '面向重大疾病，发展新型分子诊断、患者分型及个体化治疗策略，推动分子探针与功能核酸的临床转化。',
    ['glut1-tnbc', 'bromodomain-toolbox', 'prmt-review', 'taf1-bay299', 'prmt-viral-mimicry',
      'prmt5-vulnerability', 'ezh2-rb1', 'interferon-prmt5', 'prmt1-pd1', 'drug-resistance-protocol',
      'ptf-sriapt', 'cd4-aptamer-cells', 'aptamer-lytacs']]
];
const areas = names.map(([id, title, en, zh, leadEn, leadZh, studies]) =>
  ({ id, title, subtitle: { en, zh }, lead: { en: leadEn, zh: leadZh }, studies }));
const areaKeywords = {
  discover: ['SPARK-seq', 'Apt-seq', 'Single-cell Aptomics'],
  design: ['Structural Aptomics', 'TransApt', 'Molecular Design'],
  engineer: ['Functional Aptomics', 'Molecular Regulation', 'Nucleic Acid Drugs'],
  translate: ['Clinical Aptomics', 'Biomarkers', 'Precision Oncology']
};
for (const area of areas) area.keywords = areaKeywords[area.id];
const researchOverviewZh = {
  discover: {
    backgrounds: '分子生物学、化学生物学、单细胞组学、生物信息学。',
    backgroundsEn: 'Molecular biology, chemical biology, single-cell omics and bioinformatics.'
  },
  design: {
    backgrounds: '结构生物学、计算生物学、人工智能、化学、蛋白质科学。',
    backgroundsEn: 'Structural biology, computational biology, artificial intelligence, chemistry and protein science.'
  },
  engineer: {
    backgrounds: '化学生物学、药学、分子药理学、核酸化学、药物开发。',
    backgroundsEn: 'Chemical biology, pharmaceutical sciences, molecular pharmacology, nucleic acid chemistry and drug development.'
  },
  translate: {
    backgrounds: '肿瘤生物学、转化医学、临床医学、免疫学、生物信息学。',
    backgroundsEn: 'Cancer biology, translational medicine, clinical medicine, immunology and bioinformatics.'
  }
};
for (const area of areas) area.overviewZh = researchOverviewZh[area.id];
const directionFocus = {
  discover: {
    heading: { en: 'Read molecular recognition and cellular information', zh: '读出分子识别与细胞信息' },
    steps: { en: ['Aptamer recognition', 'Sequencing readout', 'Information discovery'], zh: ['适体识别', '测序读出', '信息发现'] },
    topics: { en: ['Recognition relationships', 'Cell states', 'Disease biomarkers'], zh: ['识别关系', '细胞状态', '疾病标志物'] },
    featured: ['spark-seq', 'apt-seq', 'tumor-marker-ms']
  },
  design: {
    heading: { en: 'From recognition principles to molecular design', zh: '从识别规律到分子设计' },
    steps: { en: ['Complex structures', 'Recognition principles', 'Molecular design'], zh: ['复合物结构', '识别规律', '分子设计'] },
    topics: { en: ['Structural analysis', 'AI-assisted design', 'Experimental validation'], zh: ['结构解析', 'AI辅助设计', '实验验证'] },
    featured: ['atp-aptamer', 'blocker-selex']
  },
  engineer: {
    heading: { en: 'From molecular binding to functional regulation', zh: '从分子结合到功能调控' },
    steps: { en: ['Functional screening', 'Activity validation', 'Molecular optimization'], zh: ['功能筛选', '活性验证', '分子优化'] },
    topics: { en: ['Inhibition', 'Activation', 'Allosteric regulation'], zh: ['抑制', '激活', '变构调控'] },
    featured: ['blocker-selex', 'aptamer-lytacs', 'dnazyme-evolution']
  },
  translate: {
    heading: { en: 'From molecular discovery toward clinical application', zh: '从分子发现走向临床应用' },
    steps: { en: ['Molecular probes', 'Disease information', 'Stratification & intervention'], zh: ['分子探针', '疾病信息', '分型与干预'] },
    topics: { en: ['Molecular diagnostics', 'Patient stratification', 'Personalized treatment'], zh: ['分子诊断', '患者分型', '个体化治疗'] },
    featured: ['interferon-prmt5', 'prmt-viral-mimicry', 'ptf-sriapt']
  }
};
for (const area of areas) area.focus = directionFocus[area.id];
const figureSources = read('subfigure-manifest.json');
const studies = Object.entries(original.studies).map(([id, study]) => {
  const pub = publications.find(p => p.doi_url === study.doiUrl);
  if (!pub || !articles[id]) throw new Error(`Missing publication/article: ${id}`);
  return { id, ...study, areas: areas.filter(a => a.studies.includes(id)).map(a => a.id),
    article: articles[id], publication: pub, cover: asset(study.cover),
    figureSource: figureSources.find(record => record.doi === pub.doi && asset(record.image) === asset(study.cover)) || null,
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
}).map(item => {
  const update = newsContent.overrides[item.id] || {};
  return { ...item, ...update, en: { ...item.en, ...update.en }, zh: { ...item.zh, ...update.zh } };
}).concat(newsContent.additional).sort((a, b) => b.date.localeCompare(a.date));
if (new Set(news.map(item => item.id)).size !== news.length) throw new Error('Duplicate news ID');
for (const item of news) {
  if (!/^\d{4}(-\d{2}){0,2}$/.test(item.date)) throw new Error(`Invalid news date: ${item.id}`);
  for (const image of [item.image, ...(item.gallery || []).map(photo => photo.image)].filter(Boolean)) {
    if (!fs.existsSync(path.join(root, image))) throw new Error(`Missing news image: ${image}`);
  }
}
const activities = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, ...(activityMedia[String(i + 1)] || {}), ...Object.fromEntries(['en', 'zh'].map(lang => [lang,
    Object.fromEntries(['title', 'summary', 'date'].map(key =>
      [key, newsText[lang][`resources.activity.${i + 1}.${key}`] || '']))]))
})).sort((a, b) => (parseInt(b.en.date) || 0) - (parseInt(a.en.date) || 0));
const join = read('join.json');
for (const lang of ['en', 'zh']) {
  for (const [key, value] of Object.entries(join[lang])) {
    join[lang][key] = value.replace(/\b202[45]\b/g, '2026')
      .replaceAll('Wu Lab', 'Probe Lab').replaceAll('吴芩课题组', '功能核酸组学团队');
  }
}
// Do not turn old named notices into invented 2026 announcements.
join.en['join.path1.body'] = 'For 2026 summer-camp dates, eligibility and application procedures, please consult the current official institute notice or contact us.';
join.zh['join.path1.body'] = '2026 年夏令营的时间、资格和申请流程，请以研究所当年正式通知为准，或邮件咨询。';
join.en['join.path2.body'] = 'For recommended admission and direct PhD entry in 2026, consult the official admissions notice and confirm availability by email.';
join.zh['join.path2.body'] = '2026 年推免与直博申请请查阅正式招生通知，并通过邮件确认名额与申请安排。';
join.en['join.path3.body'] = 'For 2026 graduate entrance examinations, consult the institute admissions brochure and programme catalogue. Deadlines follow official notices.';
join.zh['join.path3.body'] = '2026 年研究生招生考试请参考研究所正式招生简章及专业目录，具体时间以官方通知为准。';
const logo = 'assets/branding/aptomics-cell-atlas-logo.png';
const data = {
  version: 11, logo: fs.existsSync(path.join(root, logo)) ? logo : null,
  areas, studies, news, activities, join, people: read('people.json'),
  origins: JSON.parse(fs.readFileSync(path.join(root, 'assets/people/origins.json'), 'utf8')),
  researchers: [
    { id: 'guoyan-luo', en: 'Guoyan Luo', zh: '罗国焰', study: 'spark-seq', portrait: 'assets/minds/people/guoyan-luo.webp' },
    { id: 'xiaoqiu-wu', en: 'Xiaoqiu Wu', zh: '武晓秋', study: 'apt-seq', portrait: 'assets/minds/people/xiaoqiu-wu.webp' },
    { id: 'tongqing-li', en: 'Tongqing Li', zh: '李同庆', study: 'blocker-selex', portrait: 'assets/minds/people/tongqing-li.jpg' }
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
  ['index.html', ['home', 'Probe Lab']],
  ['vision/index.html', ['home', 'Vision']],
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
  ['news/index.html', ['news', 'Latest News']],
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
        routes.set(rel, [legacyStudies[old] ? `study:${legacyStudies[old]}` : 'research', 'Probe Lab']);
      }
    }
  }
}
inherited();
const appVersion = createHash('sha256').update(fs.readFileSync(path.join(root, 'app.js'))).update(fs.readFileSync(path.join(root, 'data/site.json'))).digest('hex').slice(0, 12);
const styleVersion = createHash('sha256').update(fs.readFileSync(path.join(root, 'probe.css'))).digest('hex').slice(0, 12);
const themeVersion = createHash('sha256').update(fs.readFileSync(path.join(root, 'theme.js'))).digest('hex').slice(0, 12);
const layoutVersion = createHash('sha256').update(fs.readFileSync(path.join(root, 'layout-scale.js'))).digest('hex').slice(0, 12);
for (const [file, [page, title]] of routes) {
  const depth = file.split('/').length - 1;
  const base = '../'.repeat(depth) || './';
  write(file, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | Probe Lab</title><meta name="description" content="Probe Lab. Functional nucleic acid omics, molecular recognition and precision medicine.">
${file === 'vision/index.html' ? '<link rel="canonical" href="../"><script>location.replace("../" + location.search + location.hash);</script>' : ''}
<link rel="icon" href="${base}${data.logo || 'assets/branding/logo.svg'}">
<script src="${base}theme.js?v=${themeVersion}"></script>
<script src="${base}layout-scale.js?v=${layoutVersion}"></script>
<link rel="stylesheet" href="${base}probe.css?v=${styleVersion}"><script type="module" src="${base}app.js?v=${appVersion}"></script></head>
<body data-page="${page}"><a class="skip-link" href="#main">Skip to content</a>
<div id="app"><main id="main" class="loading"><p>Probe Lab</p><p>Loading research and stories...</p></main></div>
<noscript>This website requires JavaScript. Please enable it to browse our research. Contact: wuqin@him.cas.cn</noscript>
</body></html>\n`);
}
console.log(`Built ${routes.size} routes, ${studies.length} studies, ${news.length} news items and ${activities.length} activities.`);
