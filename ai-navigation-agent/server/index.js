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

  // Keyword aliases for better matching
  const aliases = {
    "javascript": ["js", "script", "javascript"],
    "js": ["javascript", "js", "script"],
    "html": ["html", "markup", "structure"],
    "css": ["css", "style", "styling", "design"],
    "style": ["css", "style", "styling", "design"],
    "design": ["css", "style", "styling", "design"]
  };

  // Get matching keywords for this query
  const matchKeywords = aliases[q] || [q];

  // Score each section against query
  const scored = websiteIndex.map(section => {
    let score = 0;
    const titleLower = section.sectionTitle.toLowerCase();
    const summaryLower = section.sectionSummary.toLowerCase();

    // Check if any matched keyword is in title or summary
    matchKeywords.forEach(keyword => {
      if (titleLower.includes(keyword)) score += 5;
      if (summaryLower.includes(keyword)) score += 1;
    });

    // Also check original query words (for longer queries)
    const words = q.split(" ");
    words.forEach(word => {
      if (!matchKeywords.includes(word)) {
        if (titleLower.includes(word)) score += 3;
        if (summaryLower.includes(word)) score += 1;
      }
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[agent-backend] Running on http://localhost:${PORT}`);
  console.log("[agent-backend] Provides website-wide semantic index for intelligent navigation");
});
