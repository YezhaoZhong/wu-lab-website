(function () {
  const body = document.body;
  const themeId = body.dataset.researchTheme;
  const isStudyPage = body.dataset.researchPage === "study";
  const isLandingPage = body.dataset.researchPage === "landing";
  if (!themeId && !isStudyPage && !isLandingPage) return;

  const basePath = document.documentElement.dataset.base || "../";
  const dataPath = `${basePath}data/research-map.json`;

  const getJson = async () => {
    const res = await fetch(dataPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${dataPath}`);
    return res.json();
  };

  const qs = (selector) => document.querySelector(selector);

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;");

  const setText = (selector, value) => {
    const el = qs(selector);
    if (el) el.textContent = value;
  };

  const renderThemePage = (data, currentThemeId) => {
    const theme = data.themes.find((item) => item.id === currentThemeId);
    if (!theme) throw new Error(`Unknown theme: ${currentThemeId}`);

    document.title = `${theme.title} | Wu Lab`;
    body.classList.add(`theme-tone-${theme.id}`);

    setText("#themeCrumb", theme.title);
    setText("#themeTitle", `${theme.title} - ${theme.subtitle}`);
    setText("#themeLead", theme.lead);
    setText("#themeDescription", theme.description);
    setText("#themeCoreTitle", theme.title);
    setText("#themeCoreSubtitle", theme.subtitle);

    const heroImage = qs("#themeHeroImage");
    if (heroImage) {
      heroImage.src = theme.heroImage;
      heroImage.alt = theme.heroAlt;
    }

    const studies = data.studies;
    const branchesRoot = qs("#mindmapBranches");
    if (!branchesRoot) return;

    branchesRoot.innerHTML = theme.branches
      .map((branch) => {
        const nodes = branch.studies
          .map((studyId) => {
            const study = studies[studyId];
            if (!study) return "";
            return `
              <a class="mindmap-node" href="study.html?study=${encodeURIComponent(studyId)}">
                <span class="mindmap-node-year">${escapeHtml(study.year)}</span>
                <strong>${escapeHtml(study.title)}</strong>
                <span class="mindmap-node-meta">${escapeHtml(study.journal)}</span>
              </a>
            `;
          })
          .join("");

        return `
          <section class="mindmap-branch">
            <h3>${escapeHtml(branch.title)}</h3>
            <p>${escapeHtml(branch.description)}</p>
            <div class="mindmap-node-list">${nodes}</div>
          </section>
        `;
      })
      .join("");
  };

  const buildThemeSliderMarkup = (theme, studies) => {
    const flatStudyIds = [];
    theme.branches.forEach((branch) => {
      branch.studies.forEach((studyId) => {
        if (!flatStudyIds.includes(studyId)) flatStudyIds.push(studyId);
      });
    });

    return flatStudyIds
      .map((studyId) => {
        const study = studies[studyId];
        if (!study) return "";
        return `
          <article class="research-theme-slide" style="background-image:linear-gradient(180deg, rgba(8, 14, 22, 0.08), rgba(8, 14, 22, 0.58)), url('${escapeHtml(study.cover)}');">
            <div class="activity-cover-text research-theme-slide-text">
              <p class="news-kicker">${escapeHtml(study.year)} | ${escapeHtml(study.journal)}</p>
              <h3>${escapeHtml(study.title)}</h3>
              <p>${escapeHtml(theme.title)} theme study cover</p>
            </div>
            <span class="research-theme-slide-cta">Open theme map</span>
          </article>
        `;
      })
      .join("");
  };

  const initThemeSliderMotion = () => {
    const sliders = Array.from(document.querySelectorAll("[data-theme-slider]"));
    sliders.forEach((card, cardIndex) => {
      const track = card.querySelector(".research-theme-slider-track");
      if (!track) return;
      const slides = Array.from(track.children);
      if (slides.length <= 1) return;

      let index = 0;
      const update = () => {
        track.style.transform = `translateX(-${index * 100}%)`;
      };

      update();
      window.setInterval(() => {
        index = (index + 1) % slides.length;
        update();
      }, 4000 + cardIndex * 500);
    });
  };

  const renderLandingPage = (data) => {
    const sliders = {
      explore: qs("#themeSliderExplore"),
      decode: qs("#themeSliderDecode"),
      protect: qs("#themeSliderProtect")
    };

    data.themes.forEach((theme) => {
      const root = sliders[theme.id];
      if (!root) return;
      root.innerHTML = buildThemeSliderMarkup(theme, data.studies);
    });

    initThemeSliderMotion();
  };

  const renderStudyPage = (data) => {
    const params = new URLSearchParams(window.location.search);
    const studyId = params.get("study");
    const study = studyId ? data.studies[studyId] : null;

    if (!study) {
      const root = qs("#studyPage");
      if (root) {
        root.innerHTML = `
          <div class="card research-study-card">
            <h1>Study not found</h1>
            <p>The requested study page could not be resolved from the research map data.</p>
            <p><a class="btn" href="./">Back to research themes</a></p>
          </div>
        `;
      }
      return;
    }

    const theme = data.themes.find((item) => item.id === study.theme);
    document.title = `${study.title} | Wu Lab`;
    if (theme) body.classList.add(`theme-tone-${theme.id}`);

    setText("#studyThemeCrumb", theme ? theme.title : "Study");
    setText("#studyTitle", study.title);
    setText("#studyJournal", `${study.journal} | ${study.year}`);
    setText("#studyCitation", study.citation);
    setText("#studyThemeTag", theme ? `${theme.title} - ${theme.subtitle}` : study.theme);
    setText("#studyThemeFit", study.themeFit);

    const figure = qs("#studyFigure");
    if (figure) {
      figure.src = study.cover;
      figure.alt = study.coverAlt;
    }

    const pdfLink = qs("#studyPdfLink");
    if (pdfLink) pdfLink.href = study.pdf;

    const doiLink = qs("#studyDoiLink");
    if (doiLink) doiLink.href = study.doiUrl;

    const themeLink = qs("#studyThemeLink");
    if (themeLink && theme) themeLink.href = `${theme.id}.html`;

    const summaryRoot = qs("#studySummary");
    if (summaryRoot) {
      summaryRoot.innerHTML = study.summary
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    }

    const relatedRoot = qs("#studyRelated");
    if (relatedRoot) {
      const relatedIds = Array.isArray(study.related) ? study.related : [];
      relatedRoot.innerHTML = relatedIds
        .map((relatedId) => {
          const related = data.studies[relatedId];
          if (!related) return "";
          return `
            <a class="related-study-link" href="study.html?study=${encodeURIComponent(relatedId)}">
              <span>${escapeHtml(related.year)}</span>
              <strong>${escapeHtml(related.title)}</strong>
            </a>
          `;
        })
        .join("");
    }
  };

  getJson()
    .then((data) => {
      if (isLandingPage) renderLandingPage(data);
      if (themeId) renderThemePage(data, themeId);
      if (isStudyPage) renderStudyPage(data);
    })
    .catch((error) => {
      const fallback = qs("#researchRuntimeError");
      if (fallback) {
        fallback.hidden = false;
        fallback.textContent = error.message;
      }
    });
})();
