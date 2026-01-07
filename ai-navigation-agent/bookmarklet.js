// UNIVERSAL AI NAVIGATION AGENT BOOKMARKLET
// Add this as a bookmark in your browser to inject the agent into ANY website
//
// TO USE:
// 1. Create a new bookmark in your browser
// 2. Name it: "AI Navigator"
// 3. Paste the code below as the URL (javascript: ... )
// 4. Visit any website and click the bookmark to activate the agent
//
// PRODUCTION: Change BACKEND_URL to your deployed backend

(function() {
  // Configuration
  const BACKEND_URL = 'http://localhost:5000';
  const AGENT_ID = 'universal-ai-nav-agent';

  // Don't reinject if already present
  if (document.getElementById(AGENT_ID)) {
    console.log('[AI Agent] Already loaded on this page');
    return;
  }

  console.log('[AI Agent] Initializing on:', window.location.hostname);

  // ===========================
  // STATE MANAGEMENT
  // ===========================
  const agentState = {
    isExpanded: false,
    conversationPhase: "idle",
    currentQuery: "",
    searchResults: [],
    selectedResult: null,
    messages: [],
    currentPageSections: []
  };

  // ===========================
  // STEP 1: SCAN CURRENT PAGE FOR CONTENT
  // ===========================
  function scanCurrentPage() {
    const sections = [];
    const headings = document.querySelectorAll('h1, h2, h3');
    
    headings.forEach((heading, idx) => {
      const title = heading.innerText?.trim() || '';
      if (!title || title.length < 2) return;
      if (/advertisement|sidebar|menu|nav|footer/i.test(title)) return;

      let container = heading.closest('section, article, main, [role="main"]');
      if (!container) container = heading.parentElement;

      const content = container?.innerText?.slice(0, 500) || title;
      
      sections.push({
        id: container?.id || `auto-${idx}`,
        title,
        content,
        element: container || heading
      });
    });

    agentState.currentPageSections = sections;
    return sections;
  }

  // ===========================
  // STEP 2: SEARCH BACKEND (for cross-page results)
  // ===========================
  async function searchBackend(query) {
    try {
      const response = await fetch(`${BACKEND_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          website: window.location.hostname
        })
      });
      
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.log('[AI Agent] Backend unavailable, using DOM-only mode');
      return { results: [], fallbackToDom: true };
    }
  }

  // ===========================
  // STEP 3: SEARCH CURRENT PAGE (fallback)
  // ===========================
  function searchCurrentPage(query) {
    const q = query.toLowerCase();
    const sections = agentState.currentPageSections;

    const scored = sections.map(section => {
      let score = 0;
      const titleLower = section.title.toLowerCase();
      const contentLower = section.content.toLowerCase();
      
      q.split(' ').forEach(word => {
        if (titleLower.includes(word)) score += 5;
        if (contentLower.includes(word)) score += 2;
      });

      return { ...section, score };
    }).filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored;
  }

  // ===========================
  // STEP 4: CONVERSATION HANDLER
  // ===========================
  async function handleUserInput() {
    const inputBox = document.getElementById('ai-agent-input');
    const query = inputBox.value.trim();
    
    if (!query) return;

    inputBox.value = '';
    addMessage(query, 'user');
    agentState.conversationPhase = 'searching';

    // First try backend
    const backendResults = await searchBackend(query);
    
    // Fallback to current page if backend unavailable
    let results = backendResults.fallbackToDom 
      ? searchCurrentPage(query)
      : backendResults.results || [];

    if (results.length === 0) {
      addMessage("I couldn't find matching sections. Try asking differently.", 'agent');
      agentState.conversationPhase = 'idle';
      return;
    }

    if (results.length === 1) {
      presentConfirmation(results[0]);
    } else {
      askClarification(results.slice(0, 3));
    }
  }

  // ===========================
  // STEP 5: CONFIRMATION UI
  // ===========================
  function presentConfirmation(result) {
    agentState.conversationPhase = 'confirming';
    agentState.selectedResult = result;

    const title = result.sectionTitle || result.title;
    addMessage(`Found: "${title}". Take you there?`, 'agent');

    addActionButtons([
      {
        label: '✓ Take me there',
        callback: () => performNavigation(result)
      },
      {
        label: '❌ Ask again',
        callback: () => {
          addMessage('What else are you looking for?', 'agent');
          agentState.conversationPhase = 'idle';
          document.getElementById('ai-agent-input').focus();
        }
      }
    ]);
  }

  // ===========================
  // STEP 6: CLARIFICATION UI (multiple matches)
  // ===========================
  function askClarification(results) {
    agentState.conversationPhase = 'clarifying';
    addMessage('Multiple results found. Which one?', 'agent');

    const actions = results.map((result, idx) => ({
      label: `${idx + 1}. ${result.sectionTitle || result.title}`,
      callback: () => {
        addMessage(result.sectionTitle || result.title, 'user');
        presentConfirmation(result);
      }
    }));

    addActionButtons(actions);
  }

  // ===========================
  // STEP 7: NAVIGATION
  // ===========================
  function performNavigation(result) {
    agentState.conversationPhase = 'navigating';
    
    // If element is available (current page result), scroll to it
    if (result.element) {
      addMessage('Scrolling...', 'agent');
      result.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      result.element.style.outline = '3px solid #ffd700';
      setTimeout(() => {
        result.element.style.outline = 'none';
      }, 3000);
    } else if (result.pageURL) {
      // Only navigate if same-origin to avoid unwanted redirects
      try {
        const target = new URL(result.pageURL, window.location.href);
        if (target.origin === window.location.origin) {
          addMessage(`Going to ${result.pageURL}...`, 'agent');
          window.location.href = result.pageURL;
        } else {
          addMessage('Staying on this page (different origin).', 'agent');
        }
      } catch (e) {
        addMessage('Bad target URL, staying here.', 'agent');
      }
    }

    agentState.conversationPhase = 'idle';
  }

  // ===========================
  // UI HELPERS
  // ===========================
  function addMessage(text, sender) {
    agentState.messages.push({ text, sender });
    
    const messagesArea = document.getElementById('ai-agent-messages');
    const bubble = document.createElement('div');
    bubble.style.cssText = `
      padding: 10px 12px;
      border-radius: 8px;
      max-width: 85%;
      word-wrap: break-word;
      font-size: 13px;
      ${sender === 'user' 
        ? 'background: #000; color: #fff; margin-left: auto; margin-right: 0;'
        : 'background: #f0f0f0; color: #000; margin-left: 0; margin-right: auto;'}
    `;
    bubble.textContent = text;
    messagesArea.appendChild(bubble);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function addActionButtons(actions) {
    const messagesArea = document.getElementById('ai-agent-messages');
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.style.cssText = `
        background: #000;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        text-align: left;
      `;
      btn.addEventListener('click', action.callback);
      btnContainer.appendChild(btn);
    });

    messagesArea.appendChild(btnContainer);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  // ===========================
  // FLOATING BUTTON UI
  // ===========================
  const floatingBtn = document.createElement('div');
  floatingBtn.id = AGENT_ID;
  floatingBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 16px;
    background: #000;
    color: #fff;
    border-radius: 25px;
    cursor: pointer;
    z-index: 99999;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    user-select: none;
  `;
  floatingBtn.textContent = '🤖 Help';
  
  const chatContainer = document.createElement('div');
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
    z-index: 99999;
    overflow: hidden;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    background: #000;
    color: #fff;
    padding: 16px;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = '<span>🤖 AI Navigator</span><button id="ai-agent-close" style="background:none;border:none;color:#fff;cursor:pointer;font-size:16px;">✕</button>';
  chatContainer.appendChild(header);

  // Messages area
  const messagesArea = document.createElement('div');
  messagesArea.id = 'ai-agent-messages';
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
  const inputArea = document.createElement('div');
  inputArea.style.cssText = `
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #eee;
    background: #fff;
  `;

  const inputBox = document.createElement('input');
  inputBox.id = 'ai-agent-input';
  inputBox.type = 'text';
  inputBox.placeholder = 'Ask me...';
  inputBox.style.cssText = `
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 13px;
    outline: none;
  `;
  inputBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUserInput();
  });
  inputArea.appendChild(inputBox);

  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Send';
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
  sendBtn.addEventListener('click', handleUserInput);
  inputArea.appendChild(sendBtn);

  chatContainer.appendChild(inputArea);

  // Toggle logic
  floatingBtn.addEventListener('click', () => {
    const isHidden = chatContainer.style.display === 'none';
    if (isHidden) {
      scanCurrentPage();
      floatingBtn.style.display = 'none';
      chatContainer.style.display = 'flex';
      inputBox.focus();
      
      if (agentState.messages.length === 0) {
        addMessage('Hi! 👋 What are you looking for on this page?', 'agent');
      }
    }
  });

  document.getElementById('ai-agent-close').addEventListener('click', () => {
    chatContainer.style.display = 'none';
    floatingBtn.style.display = 'block';
  });

  // Append to page
  document.body.appendChild(floatingBtn);
  document.body.appendChild(chatContainer);

  console.log('[AI Agent] ✓ Loaded successfully on ' + window.location.hostname);
})();
