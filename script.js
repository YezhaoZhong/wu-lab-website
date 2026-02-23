async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}

function initNav() {
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  if (!navToggle || !nav) return;

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
  obj.data = `${basePath}assets/china.svg?v=${Date.now()}`;
  wrap.innerHTML = "";
  wrap.appendChild(obj);
  return obj;
}

async function initChinaSvgMap(basePath, provincesMap) {
  const info = document.getElementById("mapInfo");
  const obj = reloadChinaObject(basePath);
  if (!obj || !info) return;

  info.textContent = "Hover a province to see details. Click to open link.";

  obj.addEventListener("load", () => {
    const svgDoc = obj.contentDocument;
    if (!svgDoc) {
      info.textContent = "Cannot read SVG. Check assets/china.svg is accessible.";
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
        const label = meta.label_en || meta.label_zh || provId;
        const inst = meta.inst_en || meta.inst_zh || "";
        info.textContent = `${label}${inst ? " — " + inst : ""}`;
        el.style.fill = meta.fillHover ?? "rgba(94, 190, 234, 0.5)";
        el.style.filter = "brightness(1.12)";
      };

      const hide = () => {
        info.textContent = "Hover a province to see details. Click to open link.";
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
      info.textContent = "Tip: No province IDs from JSON were found in the SVG. Check assets/china.svg IDs.";
    }
  }, { once: true });
}

(async function main() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initNav();

  const basePath = getBasePath();
  try {
    const provincesMap = await fetchJson(`${basePath}data/china_provinces.json`);
    await initChinaSvgMap(basePath, provincesMap);
  } catch (err) {
    const info = document.getElementById("mapInfo");
    if (info) info.textContent = "Unable to load map data.";
  }

  const heroSlider = document.getElementById("heroSlider");
  const heroPrev = document.getElementById("heroPrev");
  const heroNext = document.getElementById("heroNext");
  const heroDots = document.getElementById("heroDots");
  if (heroSlider && heroPrev && heroNext) {
    const slides = Array.from(heroSlider.children);
    let index = 0;
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
    });
    heroNext.addEventListener("click", () => {
      index = (index + 1) % slides.length;
      update();
    });
    // Build dots
    if (heroDots) {
      heroDots.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "hero-dot";
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.addEventListener("click", () => {
          index = i;
          update();
        });
        heroDots.appendChild(dot);
      });
    }
    // Initial setup: hide text, then animate first slide
    slides.forEach((slide) => prepareText(slide));
    update();
  }
})();
