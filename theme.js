(() => {
  const modes = ['system', 'light', 'dark'];
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let mode = 'system';
  try { mode = localStorage.getItem('siteTheme') || mode; } catch {}
  if (!modes.includes(mode)) mode = 'system';
  function apply() {
    document.documentElement.dataset.theme = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
    document.documentElement.dataset.themeMode = mode;
    window.dispatchEvent(new Event('themechange'));
  }
  window.probeTheme = {
    get mode() { return mode; },
    cycle() {
      mode = modes[(modes.indexOf(mode) + 1) % modes.length];
      try { localStorage.setItem('siteTheme', mode); } catch {}
      apply();
    }
  };
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key === 'siteTheme' || event.key === null) {
      mode = modes.includes(event.newValue) ? event.newValue : 'system';
      apply();
    }
  });
  apply();
})();
