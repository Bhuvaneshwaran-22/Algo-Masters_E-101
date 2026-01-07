// ai-agent.js
// Entry point that wires core modules and the UI widget into the page.

const { scanDOM } = require('./core/domScanner');
const { matchIntent } = require('./core/intentEngine');
const { scrollToElement, highlightElement, explainElement } = require('./core/actionEngine');

window.aiNavigationAgent = {
  async ask(query) {
    // simplistic flow: scan DOM, detect intent, call server, perform actions
    const dom = scanDOM();
    const intent = matchIntent(query || '');
    // send to server (if available)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dom, intent })
      });
      const data = await res.json();
      // optional actions from server: { action: 'highlight', selector: 'h1' }
      if (data.action === 'highlight' && data.selector) highlightElement(data.selector);
      if (data.action === 'scroll' && data.selector) scrollToElement(data.selector);
      return { text: data.text || 'No response text', raw: data };
    } catch (e) {
      return { text: 'AI server not available: ' + e.message };
    }
  }
};

// Auto-inject widget
(function(){
  const s = document.createElement('script');
  s.src = '/ai-navigation-agent/src/ui/widget.js';
  s.async = true;
  document.head.appendChild(s);
})();
