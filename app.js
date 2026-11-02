const base = new URL('./', import.meta.url);
const url = path => new URL(path, base).href;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const storage = {
  get(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing still works. */ } }
};
let lang = storage.get('siteLang', 'en') === 'zh' ? 'zh' : 'en';
const t = (en, zh) => lang === 'zh' ? zh : en;
const local = obj => obj?.[lang] || obj?.en || '';
let data;
let cleanups = [];
const page = document.body.dataset.page;
const params = () => new URLSearchParams(location.search);
const findStudy = id => data.studies.find(s => s.id === id);
const studyURL = id => url(`discoveries/study.html?study=${encodeURIComponent(id)}`);
const areaURL = id => url(`research/${id}/`);
const more = () => t('Show more', '展开更多');
const less = () => t('Show less', '收起');
const link = (path, text, cls = 'text-link') => `<a class="${cls}" href="${esc(url(path))}">${text}<span aria-hidden="true"> ↗</span></a>`;
const kicker = text => `<p class="eyebrow">${text}</p>`;
const head = (label, title, lead = '') => `<section class="page-head wrap">${kicker(label)}<h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</section>`;
const sectionHead = (label, title, extra = '') => `<div class="section-heading"><div>${kicker(label)}<h2>${title}</h2></div>${extra}</div>`;
const slogan = () => '<span class="handwritten">wonder for science, wonders in life</span>';
function brand(big = false) {
  return `<div class="brand-lockup ${big ? 'brand-large' : ''}">
    ${data.logo ? `<span class="brand-picture"><img src="${url(data.logo)}" alt="${t('W-shaped nucleic acid logo', 'W 形核酸标志')}" ${big ? 'fetchpriority="high"' : ''}></span>` : ''}
    <span class="brand-words"><strong>Aptomics & Cell Atlas</strong><span lang="zh">功能核酸组学团队</span></span></div>`;
}
function header() {
  const active = page.startsWith('area') || page.startsWith('study') || page === 'tools' ? 'research'
    : page === 'publications' ? 'discoveries' : ['pi', 'person', 'activity'].includes(page) ? 'minds' : page.startsWith('news:') ? 'news' : page;
  return `<header class="site-header"><div class="header-inner">
    <div class="header-brand"><a class="brand-home" href="${url('')}" aria-label="Aptomics & Cell Atlas Home">${brand()}</a>
    <span class="brand-divider" aria-hidden="true"></span><img class="header-institution" src="${url('assets/branding/HIMCASlogo2.png')}" alt="${t('Hangzhou Institute of Medicine, CAS', '中国科学院杭州医学研究所')}"></div>
    <div class="header-actions"><button id="menu" class="plain-button menu-toggle" aria-controls="nav" aria-expanded="false">${t('Menu', '菜单')}</button>
    <nav id="nav" aria-label="${t('Main navigation', '主导航')}">${[['', 'Vision'], ['research', 'Research'], ['discoveries', 'Discoveries'], ['minds', 'Minds'], ['news', 'Latest News'], ['join-us', 'Join Us']].map(([route, name]) =>
      `<a href="${url(route ? route + '/' : '')}" ${active === (route === 'join-us' ? 'join' : route || 'home') ? 'aria-current="page"' : ''}>${name}</a>`).join('')}</nav>
    <button id="language" class="plain-button language" aria-label="${t('Switch to Chinese', 'Switch to English')}">${t('中文', 'EN')}</button>
    <button id="theme-toggle" class="plain-button theme-toggle" type="button"></button></div>
    </div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="wrap footer-grid"><div><a class="footer-brand" href="${url('')}" aria-label="Aptomics & Cell Atlas Home"><span class="brand-picture"><img src="${url(data.logo)}" alt="" loading="lazy"></span><span class="footer-brand-name">Aptomics & Cell Atlas</span></a><p>功能核酸组学团队</p><p>${slogan()}</p></div>
    <div><p class="eyebrow">${t('Based in Hangzhou', '立足杭州')}</p>
    <p><a href="https://www.him.cas.cn/" target="_blank" rel="noopener noreferrer">${t('Hangzhou Institute of Medicine<br>Chinese Academy of Sciences', '中国科学院杭州医学研究所')}</a><br>${t('150 Dongfang Street, Hangzhou, China', '杭州市钱塘区东方街 150 号')}</p></div>
    <div><p class="eyebrow">${t('Stay connected', '保持联系')}</p><a href="mailto:wuqin@him.cas.cn">wuqin@him.cas.cn</a><div class="footer-links">
    ${link('', 'Vision')}${link('research/', 'Research')}${link('discoveries/', 'Discoveries')}${link('minds/', 'Minds')}${link('join-us/', 'Join Us')}${link('news/', 'News')}${link('discoveries/publications/', 'All Publications')}${link('minds/#culture', 'Culture')}${link('research/tools/', 'Tools & Resources')}</div></div></div>
    <div class="wrap footer-bottom"><span>© 2026 Aptomics & Cell Atlas</span><span>${t('Recognition. Discovery. Possibility.', '识别 · 发现 · 可能')}</span><a href="#top">${t('Back to top ↑', '返回顶部 ↑')}</a></div></footer>`;
}
function scienceCard(s, number = '') {
  const article = local(s.article);
  return `<article class="science-card"><a class="figure-link" href="${studyURL(s.id)}"><img src="${url(s.cover)}" alt="${esc(article.title)}" loading="lazy"></a>
    <div class="card-content"><p class="eyebrow">${esc(number)} ${esc(s.journal)} · ${s.year}</p><h3><a href="${studyURL(s.id)}">${esc(article.title)}</a></h3>
    <p>${esc(article.paragraphs[0])}</p><a class="text-link" href="${studyURL(s.id)}">${t('Read the discovery', '阅读研究故事')} ↗</a></div></article>`;
}
function home() {
  return `<section class="home-hero"><div class="wrap hero-grid"><div class="hero-copy">${kicker('FUNCTIONAL NUCLEIC ACIDS & OMICS')}
    <h1>${t('Probing Biology.<br><em>Engineering Function.</em>', '探知生命。<br><em>创造功能。</em>')}</h1>
    <p class="lead">${t('We turn molecular recognition into new ways to read, understand and reprogram biology.', '我们将分子识别转化为读取、理解与调控生命的新方法。')}</p>
    <div class="button-row">${link('research/', t('Explore research', '探索研究'), 'button')}${link('minds/', t('Meet the minds', '认识研究者'), 'button outline')}</div></div>
    <div class="hero-art">${brand(true)}<p class="hero-slogan">${slogan()}</p></div></div>
    <div class="hero-bottom wrap"><span>CHEMISTRY × BIOLOGY × COMPUTATION × MEDICINE</span><a href="#vision">${t('A closer look ↓', '继续探索 ↓')}</a></div></section>
    <section class="wrap section" id="vision">${kicker('OUR SCIENTIFIC VISION')}<p class="large-text">${t('Molecular recognition as a general strategy to understand and control biology.', '以分子识别为通用策略，理解与调控生命系统。')}</p>
    <div class="principles">${[
      ['Recognize', '识别', 'Discover molecular interactions and develop probes that help us see biological systems in new ways.', '发现分子相互作用，开发帮助我们以新视角观察生命系统的探针。'],
      ['Decode', '解码', 'Connect molecular measurements with biological context to understand cellular states and disease.', '将分子测量与生物学背景相结合，理解细胞状态与疾病。'],
      ['Reprogram', '重塑', 'Engineer functional nucleic acids to explore new ways of regulating biological activity.', '通过功能核酸工程，探索调控生物学活动的新方式。']
    ].map(([en, zh, p, z]) => `<article><h3>${en}</h3>${lang === 'zh' ? `<p class="eyebrow">${zh}</p>` : ''}<p>${t(p, z)}</p></article>`).join('')}</div>
    </section>
    <section class="section vision-research" id="home-research"><div class="wrap">${sectionHead('01 / RESEARCH', 'Research', link('research/', t('Explore research', '探索研究')))}
    <div class="research-constellation"><div class="molecular-field" aria-hidden="true"><svg viewBox="0 0 100 100" class="molecular-fragment fragment-dna"><path d="M28 5 C85 30 15 70 72 95 M72 5 C15 30 85 70 28 95 M34 12 L66 12 M43 25 L57 25 M39 39 L61 39 M28 52 L72 52 M39 65 L61 65 M43 79 L57 79 M34 91 L66 91"/></svg><svg viewBox="0 0 100 100" class="molecular-fragment fragment-ring"><path d="M25 30 L50 15 L75 30 L75 60 L50 75 L25 60 Z M32 34 L50 23 M67 34 L67 56 M50 67 L33 57 M75 30 L92 20 M25 60 L8 70 M50 75 L50 94"/><circle cx="92" cy="20" r="3"/><circle cx="8" cy="70" r="3"/></svg><svg viewBox="0 0 100 100" class="molecular-fragment fragment-chain"><path d="M10 65 L30 45 L50 58 L70 35 L90 45 M30 45 L25 20 M70 35 L68 12 M50 58 L54 85"/><circle cx="10" cy="65" r="4"/><circle cx="25" cy="20" r="4"/><circle cx="68" cy="12" r="4"/><circle cx="90" cy="45" r="4"/><circle cx="54" cy="85" r="4"/></svg><svg viewBox="0 0 100 100" class="molecular-fragment fragment-bases"><path d="M20 30 L44 16 L68 30 L68 58 L44 72 L20 58 Z M68 30 L91 39 L88 64 L68 58 M27 34 L44 24 M27 54 L44 64 M76 35 L85 40 M44 72 L44 91"/><circle cx="44" cy="91" r="3"/></svg><svg viewBox="0 0 100 100" class="molecular-fragment fragment-hairpin"><path d="M38 93 V48 C8 5 92 5 62 48 V93 M38 54 H62 M38 65 H62 M38 76 H62 M38 87 H62"/><circle cx="38" cy="93" r="3"/><circle cx="62" cy="93" r="3"/></svg><svg viewBox="0 0 100 100" class="molecular-fragment fragment-cluster"><path d="M50 50 L18 25 M50 50 L82 22 M50 50 L78 80 M50 50 L20 82"/><circle cx="50" cy="50" r="9"/><circle cx="18" cy="25" r="6"/><circle cx="82" cy="22" r="5"/><circle cx="78" cy="80" r="7"/><circle cx="20" cy="82" r="4"/></svg><svg viewBox="0 0 100 100" class="molecular-fragment fragment-backbone"><path d="M12 70 L30 52 L48 65 L66 42 L85 54 M30 52 V25 M66 42 V15 M35 52 V25"/><circle cx="12" cy="70" r="4"/><circle cx="85" cy="54" r="5"/><circle cx="66" cy="12" r="3"/></svg><svg viewBox="0 0 100 100" class="molecular-fragment fragment-pentagon"><path d="M50 12 L85 38 L72 80 H28 L15 38 Z M50 12 V3 M85 38 H97 M28 80 L19 95 M23 41 L33 70 M57 22 L75 37"/><circle cx="19" cy="95" r="3"/></svg></div>
    <div class="constellation-core"><h2>${t('<span>One vision.</span><span>Four directions.</span>', '<span>一个愿景，</span><span>四个方向。</span>')}</h2></div>
    ${data.areas.map((a, i) => `<a class="vision-direction constellation-card" data-direction="${a.id}" href="${areaURL(a.id)}"><span class="eyebrow">0${i + 1}<span aria-hidden="true">↗</span></span><img src="${url(`assets/research-concepts/${a.id}.png`)}" alt="" loading="lazy"><h3>${esc(a.title)}</h3><p>${esc(local(a.subtitle))}</p><span class="direction-detail">${esc(local(a.lead))}</span></a>`).join('')}</div></div></section>
    <section class="section" id="home-discoveries-section"><div class="wrap">${sectionHead('02 / DISCOVERIES', 'Discoveries', link('discoveries/publications/', t('Browse publications', '查看全部论文')))}<p>${t('From questions to discoveries.', '从问题走向发现。')}</p>
    ${carousel(['spark-seq', 'apt-seq', 'blocker-selex'].map((id, i) => scienceCard(findStudy(id), `0${i + 1} /`)), 'home-discoveries')}</div></section>
    <section class="section" id="home-minds"><div class="wrap">${sectionHead('03 / MINDS', 'Minds', link('minds/', t('Meet the researchers', '认识研究者')))}<p>${t('Different minds. Shared curiosity. Meet the people behind the discoveries.', '不同的思维，共同的好奇心。走近发现背后的研究者。')}</p><div class="home-interviews">${data.researchers.map(r => `<a class="home-interview" href="${url(`minds/story.html?person=${r.id}`)}"><img src="${url(r.portrait)}" alt="${esc(r[lang])}" loading="lazy"><div><h3>${esc(r[lang])}</h3><p>${esc(r.study === 'spark-seq' ? 'SPARK-seq' : r.study === 'apt-seq' ? 'Apt-seq' : 'Blocker-SELEX')}</p><span class="text-link">${r.story ? t('Read the interview', '阅读访谈') : t('Read the research story', '阅读研究故事')} ↗</span></div></a>`).join('')}</div></div></section>
    <section class="section news-band"><div class="wrap">${sectionHead('04 / LATEST NEWS', 'Latest News', link('news/', t('All news', '全部新闻')))}${newsCarousel(data.news.slice(0, 5), 'home-news')}</div></section>
    ${joinCallout(true)}`;
}
function joinCallout(home = false) {
  return `<section><a class="join-callout publications-callout" href="${url('join-us/')}" aria-labelledby="join-callout-title"><div class="wrap publications-callout-inner"><div>${kicker(home ? '05 / JOIN US' : 'YOUR NEXT CHAPTER')}<h2 id="join-callout-title">${t('Bring your curiosity. Join us.', '带上你的好奇心，加入我们。')}</h2><p>${t('Shape the next discovery with us.', '与我们一起，开启下一次发现。')}</p></div><span class="publications-callout-arrow" aria-hidden="true">&rarr;</span></div></a></section>`;
}
function research() {
  return `${head('RESEARCH / FOUR CONNECTED DIRECTIONS', t('From recognition<br>to <em>regulation.</em>', '从分子识别<br>到<em>功能调控。</em>'), t('We uncover molecular interactions and engineer functional nucleic acids for biology and medicine.', '我们揭示分子相互作用，设计与构建功能核酸，服务于生物学与医学。'))}
    <div class="wrap section">${data.areas.map((a, i) => `<section class="research-row"><div><h2><a href="${areaURL(a.id)}">${a.title}</a></h2>${lang === 'zh' ? `<h3 lang="zh">${esc(a.subtitle.zh)}</h3><p lang="en"><em>${esc(a.subtitle.en)}</em></p>` : `<h3>${esc(a.subtitle.en)}</h3>`}<p>${esc(local(a.lead))}</p>
      <p class="small-note research-keywords" lang="en">${a.keywords.map(esc).join(' · ')}</p>
      ${lang === 'zh' ? `<p class="small-note research-backgrounds">${esc(a.overviewZh.backgrounds)}</p>` : ''}${link(`research/${a.id}/`, t('Explore this direction', '探索研究方向'), 'button outline')}</div>
      ${figureCarousel(a, i)}</section>`).join('')}</div>
    <section class="soft section"><div class="wrap">${sectionHead('METHODS & RESOURCES', 'Tools & Resources')}<p>${t('Explore the methods through their publications. Standalone software links will be added when available.', '通过论文了解研究方法。独立工具链接将在准备好后补充。')}</p>${link('research/tools/', t('Explore methods', '查看研究方法'))}</div></section>`;
}
function figureCarousel(area, i) {
  return carousel(area.studies.map(id => {
    const s = findStudy(id);
    return `<article class="theme-slide"><a href="${studyURL(id)}"><img src="${url(s.cover)}" alt="${esc(local(s.article).title)}" loading="lazy"><div><p class="eyebrow">${s.journal} · ${s.year}</p><h3>${esc(local(s.article).title)}</h3></div></a></article>`;
  }), `theme-${area.id}`, false, 4000 + i * 500);
}
function areaPage(id) {
  const a = data.areas.find(a => a.id === id);
  if (!a) return notFound();
  const studies = a.studies.map(findStudy);
  const featured = a.focus.featured.map(findStudy);
  const remaining = studies.filter(s => !a.focus.featured.includes(s.id));
  const contextual = remaining.filter(s => ['molecular-medicine-era', 'prmt-review', 'drug-resistance-protocol'].includes(s.id));
  const related = remaining.filter(s => !contextual.includes(s));
  const publicationList = items => items.map(s => `<article class="direction-paper"><div><p class="eyebrow">${esc(s.journal)} · ${s.year}</p><h3><a href="${studyURL(s.id)}">${esc(local(s.article).title)}</a></h3><p>${esc(s.publication.title)}</p></div>${link(`discoveries/study.html?study=${encodeURIComponent(s.id)}`, t('Read study', '阅读研究'), 'text-link')}</article>`).join('');
  return `${head('RESEARCH / ' + a.title.toUpperCase(), a.title, `${esc(a.subtitle.en)}${lang === 'zh' ? `<br><span lang="zh">${esc(a.subtitle.zh)}</span>` : ''}`)}
    <section class="wrap direction-focus" aria-labelledby="direction-focus-title"><div class="direction-focus-copy">${kicker(t('RESEARCH FOCUS', '研究重点'))}<h2 id="direction-focus-title">${esc(local(a.focus.heading))}</h2><p>${esc(local(a.lead))}</p><ul class="direction-topics">${local(a.focus.topics).map(topic => `<li>${esc(topic)}</li>`).join('')}</ul></div>
      <figure class="direction-focus-art"><img src="${url(`assets/research-concepts/${a.id}.png`)}" alt="${esc(local(a.focus.heading))}" fetchpriority="high"></figure>
      <ol class="direction-process" aria-label="${t('Research approach', '研究思路')}">${local(a.focus.steps).map(step => `<li>${esc(step)}</li>`).join('')}</ol></section>
    <section class="wrap section direction-results">${sectionHead(t('SELECTED RESEARCH', '代表性研究'), t('Research in focus', '代表性成果'))}<div class="direction-result-list">${featured.map(s => directionResult(s, a)).join('')}</div>
      ${related.length ? `<details class="direction-more"><summary>${t('More related studies', '更多相关研究')} <span>(${related.length})</span></summary><div>${publicationList(related)}</div></details>` : ''}
      ${contextual.length ? `<details class="direction-more"><summary>${t('Reviews, perspectives & protocols', '相关综述、观点与实验方法')} <span>(${contextual.length})</span></summary><div>${publicationList(contextual)}</div></details>` : ''}</section>
    <section class="wrap section">${sectionHead('CONNECTED DIRECTIONS', t('Keep exploring.', '继续探索。'))}<div class="tag-row">${data.areas.filter(x => x.id !== id).map(x => link(`research/${x.id}/`, x.title, 'button outline')).join('')}</div></section>`;
}
function directionResult(s, area) {
  const article = local(s.article);
  const figure = s.figureSource;
  const imagePath = s.cover || `assets/research-concepts/${area.id}.png`;
  const caption = s.cover
    ? t(`Publication figure${figure ? ` · ${figure.figure} · PDF p. ${figure.page}` : ''}`, `论文配图${figure ? ` · ${figure.figure} · PDF 第 ${figure.page} 页` : ''}`)
    : t('Concept placeholder · publication figure to be added', '示意图占位 · 待替换为论文图片');
  return `<article class="direction-result"><figure><a href="${s.cover ? url(s.pdf) + (figure ? '#page=' + figure.page : '') : studyURL(s.id)}" aria-label="${esc(t('View figure source: ', '查看图片出处：') + article.title)}"><img src="${url(imagePath)}" alt="${esc(s.cover ? caption + ': ' + article.title : caption)}" loading="lazy"></a><figcaption>${esc(caption)}</figcaption></figure>
    <div class="direction-result-copy"><p class="eyebrow">${esc(s.journal)} · ${s.year}</p><h3><a href="${studyURL(s.id)}">${esc(article.title)}</a></h3><p class="direction-result-summary">${esc(article.paragraphs[1] || article.paragraphs[0])}</p><p class="direction-result-citation">${esc(s.citation)}<br>${esc(s.publication.title)}</p><div class="direction-result-links">${link(`discoveries/study.html?study=${encodeURIComponent(s.id)}`, t('Explore this study', '了解这项研究'), 'text-link')}<a class="text-link" href="${esc(s.doiUrl)}" target="_blank" rel="noopener">DOI ↗</a><a class="text-link" href="${url(s.pdf)}" target="_blank" rel="noopener">${t('Read paper', '阅读原文')} ↗</a></div></div></article>`;
}
function studyPage(id, person = null) {
  const s = findStudy(id);
  if (!s) return notFound();
  const article = local(s.article);
  const researchers = data.researchers.filter(r => r.study === id);
  return `<div class="wrap breadcrumbs">${link('research/', 'Research')}<span>/</span>${link('discoveries/', 'Discoveries')}</div>
    ${head(person ? `MEET THE DISCOVERERS / ${esc(person[lang])}` : `${esc(s.journal)} / ${s.year}`, esc(article.title), person ? t(`A research story with ${person.en}.`, `${person.zh}参与的研究故事。`) : '')}
    ${person?.portrait ? `<figure class="wrap story-person"><img src="${url(person.portrait)}" alt="${esc(person[lang])}"><figcaption>${esc(person[lang])} · ${t('The researcher behind the story', '研究故事中的成员')}</figcaption></figure>` : ''}
    <article class="wrap article-layout"><aside><p class="eyebrow">${t('Publication', '论文信息')}</p><p>${esc(s.publication.title)}</p><p>${esc(s.citation)}</p><p>${esc(s.journal)} · ${s.year}</p><div class="article-links"><a href="${esc(s.doiUrl)}" target="_blank" rel="noopener">DOI ↗</a><a href="${url(s.pdf)}" target="_blank" rel="noopener">${t('Read PDF', '阅读 PDF')} ↗</a></div>
    ${authorList(s)}<div class="tag-row">${s.areas.map(id => `<a class="tag" href="${areaURL(id)}">${data.areas.find(a => a.id === id).title}</a>`).join('')}</div>
    ${researchers.length && !person ? `<p class="eyebrow">MEET THE DISCOVERERS</p>${researchers.map(r => link(`minds/story.html?person=${r.id}`, esc(r[lang]))).join('')}` : ''}</aside>
    <div class="prose"><figure><img src="${url(s.cover)}" alt="${esc(article.title)}"><figcaption>${t('Representative figure from the publication. See the original paper for figure captions and experimental details.', '论文代表性图像；图注与实验细节请参阅原文。')}</figcaption></figure>
    ${article.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}
    ${person ? `<p class="editorial-note">${t('This story describes the published research, not a personal interview. Author roles and shared contributions should be read in the original paper.', '本文基于已发表研究撰写，并非个人访谈。作者分工与共同贡献请参阅原论文。')}</p>` : ''}
    <div class="paper-end"><p>${esc(s.publication.title)}</p><a class="button" href="${url(s.pdf)}" target="_blank" rel="noopener">${t('Read the paper', '阅读论文')} ↗</a></div></div></article>
    <section class="section wrap">${sectionHead('RELATED STUDIES', t('Follow the connections.', '探索相关研究。'))}<div class="feature-grid">${s.related.filter(id => findStudy(id)).slice(0, 3).map(id => scienceCard(findStudy(id))).join('')}</div></section>`;
}
function discoveries() {
  return `${head('DISCOVERIES / SELECTED RESEARCH', t('Questions become<br><em>possibilities.</em>', '让问题<br>成为<em>新的可能。</em>'), t('Stories of molecular recognition, new measurements and functional interventions.', '关于分子识别、新型测量与功能干预的研究故事。'))}
    <section class="wrap section"><div class="discovery-list">${['spark-seq', 'apt-seq', 'blocker-selex'].map(id => scienceCard(findStudy(id))).join('')}</div></section>
    <section><a class="soft section publications-callout" href="${url('discoveries/publications/')}" aria-labelledby="all-publications-title"><div class="wrap publications-callout-inner"><div>${kicker('THE COMPLETE RECORD')}<h2 id="all-publications-title">All Publications</h2></div><span class="publications-callout-arrow" aria-hidden="true">&rarr;</span></div></a></section>`;
}
function authorList(s) {
  const authors = s.publication.authorList;
  const source = s.publication.authorSource;
  return `<details class="full-authors"><summary>${t('All authors', '完整作者')} (${authors.length})</summary>
    <p>${authors.map(a => `${esc(a.name)}${a.equal ? '<sup>†</sup>' : ''}${a.corresponding ? '<sup>*</sup>' : ''}`).join('; ')}</p>
    <p class="small-note">${t('Site notation: † Equal contribution; * Corresponding author.', '本站统一标记：† 共同贡献；* 通讯作者。')}</p>
    <a class="author-source" href="${url(source.pdf)}#page=${source.page}" target="_blank" rel="noopener">${t('Author list in original PDF', '原文作者名单')} · ${t('page', '页')} ${source.page} ↗</a>
    ${source.equalPage ? `<a class="author-source" href="${url(source.pdf)}#page=${source.equalPage}" target="_blank" rel="noopener">${t('Equal-contribution note', '共同贡献说明')} · ${t('page', '页')} ${source.equalPage} ↗</a>` : ''}</details>`;
}
function pubCard(s, mode) {
  return `<article class="pub-item"><a class="pub-media" href="${studyURL(s.id)}"><img class="pub-cover" src="${url(mode === 'figures' ? s.cover : s.paperCover)}" alt="${esc(s.publication.title)}" loading="lazy"></a>
    <p class="eyebrow">${esc(s.journal)} · ${s.year}</p><h3><a href="${studyURL(s.id)}">${esc(s.publication.title)}</a></h3><p class="pub-authors">${esc(s.citation)}</p>${authorList(s)}<div class="pub-links"><a href="${s.doiUrl}" target="_blank" rel="noopener">DOI ↗</a><a href="${url(s.pdf)}" target="_blank" rel="noopener">PDF ↗</a><a href="${studyURL(s.id)}">${t('Research story', '研究解读')} ↗</a></div></article>`;
}
function publications() {
  return `${head('DISCOVERIES / THE COMPLETE RECORD', 'All Publications', t('Read the papers. Follow the ideas.', '阅读论文，追寻科学思路。'))}
    <section class="wrap section publication-section"><form id="filters" class="filter-bar" role="search">
    <label>${t('Search', '搜索')}<input type="search" id="query" name="q" placeholder="${t('Title, author, DOI…', '标题、作者、DOI…')}" value="${esc(params().get('q') || '')}"></label>
    <label>${t('Year', '年份')}<select id="year" name="year"><option value="">${t('All years', '全部年份')}</option>${[...new Set(data.studies.map(s => s.year))].map(y => `<option value="${y}" ${params().get('year') === y ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
    <label>${t('Direction', '方向')}<select id="area" name="area"><option value="">${t('All directions', '全部方向')}</option>${data.areas.map(a => `<option value="${a.id}" ${params().get('area') === a.id ? 'selected' : ''}>${a.title}</option>`).join('')}</select></label>
    <button class="plain-button" type="button" id="clear-filters">${t('Clear filters', '清除筛选')}</button></form>
    <div class="publication-controls"><p id="result-count" role="status"></p><div class="segmented" role="group" aria-label="${t('Image mode', '图片模式')}"><button data-mode="covers">${t('Paper covers', '论文封面')}</button><button data-mode="figures">${t('Important subfigures', '重要子图')}</button></div></div>
    <div id="pub-results"></div></section>`;
}
function personStory(person) {
  const story = local(person.story);
  const study = findStudy(person.study);
  return `<div class="wrap breadcrumbs">${link('minds/', 'Minds')}</div>
    ${head('MINDS / MEET THE DISCOVERERS', esc(person[lang]))}
    <article class="wrap article-layout personal-story"><aside><figure class="person-portrait"><img src="${url(person.story.portrait)}" alt="${esc(t(`Portrait of ${person.en}`, `${person.zh}肖像`))}" fetchpriority="high"></figure><p class="eyebrow">${esc(person.study === 'apt-seq' ? 'Apt-seq' : 'SPARK-seq')}</p><div class="article-links"><a href="${url(study.pdf)}" target="_blank" rel="noopener">${t('Read the paper', '阅读论文')} ↗</a></div></aside>
    <div class="prose">${story.sections.map((section, i) => `<div class="personal-story-section"><p>${esc(section.body)}</p>${person.id === 'guoyan-luo' && i === 1 ? `<figure class="story-gallery"><img src="${url('assets/minds/guoyan-luo/discussion.png')}" alt="${t('Research discussion', '科研交流')}" loading="lazy"></figure>` : ''}</div>`).join('')}</div></article><section class="wrap section story-related">${scienceCard(study)}</section>${joinCallout()}`;
}
function researchers() {
  return `<div class="researcher-grid">${data.researchers.map((r, i) => {
    const s = findStudy(r.study);
    return `<a class="researcher-card portrait-background" href="${url(`minds/story.html?person=${r.id}`)}"><div class="researcher-number">0${i + 1} / DISCOVERER</div><h3>${esc(r[lang])}</h3><p class="researcher-alt">${esc(r[lang === 'zh' ? 'en' : 'zh'])}</p>
    ${r.portrait ? `<img class="researcher-portrait" src="${url(r.portrait)}"  alt="${esc(t(`Portrait of ${r.en}`, `${r.zh}的照片`))}" loading="lazy">` : ''}
    <div class="researcher-science"><span class="eyebrow">${s.journal} · ${s.year}</span><h4>${esc(local(s.article).title)}</h4><p>${esc(local(s.article).paragraphs[0])}</p></div><span class="text-link">${t('Read the research story', '阅读研究故事')} ↗</span></a>`;
  }).join('')}</div>`;
}
function minds() {
  return `${head('MINDS / THE PEOPLE BEHIND DISCOVERY', t('Different minds.<br><em>Shared curiosity.</em>', '不同的思维，<br><em>共同的好奇心。</em>'), t('Science is driven by questions, shaped by ideas, and advanced by people.', '科学由问题驱动，由思想塑造，由人推动。'))}
    <section class="wrap section pi-panel">${kicker('01 / MEET THE PI')}<div class="intro"><div><figure class="pi-portrait pi-preview"><a class="pi-preview-link" href="${url('minds/pi/')}"><img src="${url('assets/minds/pi/qin-wu.webp')}" width="280" height="280" alt="${t('Portrait of Qin Wu', '吴芩研究员肖像')}" loading="lazy"></a></figure><h2>${t('Qin Wu', '吴芩')}</h2><p class="eyebrow">PRINCIPAL INVESTIGATOR</p><p>${t('Hangzhou Institute of Medicine<br>Chinese Academy of Sciences', '中国科学院杭州医学研究所')}</p></div><div><p class="large-text">${t('Connecting molecular tools with the complexity of living systems.', '连接分子工具与复杂的生命系统。')}</p><p>${t('Our research integrates chemical biology, molecular and cellular biology, and bioinformatics to understand cell states and develop new strategies for precision medicine.', '我们综合化学生物学、分子与细胞生物学及生物信息学方法，理解细胞状态，发展精准医学的新策略。')}</p>${link('minds/pi/', t('More about the PI', '了解研究负责人'))}</div></div></section>
    <section class="section soft"><div class="wrap">${sectionHead('02 / MEET THE DISCOVERERS', t('Every discovery has a story.', '每个发现，都有一个故事。'))}${researchers()}</div></section>
    <section id="origins" class="section wrap">${sectionHead('03 / WHERE WE COME FROM', t('Many journeys. One mission.', '不同的来路，共同的使命。'))}
    <p>${t('Our journeys meet in Hangzhou. Locations are grouped by province or municipality, without names or member counts.', '我们的旅程在杭州汇合。地图按省份或直辖市汇总，不关联姓名或公开成员人数。')}</p>
    <div class="origins-layout"><div id="origin-map" class="origin-map" aria-label="${t('Team origins by province', '团队家乡省份汇总')}"></div><div class="origin-panel"><div class="origin-list">${data.origins.locations.map(p => `<button data-province="${p.id}" class="origin-chip">${esc(p[lang])}</button>`).join('')}</div>
    <p id="origin-status" class="map-status" role="status"></p></div></div></section>
    <section id="culture" class="section soft"><div class="wrap">${sectionHead('04 / CULTURE', t('One team. All in.', '同一个团队，全心投入。'))}
    <div class="values">${[['Stay curious.', '保持好奇心。'], ['Think independently.', '独立思考。'], ['Create together.', '协同创造。'], ['Aim high.', '志存高远。']].map(([en, zh]) => `<span>${t(en, zh)}</span>`).join('')}</div>
    ${cultureMosaic()}${activityCarousel()}</div></section>${joinCallout()}`;
}
function pi() {
  const person = data.people[lang];
  const selectedStudies = data.studies.filter(s => ['cd4-aptamer-cells', 'spark-seq', 'apt-seq'].includes(s.id));
  return `<section class="wrap section pi-profile"><img class="pi-profile-portrait" src="${url('assets/minds/pi/qin-wu.webp')}" width="280" height="280" alt="${t('Portrait of Qin Wu', '吴芩研究员肖像')}"><div class="pi-profile-intro"><p class="eyebrow">MINDS / MEET THE PI</p><p class="eyebrow">${t('PRINCIPAL INVESTIGATOR', '课题组负责人')}</p><h1>${esc(person['people.pi.name'])}</h1><p class="large-text">${t('Connecting molecular tools with the complexity of living systems.', '连接分子工具与复杂的生命系统。')}</p><p>${t('Hangzhou Institute of Medicine<br>Chinese Academy of Sciences', '中国科学院杭州医学研究所')}</p><div class="button-row">${link('research/', t('Explore Research', '探索研究'), 'button outline')}<a class="button outline" href="mailto:wuqin@him.cas.cn">${t('Get in touch', '邮件联系')}</a></div></div></section>
    <section class="wrap section pi-bio-grid"><article><p class="eyebrow">${t('ACADEMIC PROFILE', '学术简介')}</p><h2>${t('Appointments and honors', '任职与荣誉')}</h2><p>${esc(person['people.pi.bio1'])}</p></article><article><p class="eyebrow">${t('RESEARCH', '研究方向')}</p><h2>${t('Research and contributions', '研究与学术贡献')}</h2><p>${esc(person['people.pi.bio2'])}</p></article></section>
    <section class="wrap section pi-selected"><div class="section-heading"><div><p class="eyebrow">${t('SELECTED PUBLICATIONS', '代表性论文')}</p><h2>${t('Selected studies', '代表性研究')}</h2></div></div><div class="pi-selected-grid">${selectedStudies.map(s => `<article><p class="eyebrow">${esc(s.journal)} · ${esc(s.year)}</p><h3><a href="${studyURL(s.id)}">${esc(local(s.article).title)}</a></h3><p>${esc(s.publication.title)}</p><p class="pi-publication-authors">${esc(s.citation)}</p><div class="button-row">${link(`discoveries/study.html?study=${encodeURIComponent(s.id)}`, t('Read study', '阅读研究解读'))}<a class="text-link" href="${esc(s.doiUrl)}" target="_blank" rel="noopener">DOI ↗</a></div></article>`).join('')}</div></section><section class="wrap section pi-signoff">${slogan()}</section>`;
}
function carousel(slides, id, vertical = false, delay = 4000, expandable = false) {
  return `<div class="carousel ${vertical ? 'vertical' : ''}" id="${id}" data-delay="${delay}" data-expandable="${expandable}">
    <div class="carousel-window"><div class="carousel-track">${slides.map((s, i) => `<div class="slide" ${i ? 'inert aria-hidden="true"' : ''}>${s}</div>`).join('')}</div></div>
    <div class="carousel-dots" aria-label="${t('Choose a slide', '选择幻灯片')}">${slides.map((_, i) => `<button class="dot ${i ? '' : 'active'}" data-slide="${i}" aria-label="${t('Slide', '第')} ${i + 1}" aria-pressed="${!i}"></button>`).join('')}</div>
    ${expandable ? `<div class="carousel-actions"><button class="plain-button expand" aria-expanded="false">${more()}</button></div>` : ''}</div>`;
}
const newsCategories = {
  research: { en: 'Research', zh: '研究进展' }, recognition: { en: 'Recognition', zh: '荣誉进展' },
  people: { en: 'People & Training', zh: '人才培养' }, culture: { en: 'Lab Life', zh: '团队活动' }
};
function newsDate(date) {
  if (/^\d{4}$/.test(date)) return date;
  const monthOnly = date.length === 7;
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', ...(monthOnly ? {} : { day: 'numeric' }), timeZone: 'UTC' }).format(new Date(date + (monthOnly ? '-01' : '') + 'T00:00:00Z'));
}
function newsMedia(n) {
  const image = n.image || 'assets/placeholders/news-' + (n.category === 'research' ? 'research' : n.category === 'recognition' ? 'recognition' : 'people') + '.svg';
  return '<img src="' + url(image) + '" alt="' + esc(local(n.caption) || local(n).title) + '" loading="lazy" class="media-' + esc(n.imageFit || 'photo') + '">';
}
function newsCard(n, featured = false) {
  const kind = newsCategories[n.category] || newsCategories.people;
  return `<article class="news-card ${featured ? 'news-card--featured' : ''}"><a class="news-card-media" href="${url(`news/${n.id}.html`)}">${newsMedia(n)}</a><div class="news-card-copy"><p class="eyebrow"><span>${t(kind.en, kind.zh)}</span><time datetime="${esc(n.date)}">${n.dateKind === 'record' ? t('Archive: ', '记录：') : ''}${newsDate(n.date)}</time></p><h3><a href="${url(`news/${n.id}.html`)}">${esc(local(n).title)}</a></h3><p class="news-summary">${esc(local(n).summary)}</p>${link(`news/${n.id}.html`, t('Read the story', '阅读新闻'))}</div></article>`;
}
function newsCarousel(items, id) {
  return carousel(items.map(n => newsCard(n)), id);
}
function culturePhotos() {
  const photos = [
    { image: 'assets/minds/group.webp', caption: t('Lab group photograph', '课题组合影') },
    { image: 'assets/minds/lab-work.webp', caption: t('Research in the laboratory', '实验室中的研究工作') },
    { image: 'assets/minds/institute.webp', caption: t('Hangzhou Institute of Medicine campus', '杭州医学所院区') },
    ...data.activities.filter(a => a.image).map(a => ({ image: a.image, caption: local(a).title })),
    ...data.activityRecords.flatMap(a => (a.gallery || []).map(p => ({ image: p.image, caption: local(p.caption) || local(a).title })))
  ];
  return photos.filter((p, i) => photos.findIndex(other => other.image === p.image) === i);
}
function cultureMosaic() {
  return `<div class="culture-mosaic" aria-label="${t('Life in the lab photo gallery', '团队生活照片墙')}">${culturePhotos().slice(0, 6).map((p, i) => `<div class="culture-tile" data-photo="${i}"><img src="${url(p.image)}" alt="${esc(p.caption)}" loading="lazy"></div>`).join('')}</div>`;
}
function activityCarousel() {
  return carousel(data.activities.map(a => `<article class="activity-cover activity-background">${a.image ? `<img class="activity-background-image" src="${url(a.image)}" alt="" loading="lazy">` : ''}<div class="activity-background-copy"><p class="eyebrow">${esc(local(a).date)}</p><h3>${esc(local(a).title)}</h3><p>${esc(local(a).summary)}</p>${link('minds/activity.html?id=' + a.id, t('View activity & photos', '查看活动与照片'))}</div></article>`), 'culture-slides', true, 4500, false) + `<div class="carousel-actions">${link('minds/culture/', more(), 'plain-button')}</div>`;
}
function culturePage() {
  return `${head('MINDS / CULTURE', 'Culture', t('Shared moments, gatherings and life in the lab.', '记录团队相聚、共同成长与科研生活。'))}<section class="section wrap"><div class="news-grid">${data.activities.map(a => `<article class="news-card"><a class="news-card-media" href="${url('minds/activity.html?id=' + a.id)}"><img src="${url(a.image || 'assets/placeholders/news-people.svg')}" alt="${esc(local(a).title)}" loading="lazy"></a><div class="news-card-copy"><p class="eyebrow">${esc(local(a).date)}</p><h3><a href="${url('minds/activity.html?id=' + a.id)}">${esc(local(a).title)}</a></h3><p class="news-summary">${esc(local(a).summary)}</p>${link('minds/activity.html?id=' + a.id, t('View activity & photos', '查看活动与照片'))}</div></article>`).join('')}</div></section>`;
}
function activityPage() {
  const a = data.activities.find(a => String(a.id) === params().get('id'));
  if (!a) return notFound();
  const record = data.activityRecords.find(n => n.id === a.news);
  return head('MINDS / CULTURE / ' + esc(local(a).date), esc(local(a).title)) + '<section class="wrap section prose standalone">' + (a.image ? '<figure class="activity-record-photo"><img src="' + url(a.image) + '" alt="' + esc(record ? local(record.caption) : local(a).title) + '"><figcaption>' + esc(record ? local(record.caption) : local(a).title) + '</figcaption></figure>' : '') + (record ? '<div>' + local(record).body + '</div>' + newsExtras(record) : '<p>' + esc(local(a).summary) + '</p>') + link('minds/#culture', t('Back to Culture', '返回团队文化')) + '</section>';
}
function newsExtras(n) {
  const gallery = (n.gallery || []).map(photo => '<figure><a href="' + url(photo.image) + '" target="_blank" rel="noopener"><img src="' + url(photo.image) + '" alt="' + esc(local(photo.caption)) + '" loading="lazy"></a><figcaption>' + esc(local(photo.caption)) + '</figcaption></figure>').join('');
  const study = n.study ? findStudy(n.study) : null;
  return (gallery ? '<section class="news-gallery">' + (n.id === 'iupac-breakfast-hangzhou-2026' ? '' : '<h2>' + t('In pictures', '图像记录') + '</h2>') + '<div class="news-gallery-grid">' + gallery + '</div></section>' : '')
    + (study ? '<div class="news-study-link">' + link('discoveries/study.html?study=' + encodeURIComponent(study.id), t('Explore the related research', '阅读相关研究')) + '</div>' : '');
}
function newsPage(id) {
  if (!id) return `${head('LAB NOTES / NEWS & MILESTONES', t('Latest News', '最新动态'), t('Discoveries, recognition and moments from the lab.', '记录团队的研究进展、荣誉与重要时刻。'))}<section class="section wrap"><div class="news-grid">${data.news.map(n => newsCard(n)).join('')}</div></section>`;
  const n = [...data.news, ...data.activityRecords].find(n => n.id === id);
  if (!n) return notFound();
  const body = local(n).body.replace(/<p><a class="tool-link"[\s\S]*?<\/p>/g, '')
    .replaceAll('Wu Lab', 'Aptomics & Cell Atlas').replaceAll('吴芩课题组', '功能核酸组学团队');
  return `${head('NEWS / ' + (n.dateKind === 'record' ? t('Archive date: ', '记录日期：') : '') + newsDate(n.date), esc(local(n).title))}<article class="section wrap prose standalone"><figure class="news-detail-media">${newsMedia(n)}${n.showCaption === false ? '' : `<figcaption>${esc(local(n.caption))}</figcaption>`}</figure><div class="news-detail-copy">${body || `<p>${esc(local(n).summary)}</p>`}</div>${newsExtras(n)}${link('news/', t('Back to News', '返回新闻'))}</article>`;
}
function toolsPage() {
  return `${head('RESEARCH / METHODS', 'Tools & Resources', t('Start with the published methods.', '从已发表的方法开始。'))}
    <section class="wrap section"><p class="editorial-note">${t('Software links are not included in this preview. The publications below describe the available research methods.', '本预览版暂不提供软件链接。以下论文介绍对应的研究方法。')}</p><div class="feature-grid">${['spark-seq', 'apt-seq', 'blocker-selex'].map(id => scienceCard(findStudy(id))).join('')}</div></section>`;
}
function join() {
  const d = data.join[lang];
  const p = key => d[`join.${key}`];
  return `${head('OPPORTUNITIES / 2026', 'Join Us')}
    <section class="wrap section join-intro"><h2>${t('Your curiosity.<br>Our next discovery.', '你的好奇心，<br>我们的下一次发现。')}</h2><p>${t('We welcome students and researchers working across chemistry, biology, computation and medicine.', '我们欢迎化学、生物、计算与医学等领域的学生和研究者。')}</p><a class="button" href="mailto:wuqin@him.cas.cn">wuqin@him.cas.cn ↗</a></section>
    <section class="soft section"><div class="wrap intro"><div>${kicker('01 / GRADUATE RESEARCH')}<h2>${p('students.title')}</h2><p>${p('students.lead')}</p></div><div>${[1, 2, 3].map(i => `<details class="admission"><summary>${p(`path${i}.title`)}</summary><p>${p(`path${i}.body`)}</p></details>`).join('')}<details class="admission"><summary>${p('joint.title')}</summary><p>${p('joint.body')}</p></details></div></div></section>
    <section class="section"><div class="wrap intro"><div>${kicker('02 / POSTDOCTORAL RESEARCH')}<h2>${p('postdoc.title')}</h2><p>${p('postdoc.lead')}</p></div>
    <div><details class="admission"><summary>${p('directions.title')}</summary>${[1, 2, 3].map(i => `<h3>${p(`dir${i}.title`)}</h3><p>${p(`dir${i}.body`)}</p>`).join('')}</details><details class="admission"><summary>${p('background.title')}</summary><p>${p('background.body')}</p></details><details class="admission"><summary>${p('requirements.title')}</summary><ul>${[1, 2, 3].map(i => `<li>${p(`req${i}`)}</li>`).join('')}</ul></details><details class="admission"><summary>${p('benefits.title')} · 2026</summary><ul>${[1, 2, 3].map(i => `<li>${p(`benefit${i}`)}</li>`).join('')}</ul><p>${p('benefits.note')}</p></details></div></div></section>
    <section class="join-callout" id="apply"><div class="wrap"><div>${kicker('03 / APPLY')}<h2>${p('apply.title')}</h2><p>${p('apply.body')}</p></div><a class="button light" href="mailto:wuqin@him.cas.cn?subject=${encodeURIComponent(t('Application 2026 - Name - Research direction', '2026 申请 - 姓名 - 研究方向'))}">${t('Start a conversation', '邮件联系')} ↗</a></div></section>`;
}
function notFound() {
  return `${head('404 / NOT FOUND', t('This story is not here.', '未找到这篇内容。'))}<div class="wrap section">${link('', t('Return home', '返回首页'), 'button')}</div>`;
}
function render() {
  cleanups.forEach(fn => fn()); cleanups = [];
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  let content;
  const [type, id] = page.split(':');
  switch (type) {
    case 'home': content = home(); break;
    case 'vision': content = home(); break;
    case 'research': content = research(); break;
    case 'area': content = areaPage(id); break;
    case 'study': content = studyPage(id || params().get('study')); break;
    case 'discoveries': content = discoveries(); break;
    case 'publications': content = publications(); break;
    case 'minds': content = minds(); break;
    case 'pi': content = pi(); break;
    case 'person': {
      const person = data.researchers.find(r => r.id === params().get('person'));
      content = person ? (person.story ? personStory(person) : studyPage(person.study, person)) : notFound(); break;
    }
    case 'activity': content = activityPage(); break;
    case 'culture': content = culturePage(); break;
    case 'news': content = newsPage(id); break;
    case 'tools': content = toolsPage(); break;
    case 'join': content = join(); break;
    default: content = notFound();
  }
  document.querySelector('#app').innerHTML = `<div id="top"></div>${header()}<main id="main">${content}</main>${footer()}`;
  document.title = `${document.querySelector('h1')?.textContent || 'Research'} | Aptomics & Cell Atlas`;
  const themeButton = document.querySelector('#theme-toggle');
  const updateThemeButton = () => {
    const mode = window.probeTheme?.mode || 'system';
    const labels = { system: t('Auto', '自动'), light: t('Light', '浅色'), dark: t('Dark', '深色') };
    const next = { system: 'light', light: 'dark', dark: 'system' }[mode];
    const dark = document.documentElement.dataset.theme === 'dark';
    document.querySelector('.header-institution').src = url(`assets/branding/${dark ? 'HIMCASlogo2-dark-v2.svg' : 'HIMCASlogo2.png'}`);
    const icon = dark
      ? '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
    themeButton.innerHTML = `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icon}</svg>`;
    themeButton.setAttribute('aria-label', t(`Theme: ${labels[mode]}. Switch to ${labels[next]}`, `配色：${labels[mode]}。切换为${labels[next]}`));
    themeButton.title = themeButton.getAttribute('aria-label');
  };
  themeButton.onclick = () => window.probeTheme?.cycle();
  window.addEventListener('themechange', updateThemeButton);
  cleanups.push(() => window.removeEventListener('themechange', updateThemeButton));
  updateThemeButton();
  document.querySelector('#language').onclick = () => {
    const y = scrollY;
    lang = lang === 'en' ? 'zh' : 'en'; storage.set('siteLang', lang);
    render(); window.scrollTo({ top: y, behavior: 'instant' });
    document.querySelector('#language').focus({ preventScroll: true });
  };
  const menu = document.querySelector('#menu');
  menu.onclick = () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    document.querySelector('#nav').classList.toggle('open', open);
  };
  menu.parentElement.onkeydown = event => {
    if (event.key === 'Escape') {
      menu.setAttribute('aria-expanded', 'false');
      document.querySelector('#nav').classList.remove('open'); menu.focus();
    }
  };
  initCarousels();
  initCultureMosaic();
  initVisionTransition();
  if (type === 'publications') initPublications();
  if (type === 'minds') initMap();
}
function initCultureMosaic() {
  const wall = document.querySelector('.culture-mosaic');
  if (!wall) return;
  const photos = culturePhotos();
  const tiles = [...wall.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer, finishTimer, incoming, activeTile, stopped = false, inView = !('IntersectionObserver' in window);
  const eligible = () => !stopped && inView && !document.hidden && !reduced.matches;
  const schedule = () => {
    clearTimeout(timer);
    if (eligible()) timer = setTimeout(update, 2200 + Math.random() * 2600);
  };
  function update() {
    if (!eligible()) return;
    activeTile = tiles[Math.floor(Math.random() * tiles.length)];
    const visible = new Set(tiles.map(tile => Number(tile.dataset.photo)));
    const choices = photos.map((_, i) => i).filter(i => !visible.has(i));
    if (!choices.length) return;
    const index = choices[Math.floor(Math.random() * choices.length)];
    incoming = new Image();
    incoming.alt = photos[index].caption;
    incoming.onload = () => {
      if (!eligible()) { incoming = null; schedule(); return; }
      const direction = ['left', 'right', 'up', 'down'][Math.floor(Math.random() * 4)];
      incoming.className = `tile-incoming from-${direction}`;
      activeTile.append(incoming);
      finishTimer = setTimeout(() => {
        activeTile.firstElementChild.remove();
        incoming.className = '';
        activeTile.dataset.photo = index;
        incoming = null;
        schedule();
      }, 850);
    };
    incoming.onerror = () => { incoming = null; schedule(); };
    incoming.src = url(photos[index].image);
  }
  const reset = () => {
    clearTimeout(timer); clearTimeout(finishTimer);
    if (incoming) { incoming.onload = incoming.onerror = null; incoming.remove(); incoming = null; }
    schedule();
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting; reset();
  }, { threshold: .15 }) : null;
  observer?.observe(wall);
  document.addEventListener('visibilitychange', reset);
  reduced.addEventListener('change', reset);
  schedule();
  cleanups.push(() => {
    stopped = true; reset(); observer?.disconnect();
    document.removeEventListener('visibilitychange', reset);
    reduced.removeEventListener('change', reset);
  });
}
function initVisionTransition() {
  const section = document.querySelector('.vision-research');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!section || reduced.matches || !('IntersectionObserver' in window)) return;
  section.classList.add('reveal-ready');
  const reveal = () => {
    section.classList.add('revealed');
    observer.disconnect();
  };
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) reveal();
  }, { threshold: 0.12 });
  observer.observe(section);
  const motion = () => { if (reduced.matches) reveal(); };
  reduced.addEventListener('change', motion);
  section.addEventListener('focusin', reveal);
  cleanups.push(() => {
    observer.disconnect();
    reduced.removeEventListener('change', motion);
    section.removeEventListener('focusin', reveal);
  });
}
function initCarousels() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.carousel').forEach(el => {
    let index = 0, timer, expanded = false, paused = reduced.matches, hovering = false, focused = false;
    const slides = [...el.querySelectorAll('.slide')], dots = [...el.querySelectorAll('.dot')];
    const track = el.querySelector('.carousel-track');
    function show(next) {
      index = (next + slides.length) % slides.length;
      track.style.transform = expanded ? '' : el.classList.contains('vertical')
        ? `translateY(-${index * 100}%)` : `translateX(-${index * 100}%)`;
      slides.forEach((s, i) => { s.inert = !expanded && i !== index; s.setAttribute('aria-hidden', String(!expanded && i !== index)); });
      dots.forEach((d, i) => { d.classList.toggle('active', i === index); d.setAttribute('aria-pressed', String(i === index)); });
    }
    function schedule(delay = 4000) {
      clearTimeout(timer);
      if (expanded || paused || hovering || focused || document.hidden || slides.length < 2) return;
      timer = setTimeout(() => { show(index + 1); schedule(); }, delay);
    }
    dots.forEach((d, i) => d.onclick = () => { show(i); schedule(); });
    const expand = el.querySelector('.expand');
    if (expand) expand.onclick = () => {
      expanded = !expanded; el.classList.toggle('expanded', expanded);
      expand.setAttribute('aria-expanded', String(expanded)); expand.textContent = expanded ? less() : more();
      show(index); schedule();
    };
    el.onmouseenter = () => { hovering = true; schedule(); };
    el.onmouseleave = () => { hovering = false; schedule(); };
    el.onfocusin = () => { focused = true; schedule(); };
    el.onfocusout = event => { if (!el.contains(event.relatedTarget)) { focused = false; schedule(); } };
    const visibility = () => schedule();
    document.addEventListener('visibilitychange', visibility);
    const motion = () => { paused = reduced.matches; schedule(); };
    reduced.addEventListener('change', motion);
    schedule(Number(el.dataset.delay));
    cleanups.push(() => { clearTimeout(timer); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motion); });
  });
}
function initPublications() {
  let mode = ['figures', 'subfigure'].includes(storage.get('pubCoverMode', 'covers')) ? 'figures' : 'covers';
  const query = document.querySelector('#query'), year = document.querySelector('#year'), area = document.querySelector('#area');
  const output = document.querySelector('#pub-results');
  const filters = () => data.studies.filter(s => (!year.value || s.year === year.value) && (!area.value || s.areas.includes(area.value)) &&
    `${s.publication.title} ${s.citation} ${s.publication.authorList.map(a => a.name).join(' ')} ${s.publication.doi} ${s.article.zh.title}`.toLowerCase().includes(query.value.trim().toLowerCase()));
  function draw() {
    const matches = filters();
    document.querySelector('#result-count').textContent = t(`${matches.length} publications · newest first`, `${matches.length} 篇论文 · 最新优先`);
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    if (!matches.length) { output.innerHTML = `<div class="empty-state"><h2>${t('No matching publications.', '未找到匹配论文。')}</h2><p>${t('Try a different keyword or clear the filters above.', '请尝试其他关键词，或清除上方筛选条件。')}</p></div>`; return; }
    const cards = list => `<div class="pub-list ${mode === 'figures' ? 'subfigures' : ''}">${list.map(s => pubCard(s, mode)).join('')}</div>`;
    output.innerHTML = cards(matches);
  }
  function syncURL() {
    const next = new URL(location.href);
    next.searchParams.delete('expanded');
    for (const [key, value] of [['q', query.value], ['year', year.value], ['area', area.value]]) {
      if (value) next.searchParams.set(key, value); else next.searchParams.delete(key);
    }
    history.replaceState({}, '', next);
  }
  document.querySelector('#filters').onsubmit = event => event.preventDefault();
  for (const field of [query, year, area]) field.addEventListener('input', () => { syncURL(); draw(); });
  document.querySelector('#clear-filters').onclick = () => { query.value = ''; year.value = ''; area.value = ''; syncURL(); draw(); query.focus(); };
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; storage.set('pubCoverMode', mode); draw(); });
  const pop = () => { query.value = params().get('q') || ''; year.value = params().get('year') || ''; area.value = params().get('area') || ''; draw(); };
  window.addEventListener('popstate', pop); cleanups.push(() => window.removeEventListener('popstate', pop));
  draw();
}
async function initMap() {
  const target = document.querySelector('#origin-map');
  const controller = new AbortController();
  cleanups.push(() => controller.abort());
  try {
    const response = await fetch(url('assets/people/china.svg'), { signal: controller.signal });
    if (!response.ok) throw new Error('Map unavailable');
    const xml = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    const features = xml.querySelector('#features');
    if (!features) throw new Error('Invalid map');
    const paths = [...features.querySelectorAll('path')].map(p => `<path d="${esc(p.getAttribute('d'))}" class="${data.origins.locations.some(l => l.id === p.id) ? 'has-origin' : ''}"/>`).join('');
    // Hangzhou is indicated separately from province-level hometown markers.
    const hub = { x: 745, y: 494 };
    target.innerHTML = `<svg viewBox="0 0 1000 738" role="group" aria-label="${t('Province-level hometown map', '省级家乡地图')}"><g class="map-land">${paths}</g><g class="map-lines">${data.origins.locations.map(p => `<path data-line="${p.id}" d="M${p.x},${p.y} Q${(p.x + hub.x) / 2},${Math.min(p.y, hub.y) - 80} ${hub.x},${hub.y}"/>`).join('')}</g>
      ${data.origins.locations.map(p => `<g class="map-point" role="button" tabindex="0" data-province="${p.id}" aria-label="${esc(p[lang])}"><circle cx="${p.x}" cy="${p.y}" r="14" class="hit"/><circle cx="${p.x}" cy="${p.y}" r="5"/><title>${esc(p[lang])}</title></g>`).join('')}
      <g class="hub"><circle cx="${hub.x}" cy="${hub.y}" r="9"/><text x="${hub.x + 15}" y="${hub.y + 6}">Hangzhou / Aptomics & Cell Atlas</text></g></svg>`;
    const select = id => {
      const province = data.origins.locations.find(p => p.id === id);
      document.querySelectorAll('[data-province]').forEach(el => el.classList.toggle('selected', el.dataset.province === id));
      target.querySelectorAll('[data-line]').forEach(el => el.classList.toggle('selected', el.dataset.line === id));
      document.querySelector('#origin-status').textContent = `${province[lang]} → ${t('Hangzhou / Aptomics & Cell Atlas', '杭州 / 功能核酸组学团队')}`;
    };
    document.querySelectorAll('[data-province]').forEach(el => {
      el.onclick = () => select(el.dataset.province);
      el.onfocus = () => select(el.dataset.province);
      el.onmouseenter = () => select(el.dataset.province);
      el.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); select(el.dataset.province); } };
    });
  } catch (error) {
    if (error.name !== 'AbortError') target.textContent = t('Map unavailable. The location list remains available.', '地图暂不可用，可通过地点列表阅读来源信息。');
  }
}
try {
  const response = await fetch(url('data/site.json') + new URL(import.meta.url).search);
  if (!response.ok) throw new Error(`Content request failed (${response.status})`);
  data = await response.json(); render();
  if (location.hash) requestAnimationFrame(() => {
    try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* Ignore malformed fragment URLs. */ }
  });
} catch (error) {
  console.error(error);
  document.querySelector('#app').innerHTML = `<main class="wrap section"><h1>Aptomics & Cell Atlas</h1><p>${t('The page could not load. Please refresh or open this site using a local HTTP server.', '页面加载失败。请刷新，或通过本地 HTTP 服务打开网站。')}</p><a href="mailto:wuqin@him.cas.cn">wuqin@him.cas.cn</a></main>`;
}
