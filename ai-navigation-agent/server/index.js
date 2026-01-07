import express from "express";

// AI Navigation Backend - Website-wide Semantic Understanding
// Role: Maintains index of entire website for intelligent cross-page navigation.
// Why: Frontend DOM scanning only sees current page. Backend provides
// pre-processed semantic index for understanding content across all pages.

const app = express();

// CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

// In-memory website index
// Contains all pages and sections for semantic searching
let websiteIndex = [];

// Build website index (for hackathon demo)
function buildWebsiteIndex() {
  console.log("[agent-backend] Building website semantic index...");
  
  websiteIndex = [
    {
      pageURL: "http://localhost:3000",
      sectionTitle: "HTML Introduction",
      sectionSummary: "Learn about HTML elements, tags, and basic structure of web pages.",
      elementId: "intro",
      sectionType: "H2"
    },
    {
      pageURL: "http://localhost:3000",
      sectionTitle: "CSS Introduction",
      sectionSummary: "Discover styles, layout techniques, and responsive design approaches.",
      elementId: "styles",
      sectionType: "H2"
    },
    {
      pageURL: "http://localhost:3000",
      sectionTitle: "JS Introduction",
      sectionSummary: "Understand fundamentals of JavaScript, events, and dynamic behavior.",
      elementId: "scripts",
      sectionType: "H2"
    }
  ];

  console.log(`[agent-backend] Indexed ${websiteIndex.length} sections`);
}

buildWebsiteIndex();

// Health check
app.get("/health-check", (_req, res) => {
  res.json({ status: "ok" });
});

// Website index - for transparency
app.get("/website-index", (_req, res) => {
  res.json({ 
    count: websiteIndex.length,
    sections: websiteIndex,
    note: "This is the semantic understanding of the entire website"
  });
});

// Semantic search across entire website index
// Returns matches ranked by relevance + clarification hints
app.post("/search", (req, res) => {
  const { query = "" } = req.body || {};
  const q = String(query).toLowerCase().trim();

  if (!q) {
    return res.json({ results: [], message: "Empty query." });
  }

  // Keyword aliases and lightweight stemming for broader intent matching
  const aliases = {
    "javascript": ["js", "script", "javascript", "node", "typescript"],
    "js": ["javascript", "script", "js"],
    "script": ["javascript", "script", "js"],
    "typescript": ["ts", "typescript", "javascript"],
    "html": ["html", "markup", "structure", "document"],
    "css": ["css", "style", "styling", "design", "layout"],
    "style": ["css", "style", "design", "theme"],
    "design": ["css", "style", "design", "ux", "ui"],
    "layout": ["css", "grid", "flex", "layout"],
    "api": ["api", "endpoint", "interface"],
    "function": ["function", "method", "procedure"],
    "array": ["array", "list", "vector", "collection"],
    "object": ["object", "json", "dictionary", "map"],
    "loop": ["loop", "iterate", "iteration", "for", "while"],
    "error": ["error", "bug", "issue", "problem"],
    "install": ["install", "installation", "setup", "set up"],
    "config": ["config", "configuration", "settings"],
    "login": ["login", "signin", "sign in", "auth", "authenticate"],
    "intro": ["intro", "introduction", "getting started", "overview"],
    "tutorial": ["tutorial", "guide", "walkthrough", "how to", "learn"],
    "example": ["example", "sample", "demo"],
    "database": ["database", "db", "sql", "nosql"],
    "network": ["network", "http", "request", "response"],
    "performance": ["performance", "speed", "optimize", "optimization"],
    "security": ["security", "auth", "authentication", "authorization", "oauth"],
  };

  // Normalize and expand query into keywords (aliases + stems)
  const normalizeWords = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 1);

  const stem = (word) => {
    if (word.endsWith("ing") && word.length > 4) return word.slice(0, -3);
    if (word.endsWith("ed") && word.length > 3) return word.slice(0, -2);
    if (word.endsWith("es") && word.length > 3) return word.slice(0, -2);
    if (word.endsWith("s") && word.length > 2) return word.slice(0, -1);
    return word;
  };

  const expandedKeywords = (() => {
    const words = normalizeWords(q);
    const set = new Set();

    words.forEach(w => {
      set.add(w);
      set.add(stem(w));
      (aliases[w] || []).forEach(a => {
        set.add(a);
        set.add(stem(a));
      });
    });

    // Also include the full query string for phrase matches
    if (q.length > 2) set.add(q);

    return Array.from(set).filter(Boolean);
  })();

  // Score each section against expanded keywords
  const scored = websiteIndex.map(section => {
    let score = 0;
    const titleLower = section.sectionTitle.toLowerCase();
    const summaryLower = section.sectionSummary.toLowerCase();
    const combined = `${section.sectionTitle} ${section.sectionSummary}`.toLowerCase();

    expandedKeywords.forEach(keyword => {
      if (!keyword) return;
      if (titleLower.includes(keyword)) score += 6; // strong signal
      if (summaryLower.includes(keyword)) score += 2;
      // If full query phrase appears, boost
      if (keyword === q && combined.includes(keyword)) score += 3;
    });

    return { ...section, score };
  });

  // Filter and sort by relevance
  const results = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Check if clarification is needed (multiple equally-good matches)
  const needsClarification = results.length > 1 && 
    results[0].score === results[1].score;

  res.json({
    results,
    query,
    needsClarification,
    message: needsClarification
      ? `Found ${results.length} matching sections. Please clarify.`
      : results.length === 0
        ? "No sections match your query."
        : `Found ${results.length} matching section(s).`
  });
});

// Serve bookmarklet code
app.get('/bookmarklet.js', async (_req, res) => {
  try {
    const fs = await import('fs').then(m => m.default);
    const path = await import('path').then(m => m.default);
    const { fileURLToPath } = await import('url').then(m => m);
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const bookmarkletPath = path.join(__dirname, '..', 'bookmarklet.js');
    
    const code = fs.readFileSync(bookmarkletPath, 'utf-8');
    res.setHeader('Content-Type', 'application/javascript');
    res.send(code);
  } catch (err) {
    console.error('[agent-backend] Error serving bookmarklet:', err.message);
    res.status(500).json({ error: 'Could not serve bookmarklet' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[agent-backend] Running on http://localhost:${PORT}`);
  console.log('[agent-backend] ✓ Bookmarklet available at http://localhost:5000/bookmarklet.js');
  console.log('[agent-backend] ✓ Use in any website - works standalone or with backend index');
});
