// ==UserScript==
// @name         AI Navigator (Universal)
// @namespace    https://localhost:5000/
// @version      1.1.0
// @description  Inject the AI navigation assistant on every site automatically.
// @author       You
// @match        *://*/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1
// @connect      *
// ==/UserScript==

(function() {
  const BACKENDS = [
    'https://localhost:5444/bookmarklet.js',
    'http://localhost:5000/bookmarklet.js'
  ];

  // Prevent double-injection
  if (window.__aiNavigatorLoading || document.getElementById('universal-ai-nav-agent')) return;
  window.__aiNavigatorLoading = true;

  const run = (code) => {
    try {
      // Execute the same code used by the bookmarklet
      // eslint-disable-next-line no-eval
      eval(code);
    } catch (e) {
      console.warn('[AI Navigator] Failed to eval code:', e);
    } finally {
      window.__aiNavigatorLoading = false;
    }
  };

  const tryLoad = (urls) => {
    if (!urls.length) {
      console.warn('[AI Navigator] All backends unreachable.');
      window.__aiNavigatorLoading = false;
      return;
    }
    const url = urls[0];

    if (typeof GM_xmlhttpRequest === 'function') {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload: (res) => {
          if (res.status >= 200 && res.status < 300 && res.responseText) {
            run(res.responseText);
          } else {
            console.warn('[AI Navigator] HTTP error from backend:', res.status);
            tryLoad(urls.slice(1));
          }
        },
        onerror: () => {
          console.warn('[AI Navigator] Request error to', url);
          tryLoad(urls.slice(1));
        }
      });
    } else {
      fetch(url)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(run)
        .catch(() => {
          console.warn('[AI Navigator] Backend unavailable at', url);
          tryLoad(urls.slice(1));
        });
    }
  };

  tryLoad(BACKENDS);
})();
