// intentEngine.js
// Very small intent matcher / AI call wrapper. Replace with real AI integration.

async function matchIntent(query) {
  // TODO: call real semantic model / server. For now, naive matching.
  if (!query) return { intent: 'unknown', confidence: 0 };
  const lowered = query.toLowerCase();
  if (lowered.includes('how') || lowered.includes('explain')) return { intent: 'explain', confidence: 0.9 };
  if (lowered.includes('where') || lowered.includes('find')) return { intent: 'navigate', confidence: 0.85 };
  return { intent: 'search', confidence: 0.6 };
}

module.exports = { matchIntent };
