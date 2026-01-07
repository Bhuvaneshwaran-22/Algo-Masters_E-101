// domScanner.js
// Reads & interprets website DOM for the AI navigation agent

function scanDOM() {
  const snapshot = document.documentElement.outerHTML;
  const headline = document.querySelector('h1')?.innerText || '';
  const links = Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => ({
    text: a.innerText.trim(),
    href: a.href
  }));
  return { snapshot, headline, links };
}

module.exports = { scanDOM };
