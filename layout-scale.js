(() => {
  // Keep one initial scale for this site and tab, including reloads and navigation.
  const key = `initialLayoutScale:${new URL('./', document.currentScript.src).pathname}`;
  let scale;
  try { scale = Number(sessionStorage.getItem(key)); } catch {}
  if (!Number.isFinite(scale) || scale < 1) {
    scale = Math.max(1, window.innerWidth / 1920);
    try { sessionStorage.setItem(key, String(scale)); } catch {}
  }
  document.documentElement.style.setProperty('--layout-scale', String(scale));
})();
