// actionEngine.js
// Performs page actions like scrolling, highlighting, and returning explanations.

function scrollToElement(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return !!el;
}

function highlightElement(selector, duration = 3000) {
  const el = document.querySelector(selector);
  if (!el) return false;
  const original = el.style.boxShadow;
  el.style.boxShadow = '0 0 0 4px rgba(255,200,50,0.8)';
  setTimeout(() => el.style.boxShadow = original, duration);
  return true;
}

function explainElement(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  return {
    tag: el.tagName,
    text: el.innerText?.slice(0, 100) || '',
    attributes: Array.from(el.attributes || []).reduce((acc, a) => (acc[a.name] = a.value, acc), {})
  };
}

module.exports = { scrollToElement, highlightElement, explainElement };
