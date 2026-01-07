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
     ROBUST SCROLLING HELPERS
     ========================= */
  function getFixedHeaderHeight() {
    // Sum heights of fixed/sticky elements at the top
    let height = 0;
    document.querySelectorAll("*").forEach(el => {
      const style = window.getComputedStyle(el);
      const pos = style.position;
      const top = parseInt(style.top || "9999");
      if ((pos === "fixed" || pos === "sticky") && top <= 50) {
        height = Math.max(height, el.getBoundingClientRect().height);
      }
    });
    return height;
  }

  function findScrollableContainer(el) {
    // Traverse up to find a scrollable ancestor
    let node = el.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const hasScroll = /auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
      if (hasScroll) return node;
      node = node.parentElement;
    }
    return null;
  }

  function expandCollapsed(el) {
    // Try to expand if inside a collapsed accordion/details
    let node = el;
    while (node && node !== document.body) {
      // details element
      if (node.tagName === "DETAILS" && !node.open) {
        node.open = true;
        console.log("[agent] expanded <details>");
        return true;
      }
      // aria-expanded false
      if (node.getAttribute("aria-expanded") === "false") {
        const trigger = node.querySelector("[aria-controls], .accordion-button, summary, .toggle");
        if (trigger) trigger.click();
        console.log("[agent] clicked collapse trigger");
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function navigateToElement(el) {
    // Try multiple methods to ensure visible scroll
    if (!el) return false;

    // 1. Try to expand if collapsed
    expandCollapsed(el);

    // 2. Ensure element is visible
    if (el.style.display === "none") el.style.display = "block";
    if (el.offsetParent === null) el.style.visibility = "visible";

    // 3. Check if in scrollable container
    const scrollCont = findScrollableContainer(el);
    if (scrollCont) {
      const rect = el.getBoundingClientRect();
      const offset = el.offsetTop - scrollCont.scrollTop;
      scrollCont.scrollTo({ top: Math.max(0, offset - 100), behavior: "smooth" });
      console.log("[agent] scrolled in container");
    } else {
      // 4. Use window scroll with fixed header offset
      const fixedH = getFixedHeaderHeight();
      const rect = el.getBoundingClientRect();
      const targetTop = window.scrollY + rect.top - fixedH - 20;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      console.log("[agent] scrolled with offset");
    }

    // 5. Fallback: anchor navigation
    if (!el.id) el.id = "agent-target-" + Math.random().toString(36).slice(2);
    location.hash = "#" + el.id;

    // 6. Highlight with better visibility
    el.style.transition = "outline 0.3s ease-in-out";
    el.style.outline = "4px solid orange";
    el.style.outlineOffset = "2px";
    el.style.zIndex = "2147483647";

    setTimeout(() => {
      el.style.outline = "none";
      el.style.zIndex = "";
    }, 3500);

    return true;
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
        navigateToElement(el);
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
