async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}

function initNav() {
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  const header = document.querySelector(".site-header");
  const brand = document.querySelector(".brand");
  const headerInner = document.querySelector(".header-inner");
  if (!navToggle || !nav || !header || !brand || !headerInner) return;

  const updateNavLayout = () => {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    header.classList.remove("nav-collapsed");

    if (window.innerWidth <= 900) return;

    const available = headerInner.clientWidth - brand.offsetWidth - navToggle.offsetWidth - 28;
    const needed = nav.scrollWidth;
    if (needed > available) {
      header.classList.add("nav-collapsed");
    }
  };

  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("resize", updateNavLayout);
  updateNavLayout();
}

function getBasePath() {
  const base = document.documentElement.dataset.base;
  if (base !== undefined) return base;
  return "";
}

function reloadChinaObject(basePath) {
  const wrap = document.getElementById("chinaObjWrap");
  if (!wrap) return null;

  const obj = document.createElement("object");
  obj.id = "chinaObj";
  obj.type = "image/svg+xml";
  obj.data = `${basePath}assets/people/china.svg?v=${Date.now()}`;
  wrap.innerHTML = "";
  wrap.appendChild(obj);
  return obj;
}

async function initChinaSvgMap(basePath, provincesMap) {
  const info = document.getElementById("mapInfo");
  const obj = reloadChinaObject(basePath);
  if (!obj || !info) return;

  const getDict = () => {
    const lang = localStorage.getItem("siteLang") || "en";
    return (window.siteTextPayload && window.siteTextPayload[lang]) || {};
  };
  const resetInfo = () => {
    const dict = getDict();
    info.textContent = dict["people.mapInfo"] || "Hover a province to see details. Click to open link.";
  };

  resetInfo();

  obj.addEventListener("load", () => {
    const svgDoc = obj.contentDocument;
    if (!svgDoc) {
      const dict = getDict();
      info.textContent = dict["people.mapError.readSvg"] || "Cannot read SVG. Check assets/people/china.svg is accessible.";
      return;
    }

    const svgEl = svgDoc.documentElement;
    if (svgEl) {
      svgEl.setAttribute("width", "100%");
      svgEl.setAttribute("height", "100%");
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svgEl.style.display = "block";
    }

    const all = svgDoc.querySelectorAll("path, g, polygon");
    all.forEach((el) => {
      if (el.id) {
        el.style.transition = "fill 120ms ease, filter 120ms ease, opacity 120ms ease";
      }
    });

    Object.entries(provincesMap).forEach(([provId, meta]) => {
      const el = svgDoc.getElementById(provId);
      if (!el) return;

      el.style.fill = meta.fill ?? "rgba(94, 110, 234, 0.82)";
      el.style.stroke = meta.stroke ?? "rgba(68, 141, 198, 0.7)";
      el.style.strokeWidth = meta.strokeWidth ?? "1.2";
      el.style.cursor = "pointer";

      const show = () => {
        const lang = localStorage.getItem("siteLang") || "en";
        const label = lang === "zh" ? (meta.label_zh || meta.label_en || provId) : (meta.label_en || meta.label_zh || provId);
        const inst = lang === "zh" ? (meta.inst_zh || meta.inst_en || "") : (meta.inst_en || meta.inst_zh || "");
        info.textContent = `${label}${inst ? " — " + inst : ""}`;
        el.style.fill = meta.fillHover ?? "rgba(94, 190, 234, 0.5)";
        el.style.filter = "brightness(1.12)";
      };

      const hide = () => {
        resetInfo();
        el.style.fill = meta.fill ?? "rgba(99, 128, 232, 0.74)";
        el.style.filter = "none";
      };

      el.addEventListener("mouseenter", show);
      el.addEventListener("mouseleave", hide);
      el.addEventListener("click", () => {
        if (meta.url) window.open(meta.url, "_blank", "noopener,noreferrer");
      });
    });

    const matchedCount = Object.keys(provincesMap).filter((id) => svgDoc.getElementById(id)).length;
    if (matchedCount === 0) {
      const dict = getDict();
      info.textContent = dict["people.mapError.noIds"] || "Tip: No province IDs from JSON were found in the SVG. Check assets/people/china.svg IDs.";
    }
  }, { once: true });

  document.addEventListener("site:languagechange", () => {
    resetInfo();
  });
}

