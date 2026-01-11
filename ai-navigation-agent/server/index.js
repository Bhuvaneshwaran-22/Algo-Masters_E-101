import express from "express";

// AI Navigation Backend - site-wide crawl + search
// Frontend only sees the current DOM; this backend crawls the origin and builds an index.

const app = express();

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

// Cache per origin
const ORIGIN_CACHE = new Map(); // origin -> { sections, indexedAt }
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PAGES = 12;
const MAX_DEPTH = 2;

const sanitizeText = (text, limit = 600) => {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim().slice(0, limit);
};

function stripTags(html) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractLinks(html, baseUrl, depth) {
  const links = new Set();
  const regex = /href\s*=\s*"([^"]+)"/gi;
  let match;
  const base = new URL(baseUrl);
  while ((match = regex.exec(html))) {
    const raw = match[1];
    if (!raw || raw.startsWith("mailto:") || raw.startsWith("javascript:")) continue;
    try {
      const url = new URL(raw, base);
      if (url.origin !== base.origin) continue;
      url.hash = "";
      links.add(url.href);
    } catch (e) {
      continue;
    }
  }
  return Array.from(links).map(href => ({ href, depth: depth + 1 }));
}

function extractSectionsFromHtml(html, pageURL) {
  const sections = [];
  if (!html) return sections;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? sanitizeText(titleMatch[1], 120) : "";

  const headingRegex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hm;
  while ((hm = headingRegex.exec(html))) {
    const headingText = sanitizeText(stripTags(hm[2]), 160);
    if (!headingText) continue;
    sections.push({
      pageURL,
      sectionTitle: headingText,
      sectionSummary: headingText,
      sectionType: `H${hm[1]}`
    });
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyMatch ? sanitizeText(stripTags(bodyMatch[1]), 600) : sanitizeText(stripTags(html), 600);
  if (bodyText) {
    sections.push({
      pageURL,
      sectionTitle: pageTitle || "Page",
      sectionSummary: bodyText,
      sectionType: "body"
    });
  }

  return sections;
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "ai-nav-bot/1.0" } });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return null;
    return await res.text();
  } catch (err) {
    console.log("[agent-backend] fetch failed", url, err.message);
    return null;
  }
}

async function crawlOrigin(originStr) {
  console.log(`[agent-backend] Crawling origin ${originStr}`);
  const origin = new URL(originStr).origin;
  const queue = [{ href: origin, depth: 0 }];
  const visited = new Set();
  const sections = [];

  while (queue.length && visited.size < MAX_PAGES) {
    const { href, depth } = queue.shift();
    if (visited.has(href)) continue;
    visited.add(href);
    if (depth > MAX_DEPTH) continue;

    const html = await fetchPage(href);
    if (!html) continue;
    sections.push(...extractSectionsFromHtml(html, href));

    if (visited.size >= MAX_PAGES) break;
    const links = extractLinks(html, href, depth).filter(l => l.depth <= MAX_DEPTH);
    for (const link of links) {
      if (!visited.has(link.href) && queue.length + visited.size < MAX_PAGES) {
        queue.push(link);
      }
    }
  }

  console.log(`[agent-backend] Crawl complete: ${sections.length} sections, ${visited.size} pages visited`);
  return sections;
}

async function getIndexForOrigin(originStr) {
  const cached = ORIGIN_CACHE.get(originStr);
  if (cached && Date.now() - cached.indexedAt < CACHE_TTL_MS) {
    return cached.sections;
  }
  const sections = await crawlOrigin(originStr);
  ORIGIN_CACHE.set(originStr, { sections, indexedAt: Date.now() });
  return sections;
}

