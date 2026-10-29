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
  return `<footer class="footer"><div class="wrap footer-grid"><div><a class="footer-brand" href="${url('')}" aria-label="Aptomics & Cell Atlas Home"><span class="brand-picture"><img src="${url(data.logo)}" alt="" loading="lazy"></span><span class="footer-brand-name">Aptomics &amp; Cell Atlas</span></a><p>功能核酸组学团队</p><p>${slogan()}</p></div>
    <div><p class="eyebrow">${t('Based in Hangzhou', '立足杭州')}</p>
    <p>${t('Hangzhou Institute of Medicine<br>Chinese Academy of Sciences', '中国科学院杭州医学研究所')}<br>${t('150 Dongfang Street, Hangzhou, China', '杭州市钱塘区东方街 150 号')}</p></div>
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
    <div class="button-row">${link('research/', t('Explore research', '探索研究'), 'button')}${link('minds/', t('Meet the minds', '认识研究者'), 'button outline')}</div><p class="hero-slogan">${slogan()}</p></div>
    <div class="hero-art">${brand(true)}<span class="hero-coordinate">HANGZHOU · CHINA / 30°N</span></div></div>
    <div class="hero-bottom wrap"><span>CHEMISTRY × BIOLOGY × COMPUTATION × MEDICINE</span><a href="#vision">${t('A closer look ↓', '继续探索 ↓')}</a></div></section>
    <section class="wrap section" id="vision">${kicker('OUR SCIENTIFIC VISION')}<h2>Recognize · Decode · Reprogram</h2>
    <p class="large-text">${t('Can molecular recognition become a general strategy to understand and control biology?', '分子识别能否成为理解与调控生命系统的通用策略？')}</p>
    <div class="principles">${[
      ['Recognize', '识别', 'Discover molecular interactions and develop probes that help us see biological systems in new ways.', '发现分子相互作用，开发帮助我们以新视角观察生命系统的探针。'],
      ['Decode', '解码', 'Connect molecular measurements with biological context to understand cellular states and disease.', '将分子测量与生物学背景相结合，理解细胞状态与疾病。'],
      ['Reprogram', '重塑', 'Engineer functional nucleic acids to explore new ways of regulating biological activity.', '通过功能核酸工程，探索调控生物学活动的新方式。']
    ].map(([en, zh, p, z]) => `<article><h3>${en}</h3>${lang === 'zh' ? `<p class="eyebrow">${zh}</p>` : ''}<p>${t(p, z)}</p></article>`).join('')}</div>
    ${link('research/', t('Explore Our Research', '探索我们的研究'))}</section>
    <section class="section wrap">${sectionHead('03 / SELECTED DISCOVERIES', t('From questions to discoveries.', '从问题走向发现。'), link('discoveries/publications/', 'All Publications'))}
    <div class="feature-grid">${['spark-seq', 'apt-seq', 'blocker-selex'].map((id, i) => scienceCard(findStudy(id), `0${i + 1} /`)).join('')}</div></section>
    <section class="section news-band"><div class="wrap">${sectionHead('04 / LAB NOTES', 'Latest News', link('news/', t('All news', '全部新闻')))}${newsCarousel(data.news.slice(0, 5), 'home-news')}</div></section>
    <section class="wrap section minds-callout">${kicker('05 / MEET THE MINDS')}<h2>${t('Different minds.<br>Shared curiosity.', '不同的思维，<br>共同的好奇心。')}</h2><p>${t('Meet the researchers behind SPARK-seq, Apt-seq and Blocker-SELEX.', '走近 SPARK-seq、Apt-seq 与 Blocker-SELEX 背后的研究者。')}</p>${link('minds/', 'Meet the Minds', 'button outline')}</section>
    ${joinCallout()}`;
}
function joinCallout() {
  return `<section class="join-callout"><div class="wrap"><div>${kicker('YOUR NEXT CHAPTER')}<h2>${t('Bring your curiosity.', '带上你的好奇心。')}</h2><p>${t('Shape the next discovery with us.', '与我们一起，开启下一次发现。')}</p></div>${link('join-us/', 'Join Us', 'button light')}</div></section>`;
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
      <figure class="direction-focus-art"><img src="${url(`assets/research-concepts/${a.id}.png`)}" alt="${esc(local(a.focus.heading))}" fetchpriority="high"><figcaption>${t('Research concept illustration', '研究方向概念示意')}</figcaption></figure>
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
    <section class="soft section"><div class="wrap intro"><div>${kicker('THE COMPLETE RECORD')}<h2>All Publications</h2></div><div><p>${t('Browse all 20 publications by year, research direction or keyword. Switch between paper covers and representative subfigures.', '按年份、研究方向或关键词检索全部 20 篇论文，并切换论文封面与代表性子图。')}</p>${link('discoveries/publications/', t('Browse publications', '查看全部论文'), 'button')}</div></div></section>`;
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
function researchers() {
  return `<div class="researcher-grid">${data.researchers.map((r, i) => {
    const s = findStudy(r.study);
    return `<article class="researcher-card"><div class="researcher-number">0${i + 1} / DISCOVERER</div><h3><a href="${url(`minds/story.html?person=${r.id}`)}">${esc(r[lang])}</a></h3><p class="researcher-alt">${esc(r[lang === 'zh' ? 'en' : 'zh'])}</p>
    <div class="researcher-science"><span class="eyebrow">${s.journal} · ${s.year}</span><h4>${esc(local(s.article).title)}</h4><p>${esc(local(s.article).paragraphs[0])}</p></div>${link(`minds/story.html?person=${r.id}`, t('Read the research story', '阅读研究故事'))}</article>`;
  }).join('')}</div>`;
}
function minds() {
  return `${head('MINDS / THE PEOPLE BEHIND DISCOVERY', t('Different minds.<br><em>Shared curiosity.</em>', '不同的思维，<br><em>共同的好奇心。</em>'), t('Science is driven by questions, shaped by ideas, and advanced by people.', '科学由问题驱动，由思想塑造，由人推动。'))}
    <section class="wrap section pi-panel">${kicker('01 / MEET THE PI')}<div class="intro"><div><figure class="pi-portrait pi-preview"><img src="${url('assets/minds/pi/PIimage.png')}" width="280" height="280" alt="${t('Portrait of Qin Wu', '吴芩研究员肖像')}" loading="lazy"></figure><h2>${t('Qin Wu', '吴芩')}</h2><p class="eyebrow">PRINCIPAL INVESTIGATOR</p><p>${t('Hangzhou Institute of Medicine<br>Chinese Academy of Sciences', '中国科学院杭州医学研究所')}</p></div><div><p class="large-text">${t('Connecting molecular tools with the complexity of living systems.', '连接分子工具与复杂的生命系统。')}</p><p>${t('Our research integrates chemical biology, molecular and cellular biology, and bioinformatics to understand cell states and develop new strategies for precision medicine.', '我们综合化学生物学、分子与细胞生物学及生物信息学方法，理解细胞状态，发展精准医学的新策略。')}</p>${link('minds/pi/', t('More about the PI', '了解研究负责人'))}</div></div></section>
    <section class="section soft"><div class="wrap">${sectionHead('02 / MEET THE DISCOVERERS', t('Every discovery has a story.', '每个发现，都有一个故事。'))}${researchers()}</div></section>
    <section id="origins" class="section wrap">${sectionHead('03 / WHERE WE COME FROM', t('Many journeys. One mission.', '不同的来路，共同的使命。'))}
    <p>${t('Our journeys meet in Hangzhou. Locations are grouped by province or municipality, without names or member counts.', '我们的旅程在杭州汇合。地图按省份或直辖市汇总，不关联姓名或公开成员人数。')}</p>
    <div class="origins-layout"><div id="origin-map" class="origin-map" aria-label="${t('Team origins by province', '团队家乡省份汇总')}"></div><div><p class="eyebrow">${t('Places we call home', '家乡来源')}</p><div class="origin-list">${data.origins.locations.map(p => `<button data-province="${p.id}" class="origin-chip">${esc(p[lang])}</button>`).join('')}</div>
    <p id="origin-status" class="map-status" role="status">${t('Select a place to trace its connection to Hangzhou.', '选择一个地点，查看通往杭州的连接。')}</p><p class="small-note">${t('Province-level markers are schematic, not individual addresses.', '点位为省级示意，不代表个人地址。')}</p></div></div></section>
    <section id="culture" class="section soft"><div class="wrap">${sectionHead('04 / CULTURE', t('One team. All in.', '同一个团队，全心投入。'))}
    <div class="values">${[['Stay curious.', '保持好奇心。'], ['Think independently.', '独立思考。'], ['Create together.', '协同创造。'], ['Aim high.', '志存高远。']].map(([en, zh]) => `<span>${t(en, zh)}</span>`).join('')}</div>
    ${activityCarousel()}</div></section>${joinCallout()}`;
}
function pi() {
  return `${head('MINDS / MEET THE PI', t('Qin Wu', '吴芩'), t('Principal Investigator · Hangzhou Institute of Medicine, CAS', '研究员 · 中国科学院杭州医学研究所'))}
    <section class="wrap section pi-profile"><figure class="pi-portrait"><img src="${url('assets/minds/pi/PIimage.png')}" width="280" height="280" alt="${t('Portrait of Qin Wu', '吴芩研究员肖像')}" fetchpriority="high"></figure><div class="prose">${[1, 2].map(i => `<p>${esc(data.people[lang][`people.pi.bio${i}`])}</p>`).join('')}<p>${slogan()}</p><div class="button-row">${link('research/', 'Research', 'button')}<a class="button outline" href="mailto:wuqin@him.cas.cn">${t('Get in touch', '邮件联系')}</a></div></div></section>`;
}
function carousel(slides, id, vertical = false, delay = 4000, expandable = false) {
  return `<div class="carousel ${vertical ? 'vertical' : ''}" id="${id}" data-delay="${delay}" data-expandable="${expandable}">
    <div class="carousel-window"><div class="carousel-track">${slides.map((s, i) => `<div class="slide" ${i ? 'inert aria-hidden="true"' : ''}>${s}</div>`).join('')}</div></div>
    <div class="carousel-dots" aria-label="${t('Choose a slide', '选择幻灯片')}">${slides.map((_, i) => `<button class="dot ${i ? '' : 'active'}" data-slide="${i}" aria-label="${t('Slide', '第')} ${i + 1}" aria-pressed="${!i}"></button>`).join('')}</div>
    ${expandable ? `<div class="carousel-actions"><button class="plain-button expand" aria-expanded="false">${more()}</button></div>` : ''}</div>`;
}
function newsCard(n) {
  return `<article class="news-card"><p class="eyebrow">${n.date}</p><h3><a href="${url(`news/${n.id}.html`)}">${esc(local(n).title)}</a></h3><p>${esc(local(n).summary)}</p>${link(`news/${n.id}.html`, t('Read more', '阅读全文'))}</article>`;
}
function newsCarousel(items, id) {
  return carousel(items.map(newsCard), id);
}
function activityCarousel() {
  return carousel(data.activities.map(a => `<article class="activity-cover"><div><p class="eyebrow">${esc(local(a).date)}</p><h3>${esc(local(a).title)}</h3><p>${esc(local(a).summary)}</p>${link(`minds/activity.html?id=${a.id}`, t('View activity', '查看活动'))}</div></article>`), 'culture-slides', true, 4500, true);
}
function activityPage() {
  const a = data.activities.find(a => String(a.id) === params().get('id'));
  if (!a) return notFound();
  return `${head('MINDS / CULTURE / ' + esc(local(a).date), esc(local(a).title))}
    <section class="wrap section prose standalone"><p class="large-text">${esc(local(a).summary)}</p>${link('minds/#culture', t('Back to Culture', '返回团队文化'))}</section>`;
}
function newsPage(id) {
  if (!id) return `${head('LAB NOTES / NEWS & MILESTONES', t('Latest News', '最新动态'), t('Discoveries, recognition and moments from the lab.', '记录团队的研究进展、荣誉与重要时刻。'))}<section class="section wrap"><div class="news-grid">${data.news.map(newsCard).join('')}</div></section>`;
  const n = data.news.find(n => n.id === id);
  if (!n) return notFound();
  const body = local(n).body.replace(/<p><a class="tool-link"[\s\S]*?<\/p>/g, '')
    .replaceAll('Wu Lab', 'Aptomics & Cell Atlas').replaceAll('吴芩课题组', '功能核酸组学团队');
  return `${head('NEWS / ' + n.date, esc(local(n).title))}<article class="section wrap prose standalone">${body || `<p>${esc(local(n).summary)}</p>`}${link('news/', t('Back to News', '返回新闻'))}</article>`;
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
    <section class="section wrap"><div class="intro"><div>${kicker('02 / POSTDOCTORAL RESEARCH')}<h2>${p('postdoc.title')}</h2><p>${p('postdoc.lead')}</p><p>${p('background.body')}</p></div>
    <div><h3>${p('requirements.title')}</h3><ul>${[1, 2, 3].map(i => `<li>${p(`req${i}`)}</li>`).join('')}</ul><h3>${p('benefits.title')} · 2026</h3><ul>${[1, 2, 3].map(i => `<li>${p(`benefit${i}`)}</li>`).join('')}</ul><p>${p('benefits.note')}</p><p class="small-note">${t('Amounts are retained from the supplied recruitment information. Final eligibility, funding and benefits follow the institute’s applicable policies and offer.', '金额沿用已有招聘资料。申请资格、资助与最终待遇以研究所适用政策和录用文件为准。')}</p></div></div></section>
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
      content = person ? studyPage(person.study, person) : notFound(); break;
    }
    case 'activity': content = activityPage(); break;
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
  if (type === 'publications') initPublications();
  if (type === 'minds') initMap();
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
  let expanded = params().get('expanded') === '1';
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
    const toggle = position => `<div class="pub-toggle-wrap"><button class="button outline pub-toggle" data-position="${position}" aria-expanded="${expanded}" aria-controls="more-publications">${expanded ? less() : more()}</button></div>`;
    output.innerHTML = cards(matches.slice(0, 6)) + (matches.length > 6 ? toggle('top') +
      `<section id="more-publications" ${expanded ? '' : 'hidden'}><h2>${t('More Publications', '更多论文')}</h2>${expanded ? cards(matches.slice(6)) + toggle('bottom') : ''}</section>` : '');
    output.querySelectorAll('.pub-toggle').forEach(button => button.onclick = () => {
      const fromBottom = button.dataset.position === 'bottom';
      expanded = !expanded; syncURL(); draw();
      const next = output.querySelector('.pub-toggle');
      next?.focus({ preventScroll: true });
      if (fromBottom) next?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
  function syncURL() {
    const next = new URL(location.href);
    for (const [key, value] of [['q', query.value], ['year', year.value], ['area', area.value], ['expanded', expanded ? '1' : '']]) {
      if (value) next.searchParams.set(key, value); else next.searchParams.delete(key);
    }
    history.replaceState({}, '', next);
  }
  document.querySelector('#filters').onsubmit = event => event.preventDefault();
  for (const field of [query, year, area]) field.addEventListener('input', () => { expanded = false; syncURL(); draw(); });
  document.querySelector('#clear-filters').onclick = () => { query.value = ''; year.value = ''; area.value = ''; expanded = false; syncURL(); draw(); query.focus(); };
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; storage.set('pubCoverMode', mode); draw(); });
  const pop = () => { query.value = params().get('q') || ''; year.value = params().get('year') || ''; area.value = params().get('area') || ''; expanded = params().get('expanded') === '1'; draw(); };
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
