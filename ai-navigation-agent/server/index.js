import express from "express";

// AI Navigation Backend
// Role: Optional multi-page guidance for our own demo pages only.
// Returns lightweight suggestions without crawling or vector DB.

const app = express();
// Basic CORS headers without external dependency for demo
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

// Health check for demo automation
app.get("/health-check", (_req, res) => {
  res.json({ status: "ok" });
});

// POST /search → { page, sectionTitle, reason }
// Minimal heuristic mapping for hackathon demo.
app.post("/search", (req, res) => {
  const { query = "" } = req.body || {};
  const q = String(query).toLowerCase();

  // Simple intent → page mapping (demo only)
  const catalog = [
    { match: /html|tags|elements/, page: "w3schools/html/", sectionTitle: "HTML Introduction" },
    { match: /css|styles|layout/, page: "w3schools/css/", sectionTitle: "CSS Introduction" },
    { match: /javascript|js|events/, page: "w3schools/js/", sectionTitle: "JS Introduction" },
    { match: /react|components|hooks/, page: "react.dev/learn", sectionTitle: "React - Learn" },
  ];

  let suggestion = {
    page: "demo.html",
    sectionTitle: "Getting Started",
    reason: "Default recommendation for general queries."
  };

  for (const item of catalog) {
    if (item.match.test(q)) {
      suggestion = {
        page: item.page,
        sectionTitle: item.sectionTitle,
        reason: `Matched keywords for "${query}"`
      };
      break;
    }
  }

  res.json(suggestion);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