function expandKeywords(q) {
  const aliases = {
    javascript: ["js", "script", "javascript", "node", "typescript"],
    js: ["javascript", "script", "js"],
    script: ["javascript", "script", "js"],
    typescript: ["ts", "typescript", "javascript"],
    html: ["html", "markup", "structure", "document"],
    css: ["css", "style", "styling", "design", "layout"],
    style: ["css", "style", "design", "theme"],
    design: ["css", "style", "design", "ux", "ui"],
    layout: ["css", "grid", "flex", "layout"],
    api: ["api", "endpoint", "interface"],
    function: ["function", "method", "procedure"],
    array: ["array", "list", "vector", "collection"],
    object: ["object", "json", "dictionary", "map"],
    loop: ["loop", "iterate", "iteration", "for", "while"],
    error: ["error", "bug", "issue", "problem"],
    install: ["install", "installation", "setup", "set up"],
    config: ["config", "configuration", "settings"],
    login: ["login", "signin", "sign in", "auth", "authenticate"],
    intro: ["intro", "introduction", "getting started", "overview"],
    tutorial: ["tutorial", "guide", "walkthrough", "how to", "learn"],
    example: ["example", "sample", "demo"],
    database: ["database", "db", "sql", "nosql"],
    network: ["network", "http", "request", "response"],
    performance: ["performance", "speed", "optimize", "optimization"],
    security: ["security", "auth", "authentication", "authorization", "oauth"],
  };

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

  if (q.length > 2) set.add(q);
  return Array.from(set).filter(Boolean);
}

function scoreSections(sections, q) {
  const expandedKeywords = expandKeywords(q);
  console.log(`[agent-backend] Expanded "${q}" to keywords:`, expandedKeywords.slice(0, 10));
  
  const scored = sections.map(section => {
    let score = 0;
    const titleLower = section.sectionTitle.toLowerCase();
    const summaryLower = section.sectionSummary.toLowerCase();
    const urlLower = section.pageURL.toLowerCase();
    const combined = `${section.sectionTitle} ${section.sectionSummary} ${section.pageURL}`.toLowerCase();

    expandedKeywords.forEach(keyword => {
      if (!keyword) return;
      if (titleLower.includes(keyword)) score += 6;
      if (summaryLower.includes(keyword)) score += 2;
      if (urlLower.includes(keyword)) score += 1;
      if (keyword === q && combined.includes(keyword)) score += 3;
    });

    return { ...section, score };
  });

  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
}

// Health
app.get("/health-check", (_req, res) => {
  res.json({ status: "ok", cachedOrigins: Array.from(ORIGIN_CACHE.keys()) });
});

// Website index (per origin)
app.get("/website-index", async (req, res) => {
  const origin = req.query.origin;
  if (!origin) return res.status(400).json({ message: "origin query param required" });
  const sections = await getIndexForOrigin(origin);
  res.json({ count: sections.length, sections });
});

// Search
app.post("/search", async (req, res) => {
  const { query = "", origin = "", website = "" } = req.body || {};
  const q = String(query).toLowerCase().trim();

  if (!q) return res.json({ results: [], message: "Empty query." });

  const deriveOrigin = () => {
    const candidates = [origin, website, req.headers.origin, req.headers.referer];
    for (const c of candidates) {
      if (!c) continue;
      try {
        const val = /^https?:\/\//i.test(c) ? c : `https://${c}`;
        const url = new URL(val);
        return url.origin;
      } catch (e) {
        continue;
      }
    }
    return null;
  };

  const originStr = deriveOrigin();
  if (!originStr) return res.status(400).json({ results: [], message: "Origin required." });

  let originUrl;
  try {
    originUrl = new URL(originStr);
  } catch (err) {
    return res.status(400).json({ results: [], message: "Invalid origin." });
  }

  try {
    console.log(`[agent-backend] Searching origin=${originUrl.origin} query="${q}"`);
    const index = await getIndexForOrigin(originUrl.origin);
    console.log(`[agent-backend] Index has ${index.length} sections`);
    const results = scoreSections(index, q);
    console.log(`[agent-backend] Found ${results.length} matching results`);
    const needsClarification = results.length > 1 && results[0].score === results[1]?.score;

    return res.json({
      results,
      query,
      needsClarification,
      message:
        needsClarification
          ? "Multiple matches found. Please clarify which one you want."
          : results.length === 0
            ? "No relevant matches found."
            : undefined
    });
  } catch (err) {
    console.error("[agent-backend] Search error", err);
    return res.status(500).json({ results: [], message: "Search failed." });
  }
});

// Serve bookmarklet JS for convenience
app.get("/bookmarklet.js", (_req, res) => {
  res.sendFile(new URL("../bookmarklet.js", import.meta.url));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[agent-backend] Running on http://localhost:${PORT}`);
  console.log(`[agent-backend] ✓ Bookmarklet available at http://localhost:${PORT}/bookmarklet.js`);
  console.log(`[agent-backend] ✓ Understanding is backend-side; navigation stays client-side`);
});
