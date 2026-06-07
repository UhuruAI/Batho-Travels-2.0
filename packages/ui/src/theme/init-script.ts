// Inline this string in <head> via dangerouslySetInnerHTML to prevent a
// flash of the wrong theme on first paint. Reads localStorage and applies
// data-theme to <html> before React hydrates.

export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('batho-theme');
    var theme = stored === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`.trim();
