(function () {

  // AI Website Navigation Agent
  // DOM-first guidance with optional backend-assisted multi-page routing.
  // Default behavior relies ONLY on in-page DOM scanning (CSP-safe on third-party sites).
  // Backend fetch is used ONLY on our own demo page (localhost or demo.html) and is optional.
  // If backend is unreachable (e.g., CSP blocks), we gracefully fall back to DOM guidance.

  /* =========================
     DOM SCANNER
     ========================= */
  function scanDOM() {
    const sections = [];
    const headings = document.querySelectorAll("h1, h2, h3");

    headings.forEach((heading, index) => {
      const title = heading.innerText.trim();

      // Ignore noisy headings
      if (title.length < 3) return;
      if (/example|try it|advertisement/i.test(title)) return;

      let container = heading.closest("section, article, main, div");
      if (!container) container = heading.parentElement;

      const text = container.innerText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400);

      sections.push({
        id: container.id || `auto-section-${index}`,
        title,
        content: text
      });
    });

    return sections;
  }

  /* =========================
     INTENT ENGINE (IMPROVED RANKING)
     ========================= */
 async function getBestSection(query, sections) {
  query = query.toLowerCase();

  let bestMatch = null;
  let bestScore = -Infinity;

  sections.forEach(section => {
    const titleText = section.title.toLowerCase();
    const contentText = section.content.toLowerCase();

    let score = 0;

    // Word matching
    query.split(" ").forEach(word => {
      if (titleText.includes(word)) score += 3;
      if (contentText.includes(word)) score += 1;
    });

    // Penalize navigation / non-content sections
    if (
      /menu|sidebar|certificate|program|exercise|quiz|reference|service/i.test(
        section.title
      )
    ) {
      score -= 2;
    }

    // Boost main tutorial content
    if (section.id === "main") {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = section;
    }
  });

  return bestMatch;
}


  /* =========================
     BACKEND TOGGLE + SAFE FALLBACK
     ========================= */
  function shouldUseBackend() {
    try {
      const isLocalhost = /localhost|127\.0\.0\.1/.test(location.hostname);
      const isDemoFile = /demo\.html$/i.test(location.pathname) || location.protocol === "file:";
      return isLocalhost || isDemoFile;
    } catch (_) {
      return false;
    }
  }

  async function tryBackendSearch(query) {
    // Only attempt when allowed; otherwise return null
    if (!shouldUseBackend()) return null;

    try {
      const res = await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!res.ok) throw new Error("search failed");

      const data = await res.json();
      // Expected shape: { page, sectionTitle, reason }
      console.log("[agent] backend suggestion:", data);
      return data;
    } catch (err) {
      // CSP or network errors are expected on third-party sites; fallback silently
      console.log("[agent] backend unavailable, using DOM-only.", err?.message || err);
      return null;
    }
  }


  /* =========================
     UI WIDGET
     ========================= */
  const button = document.createElement("div");
  button.innerText = "🤖 Any doubts?";
  button.style.position = "fixed";
  button.style.bottom = "20px";
  button.style.right = "20px";
  button.style.padding = "12px 16px";
  button.style.background = "#000";
  button.style.color = "#fff";
  button.style.borderRadius = "25px";
  button.style.cursor = "pointer";
  button.style.zIndex = "9999";
  button.style.fontFamily = "Arial, sans-serif";
  button.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";

  /* =========================
     CLICK HANDLER
     ========================= */

  button.onclick = async () => {
    const query = prompt("What are you looking for?");
    if (!query) return;

    const sections = scanDOM();
    console.log("[agent] Detected sections:", sections);

    const best = await getBestSection(query, sections);

    if (best) {
      alert(
        `I guided you to "${best.title}" because it best matches your intent.`
      );

      const el = document.getElementById(best.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        // Highlight effect
        el.style.transition = "outline 0.3s ease-in-out";
        el.style.outline = "4px solid orange";

        setTimeout(() => {
          el.style.outline = "none";
        }, 3000);
      }
    } else {
      // If no clear in-page section, optionally ask backend (on demo pages only)
      const suggestion = await tryBackendSearch(query);

      if (suggestion) {
        alert(
          `I recommend page "${suggestion.page}" → section "${suggestion.sectionTitle}".\nReason: ${suggestion.reason}`
        );
        // On our demo page, you could navigate or show a link. We do not auto-navigate on third-party sites.
      } else {
        alert(
          "I couldn't confidently find a matching section. Please try rephrasing your question."
        );
      }
    }
  };

  document.body.appendChild(button);
})();