(async function main() {
  await initI18n();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initNav();

  const basePath = getBasePath();
  try {
    const provincesMap = await fetchJson(`${basePath}data/china_provinces.json`);
    await initChinaSvgMap(basePath, provincesMap);
  } catch (err) {
    const info = document.getElementById("mapInfo");
    if (info) {
      const lang = localStorage.getItem("siteLang") || "en";
      const dict = (window.siteTextPayload && window.siteTextPayload[lang]) || {};
      info.textContent = dict["people.mapError.unableLoad"] || "Unable to load map data.";
    }
  }

  const heroSlider = document.getElementById("heroSlider");
  const heroPrev = document.getElementById("heroPrev");
  const heroNext = document.getElementById("heroNext");
  const heroDots = document.getElementById("heroDots");
  if (heroSlider && heroPrev && heroNext) {
    const slides = Array.from(heroSlider.children);
    let index = 0;
    let heroTimer = null;
    const textSelector = ".hero-inner";
    const prepareText = (el) => {
      el.querySelectorAll(textSelector).forEach((p) => p.classList.add("text-hidden"));
    };
    const restartAnimation = (el) => {
      const parts = el.querySelectorAll(textSelector);
      parts.forEach((p) => p.classList.add("text-hidden"));
      // Force reflow
      void el.offsetHeight;
      requestAnimationFrame(() => {
        parts.forEach((p) => p.classList.remove("text-hidden"));
      });
    };

    const update = () => {
      heroSlider.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide) => {
        slide.classList.remove("is-active");
        prepareText(slide);
      });
      const active = slides[index];
      if (active) {
        active.classList.add("is-active");
        restartAnimation(active);
      }
      if (heroDots) {
        Array.from(heroDots.children).forEach((dot, i) => {
          dot.classList.toggle("is-active", i === index);
        });
      }
    };
    heroPrev.addEventListener("click", () => {
      index = (index - 1 + slides.length) % slides.length;
      update();
      restartAutoplay();
    });
    heroNext.addEventListener("click", () => {
      index = (index + 1) % slides.length;
      update();
      restartAutoplay();
    });
    const buildDots = () => {
      if (!heroDots) return;
      heroDots.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "hero-dot";
        const lang = localStorage.getItem("siteLang") || "en";
        const dict = (window.siteTextPayload && window.siteTextPayload[lang]) || {};
        const tpl = dict["shared.hero.dot"] || "Go to slide {n}";
        dot.setAttribute("aria-label", tpl.replace("{n}", String(i + 1)));
        dot.addEventListener("click", () => {
          index = i;
          update();
          restartAutoplay();
        });
        dot.classList.toggle("is-active", i === index);
        heroDots.appendChild(dot);
      });
    };

    const restartAutoplay = () => {
      if (heroTimer) clearInterval(heroTimer);
      heroTimer = setInterval(() => {
        index = (index + 1) % slides.length;
        update();
      }, 4000);
    };

    buildDots();
    document.addEventListener("site:languagechange", buildDots);
    // Initial setup: hide text, then animate first slide
    slides.forEach((slide) => prepareText(slide));
    update();
    restartAutoplay();
  }
})();


async function loadI18nPayload(basePath) {
  const files = [
    "ui.json",
    "home.json",
    "research.json",
    "people.json",
    "news.json",
    "join.json",
    "software.json",
    "publications-ui.json"
  ];
  const chunks = await Promise.all(
    files.map((name) => fetchJson(basePath + "data/" + name))
  );
  const payload = { en: {}, zh: {} };
  chunks.forEach((chunk) => {
    ["en", "zh"].forEach((lang) => {
      Object.assign(payload[lang], chunk[lang] || {});
    });
  });
  return payload;
}

async function initI18n() {
  const toggle = document.getElementById("langToggle");
  let payload;
  try {
    payload = await loadI18nPayload(getBasePath());
    window.siteTextPayload = payload;
  } catch (err) {
    return;
  }
  const apply = (nextLang) => {
    const dict = payload[nextLang] || payload.en || {};
    document.documentElement.lang = nextLang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.dataset.i18nHtml;
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const pairs = el.dataset.i18nAttr.split(";").map((part) => part.trim()).filter(Boolean);
      pairs.forEach((pair) => {
        const parts = pair.split(":");
        const attr = parts[0];
        const key = parts.slice(1).join(":");
        if (attr && key && dict[key] !== undefined) el.setAttribute(attr, dict[key]);
      });
    });
    if (toggle) toggle.textContent = dict["shared.lang.toggle"] || (nextLang === "zh" ? "EN" : "中文");
    localStorage.setItem("siteLang", nextLang);
    document.documentElement.dataset.siteLang = nextLang;
    document.documentElement.classList.remove("i18n-pending");
    document.dispatchEvent(new CustomEvent("site:languagechange", { detail: { lang: nextLang, dict } }));
  };
  const current = localStorage.getItem("siteLang") || "en";
  apply(current);
  if (toggle) {
    toggle.addEventListener("click", () => {
      const now = localStorage.getItem("siteLang") || "en";
      apply(now === "en" ? "zh" : "en");
    });
  }
}
