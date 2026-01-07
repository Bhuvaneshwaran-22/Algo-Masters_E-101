const express = require("express");

const app = express();
app.use(express.json());

// Basic CORS headers without external dependency
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Echo endpoint to align with frontend ChatWidget
app.post("/agent", (req, res) => {
  const { query, sections } = req.body || {};
  // Stub logic: return no specific section, just acknowledge
  res.json({ message: "Agent stub", receivedQuery: query, sectionsCount: Array.isArray(sections) ? sections.length : 0 });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
