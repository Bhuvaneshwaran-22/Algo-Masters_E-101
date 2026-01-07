// widget.js
// Minimal floating widget that exposes a simple "Ask" input and talks to the ai-agent.

(function () {
  const cssId = 'ai-nav-widget-styles';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/ai-navigation-agent/src/ui/styles.css';
    link.id = cssId;
    document.head.appendChild(link);
  }

  const container = document.createElement('div');
  container.className = 'ai-nav-widget';
  container.innerHTML = `
    <div class="ai-nav-widget-header">Any doubts?</div>
    <div class="ai-nav-widget-body">
      <input placeholder="Ask me about this page" class="ai-nav-input" />
      <button class="ai-nav-send">Ask</button>
      <div class="ai-nav-response" aria-live="polite"></div>
    </div>
  `;
  document.body.appendChild(container);

  const input = container.querySelector('.ai-nav-input');
  const send = container.querySelector('.ai-nav-send');
  const resp = container.querySelector('.ai-nav-response');

  send.addEventListener('click', async () => {
    const q = input.value.trim();
    if (!q) return;
    resp.textContent = 'Thinking...';
    try {
      const result = await (window.aiNavigationAgent?.ask?.(q) || Promise.resolve({ text: 'Local agent not available' }));
      resp.textContent = result.text || JSON.stringify(result);
    } catch (e) {
      resp.textContent = 'Error: ' + (e.message || e);
    }
  });
})();
