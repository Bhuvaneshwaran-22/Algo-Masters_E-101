// server/index.js
// Minimal Express server that accepts an AI query and returns a placeholder response.

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/ai', (req, res) => {
  const { query, intent } = req.body || {};
  // Placeholder behavior: return simple instructions
  let text = `Got query: "${query || ''}" (intent: ${intent?.intent || 'unknown'})`;
  const lower = (query || '').toLowerCase();
  const out = { text };
  if (lower.includes('title') || lower.includes('headline')) out.action = 'highlight', out.selector = 'h1';
  if (lower.includes('go to') || lower.includes('where')) out.action = 'scroll', out.selector = 'a';
  res.json(out);
});

const port = process.env.PORT || 3030;
app.listen(port, () => console.log('AI nav server listening on', port));
