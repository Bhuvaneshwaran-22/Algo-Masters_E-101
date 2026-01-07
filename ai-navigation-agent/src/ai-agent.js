(function () {

  // ========================================
  // AI WEBSITE NAVIGATION CHATBOT AGENT
  // ========================================
  // 
  // DESIGN PHILOSOPHY:
  // 1. Website-wide semantic understanding (backend index)
  // 2. Conversation-first: explain → clarify → confirm → navigate
  // 3. Modern chatbot UX: collapsed button → expanded chat window
  // 4. Progressive disclosure: don't navigate until user confirms
  //
  // KEY DIFFERENCES FROM SINGLE-PAGE AGENT:
  // - Backend maintains semantic index of all pages
  // - Frontend handles conversation flow + confirmation
  // - Clarification logic when multiple matches exist
  // - Explicit navigation confirmation (insurance/govt chatbot style)

  /* =========================
     STATE MANAGEMENT
     ========================= */
  const agentState = {
    isExpanded: false,           // UI: collapsed vs expanded chat
    conversationPhase: "idle",   // idle | searching | clarifying | confirming | navigating
    currentQuery: "",            // User's original question
    searchResults: [],           // Backend search results
    selectedResult: null,        // User's choice after clarification
    messages: []                 // Chat history
  };

  /* =========================
     DOM SCANNER (Single Page Only)
     ========================= */
  function scanDOM() {
    const sections = [];
    const headings = document.querySelectorAll("h1, h2, h3");

    headings.forEach((heading, index) => {
      const title = heading.innerText.trim();
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
     RANKING (Single Page)
     ========================= */
  async function getBestSection(query, sections) {
    query = query.toLowerCase();
    let bestMatch = null;
    let bestScore = -Infinity;

    sections.forEach(section => {
      const titleText = section.title.toLowerCase();
      const contentText = section.content.toLowerCase();

      let score = 0;
      query.split(" ").forEach(word => {
        if (titleText.includes(word)) score += 3;
        if (contentText.includes(word)) score += 1;
      });

      if (/menu|sidebar|certificate|program|exercise|quiz|reference|service/i.test(section.title)) {
        score -= 2;
      }

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
     BACKEND INTEGRATION
     ========================= */
  async function queryWebsiteIndex(query) {
    // Query the backend website-wide semantic index
    if (!query.trim()) return { results: [] };

    try {
      const res = await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!res.ok) throw new Error("backend search failed");
      const data = await res.json();

      console.log("[agent] Backend results:", data);
      return data;
    } catch (err) {
      console.log("[agent] Backend unavailable (expected on third-party sites), using DOM only", err?.message);
      return { results: [], message: "Backend unavailable" };
    }
  }

  /* =========================
     SCROLLING HELPERS
     ========================= */
  function getFixedHeaderHeight() {
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
    let node = el;
    while (node && node !== document.body) {
      if (node.tagName === "DETAILS" && !node.open) {
        node.open = true;
        console.log("[agent] expanded <details>");
        return true;
      }
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
    if (!el) return false;

    expandCollapsed(el);

    if (el.style.display === "none") el.style.display = "block";
    if (el.offsetParent === null) el.style.visibility = "visible";

    const scrollCont = findScrollableContainer(el);
    if (scrollCont) {
      const rect = el.getBoundingClientRect();
      const offset = el.offsetTop - scrollCont.scrollTop;
      scrollCont.scrollTo({ top: Math.max(0, offset - 100), behavior: "smooth" });
      console.log("[agent] scrolled in container");
    } else {
      const fixedH = getFixedHeaderHeight();
      const rect = el.getBoundingClientRect();
      const targetTop = window.scrollY + rect.top - fixedH - 20;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      console.log("[agent] scrolled with offset");
    }

    if (!el.id) el.id = "agent-target-" + Math.random().toString(36).slice(2);
    window.location.hash = "#" + el.id;

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
     CHATBOT UI: COLLAPSED STATE
     ========================= */
  const floatingButton = document.createElement("div");
  floatingButton.id = "ai-agent-floating-btn";
  floatingButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 16px;
    background: #000;
    color: #fff;
    border-radius: 25px;
    cursor: pointer;
    z-index: 9998;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    user-select: none;
  `;
  floatingButton.textContent = "🤖 Any doubts?";

  floatingButton.addEventListener("click", () => {
    if (!agentState.isExpanded) {
      expandChat();
    }
  });

  /* =========================
     CHATBOT UI: EXPANDED STATE
     ========================= */
  const chatContainer = document.createElement("div");
  chatContainer.id = "ai-agent-chat-container";
  chatContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    height: 550px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    display: none;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    z-index: 9999;
    overflow: hidden;
  `;

  // Header with title and buttons
  const header = document.createElement("div");
  header.style.cssText = `
    background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
    color: #fff;
    padding: 16px;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  `;
  header.innerHTML = `
    <span>🤖 AI Navigation Assistant</span>
    <div style="display: flex; gap: 4px;">
      <button id="ai-agent-minimize" style="background:none;border:none;color:#fff;cursor:pointer;font-size:16px;padding:4px 8px;">−</button>
      <button id="ai-agent-close" style="background:none;border:none;color:#fff;cursor:pointer;font-size:16px;padding:4px 8px;">✕</button>
    </div>
  `;
  chatContainer.appendChild(header);

  // Messages area
  const messagesArea = document.createElement("div");
  messagesArea.id = "ai-agent-messages";
  messagesArea.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f9f9f9;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;
  chatContainer.appendChild(messagesArea);

  // Input area
  const inputArea = document.createElement("div");
  inputArea.style.cssText = `
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #eee;
    background: #fff;
  `;

  const inputBox = document.createElement("input");
  inputBox.type = "text";
  inputBox.placeholder = "Ask me anything...";
  inputBox.style.cssText = `
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 13px;
    outline: none;
  `;

  inputBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && agentState.conversationPhase !== "navigating") {
      handleUserInput();
    }
  });
  inputArea.appendChild(inputBox);

  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  sendBtn.style.cssText = `
    background: #000;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 13px;
    font-weight: bold;
  `;
  sendBtn.addEventListener("click", handleUserInput);
  inputArea.appendChild(sendBtn);

  chatContainer.appendChild(inputArea);

  /* =========================
     HELPERS: UI
     ========================= */
  function expandChat() {
    agentState.isExpanded = true;
    floatingButton.style.display = "none";
    chatContainer.style.display = "flex";
    inputBox.focus();
  }

  function collapseChat() {
    agentState.isExpanded = false;
    chatContainer.style.display = "none";
    floatingButton.style.display = "block";
  }

  function addMessage(text, sender = "agent") {
    const msgDiv = document.createElement("div");
    msgDiv.style.cssText = `
      display: flex;
      justify-content: ${sender === "user" ? "flex-end" : "flex-start"};
      gap: 8px;
    `;

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.5;
      word-wrap: break-word;
      background: ${sender === "user" ? "#000" : "#e8e8e8"};
      color: ${sender === "user" ? "#fff" : "#000"};
    `;
    bubble.textContent = text;
    msgDiv.appendChild(bubble);

    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function addActionButtons(actions) {
    // actions: [ { label, callback }, ... ]
    const buttonsDiv = document.createElement("div");
    buttonsDiv.style.cssText = `
      display: flex;
      gap: 8px;
      padding: 0 16px;
      justify-content: flex-start;
      flex-wrap: wrap;
    `;

    actions.forEach(action => {
      const btn = document.createElement("button");
      btn.textContent = action.label;
      btn.style.cssText = `
        background: #000;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 12px;
        cursor: pointer;
      `;
      btn.addEventListener("click", () => {
        action.callback();
        buttonsDiv.remove();
      });
      buttonsDiv.appendChild(btn);
    });

    messagesArea.appendChild(buttonsDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  /* =========================
     CONVERSATION FLOW
     ========================= */
  async function handleUserInput() {
    const query = inputBox.value.trim();
    if (!query) return;

    inputBox.value = "";

    // User message
    addMessage(query, "user");
    agentState.currentQuery = query;
    agentState.conversationPhase = "searching";

    // Search the website index
    const backendResult = await queryWebsiteIndex(query);
    agentState.searchResults = backendResult.results || [];

    console.log("[agent] Search results:", agentState.searchResults);

    if (agentState.searchResults.length === 0) {
      addMessage(
        "I couldn't find any matching sections. Could you rephrase your question?",
        "agent"
      );
      agentState.conversationPhase = "idle";
      return;
    }

    if (agentState.searchResults.length === 1) {
      presentConfirmation(agentState.searchResults[0]);
      return;
    }

    // Multiple matches - ask for clarification
    askClarification(agentState.searchResults.slice(0, 3));
  }

  function presentConfirmation(result) {
    agentState.conversationPhase = "confirming";
    agentState.selectedResult = result;

    const explanation = `I found information about "${result.sectionTitle}".`;
    addMessage(explanation, "agent");

    addActionButtons([
      {
        label: "✓ Take me there",
        callback: async () => {
          agentState.conversationPhase = "navigating";
          await performNavigation(result);
          agentState.conversationPhase = "idle";
        }
      },
      {
        label: "🔗 Show link",
        callback: () => {
          addMessage(`Link: ${result.pageURL}`, "agent");
          agentState.conversationPhase = "idle";
        }
      },
      {
        label: "❌ Ask again",
        callback: () => {
          addMessage("What else are you looking for?", "agent");
          agentState.conversationPhase = "idle";
          inputBox.focus();
        }
      }
    ]);
  }

  function askClarification(results) {
    agentState.conversationPhase = "clarifying";

    addMessage(`Found multiple sections. Which one?`, "agent");

    const actions = results.map((result, index) => ({
      label: `${index + 1}. ${result.sectionTitle}`,
      callback: () => {
        addMessage(result.sectionTitle, "user");
        presentConfirmation(result);
      }
    }));

    addActionButtons(actions);
  }

  async function performNavigation(result) {
    // Find element on current page
    const domElements = document.querySelectorAll("h1, h2, h3");
    let targetElement = null;

    for (const el of domElements) {
      if (el.textContent.trim().includes(result.sectionTitle)) {
        targetElement = el.closest("section, article, main, div") || el.parentElement;
        break;
      }
    }

    if (targetElement) {
      addMessage(`Taking you to "${result.sectionTitle}"...`, "agent");
      navigateToElement(targetElement);
    } else {
      addMessage(`Couldn't locate section on this page.`, "agent");
    }
  }

  /* =========================
     INITIALIZATION
     ========================= */
  document.body.appendChild(floatingButton);
  document.body.appendChild(chatContainer);

  // Event listeners
  const minimizeBtn = document.getElementById("ai-agent-minimize");
  const closeBtn = document.getElementById("ai-agent-close");

  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", collapseChat);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", collapseChat);
  }

  // Welcome message
  expandChat();
  addMessage(
    "Hi! 👋 I can help you find information on this website. What are you looking for?",
    "agent"
  );
  agentState.conversationPhase = "idle";

})();
