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
  const BACKEND = 'http://localhost:5000/bookmarklet.js'; // change to your HTTPS endpoint if deployed

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

  // Prefer GM_xmlhttpRequest to avoid mixed-content/CORS on HTTPS sites
  if (typeof GM_xmlhttpRequest === 'function') {
    GM_xmlhttpRequest({
      method: 'GET',
      url: BACKEND,
      onload: (res) => {
        if (res.status >= 200 && res.status < 300 && res.responseText) {
          run(res.responseText);
        } else {
          console.warn('[AI Navigator] HTTP error from backend:', res.status);
          window.__aiNavigatorLoading = false;
        }
      },
      onerror: (err) => {
        console.warn('[AI Navigator] Request error. Is backend running on 5000?', err);
        window.__aiNavigatorLoading = false;
      }
    });
  } else {
    // Fallback to fetch (may be blocked on HTTPS sites loading HTTP backend)
    fetch(BACKEND)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(run)
      .catch(err => {
        console.warn('[AI Navigator] Backend unavailable. Check server/index.js is running on 5000 or update BACKEND URL.', err);
        window.__aiNavigatorLoading = false;
      });
  }
})();
