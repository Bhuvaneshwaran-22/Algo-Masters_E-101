// AI Navigator - Chrome/Edge Extension Content Script
// Bundled (no eval of remote code). Uses the same logic as bookmarklet.js
(function(){
  const BACKEND_URL = 'http://localhost:5000';
  const AGENT_ID = 'universal-ai-nav-agent';
  if (document.getElementById(AGENT_ID)) return;

  const log = (...a) => console.log('[AI Agent]', ...a);
  log('Initializing on:', location.hostname);

  const agentState = {
    isExpanded: false,
    conversationPhase: 'idle',
    currentQuery: '',
    searchResults: [],
    selectedResult: null,
    messages: [],
    currentPageSections: []
  };

  function findElementByTitle(title){
    if(!title) return null;
    const target=title.toLowerCase();
    const headings=document.querySelectorAll('h1, h2, h3');
    for(const heading of headings){
      const text=(heading.innerText||'').trim().toLowerCase();
      if(!text) continue;
      if(text.includes(target)||target.includes(text)){
        return heading.closest('section, article, main, [role="main"]')||heading.parentElement||heading;
      }
    }
    return null;
  }

  function navigateToElement(el){
    try{
      el.scrollIntoView({behavior:'smooth', block:'start'});
      el.style.outline='3px solid #ffd700';
      setTimeout(()=>{ try{ el.style.outline=''; }catch(e){} },3000);
    }catch(err){
      log('Failed to scroll:', err);
    }
  }

  function scanCurrentPage(){
    const sections=[];
    const headings=document.querySelectorAll('h1, h2, h3');
    headings.forEach((heading,idx)=>{
      const title=(heading.innerText||'').trim();
      if(!title||title.length<2) return;
      if(/advertisement|sidebar|menu|nav|footer/i.test(title)) return;
      let container=heading.closest('section, article, main, [role="main"]');
      if(!container) container=heading.parentElement;
      const content=(container?.innerText||title).slice(0,500);
      sections.push({id:container?.id||`auto-${idx}`, title, content, element:container||heading});
    });
    agentState.currentPageSections=sections;
    return sections;
  }

  async function searchBackend(query){
    try{
      const res=await fetch(`${BACKEND_URL}/search`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,website:location.hostname})});
      if(!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }catch(e){
      log('Backend unavailable, DOM-only mode');
      return {results:[], fallbackToDom:true};
    }
  }

  function searchCurrentPage(query){
    const q=query.toLowerCase();
    return agentState.currentPageSections.map(section=>{
      let score=0; const tl=section.title.toLowerCase(); const cl=section.content.toLowerCase();
      q.split(' ').forEach(w=>{ if(tl.includes(w)) score+=5; if(cl.includes(w)) score+=2; });
      return {...section, score};
    }).filter(s=>s.score>0).sort((a,b)=>b.score-a.score);
  }

  async function handleUserInput(){
    // Refresh sections in case the page content changed
    scanCurrentPage();
    const inputBox=document.getElementById('ai-agent-input');
    const query=(inputBox.value||'').trim();
    if(!query) return;
    inputBox.value='';
    addMessage(query,'user');
    agentState.conversationPhase='searching';
    const backendResults=await searchBackend(query);
    const results=backendResults.fallbackToDom?searchCurrentPage(query):(backendResults.results||[]);
    if(results.length===0){ addMessage("I couldn't find matching sections. Try asking differently.",'agent'); agentState.conversationPhase='idle'; return; }
    if(results.length===1){ presentConfirmation(results[0]); } else { askClarification(results.slice(0,3)); }
  }

  function presentConfirmation(result){
    agentState.conversationPhase='confirming';
    agentState.selectedResult=result;
    const title=result.sectionTitle||result.title;
    addMessage(`Found: "${title}". Take you there?`,'agent');
    addActionButtons([
      {label:'✓ Take me there', callback:()=>performNavigation(result)},
      {label:'❌ Ask again', callback:()=>{ addMessage('What else are you looking for?','agent'); agentState.conversationPhase='idle'; document.getElementById('ai-agent-input').focus(); }}
    ]);
  }

  function askClarification(results){
    agentState.conversationPhase='clarifying';
    addMessage('Multiple results found. Which one?','agent');
    addActionButtons(results.map((r,i)=>({ label:`${i+1}. ${r.sectionTitle||r.title}`, callback:()=>{ addMessage(r.sectionTitle||r.title,'user'); presentConfirmation(r); }})));
  }

  function performNavigation(result){
    agentState.conversationPhase='navigating';
    const title=result.sectionTitle||result.title||'';
    const element=result.element||findElementByTitle(title);

    if(element){
      addMessage(title?`Scrolling to "${title}"...`:'Scrolling...','agent');
      navigateToElement(element);
      agentState.conversationPhase='idle';
      return;
    }

    if(result.pageURL){
      try {
        const target=new URL(result.pageURL, location.href);
        if (target.origin === location.origin) {
          addMessage(`Going to ${result.pageURL}...`,'agent');
          location.href=result.pageURL;
        } else {
          addMessage('Staying on this page (different origin).','agent');
        }
      } catch(e){
        addMessage('Bad target URL, staying here.','agent');
      }
      agentState.conversationPhase='idle';
      return;
    }

    addMessage('Could not find where to navigate.','agent');
    agentState.conversationPhase='idle';
  }

  function addMessage(text,sender){
    agentState.messages.push({text,sender});
    const area=document.getElementById('ai-agent-messages');
    const bubble=document.createElement('div');
    bubble.style.cssText=`padding:10px 12px;border-radius:8px;max-width:85%;word-wrap:break-word;font-size:13px;${sender==='user'?'background:#000;color:#fff;margin-left:auto;margin-right:0;':'background:#f0f0f0;color:#000;margin-left:0;margin-right:auto;'}`;
    bubble.textContent=text; area.appendChild(bubble); area.scrollTop=area.scrollHeight;
  }

  function addActionButtons(actions){
    const area=document.getElementById('ai-agent-messages');
    const wrap=document.createElement('div'); wrap.style.cssText='display:flex;flex-direction:column;gap:6px;';
    actions.forEach(a=>{ const b=document.createElement('button'); b.textContent=a.label; b.style.cssText='background:#000;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-size:12px;text-align:left;'; b.addEventListener('click',a.callback); wrap.appendChild(b); });
    area.appendChild(wrap); area.scrollTop=area.scrollHeight;
  }

  // UI
  const floatingBtn=document.createElement('div');
  floatingBtn.id=AGENT_ID;
  floatingBtn.style.cssText='position:fixed;bottom:20px;right:20px;padding:12px 16px;background:#000;color:#fff;border-radius:25px;cursor:pointer;z-index:99999;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);user-select:none;';
  floatingBtn.textContent='🤖 Help';

  const chatContainer=document.createElement('div');
  chatContainer.style.cssText='position:fixed;bottom:20px;right:20px;width:380px;height:550px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);display:none;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;z-index:99999;overflow:hidden;';

  const header=document.createElement('div');
  header.style.cssText='background:#000;color:#fff;padding:16px;font-weight:bold;font-size:14px;display:flex;justify-content:space-between;align-items:center;';
  header.innerHTML='<span>🤖 AI Navigator</span><button id="ai-agent-close" style="background:none;border:none;color:#fff;cursor:pointer;font-size:16px;">✕</button>';
  chatContainer.appendChild(header);

  const messagesArea=document.createElement('div');
  messagesArea.id='ai-agent-messages';
  messagesArea.style.cssText='flex:1;overflow-y:auto;padding:16px;background:#f9f9f9;display:flex;flex-direction:column;gap:12px;';
  chatContainer.appendChild(messagesArea);

  const inputArea=document.createElement('div');
  inputArea.style.cssText='display:flex;gap:8px;padding:12px;border-top:1px solid #eee;background:#fff;';

  const inputBox=document.createElement('input'); inputBox.id='ai-agent-input'; inputBox.type='text'; inputBox.placeholder='Ask me...'; inputBox.style.cssText='flex:1;border:1px solid #ddd;border-radius:6px;padding:10px 12px;font-size:13px;outline:none;';
  inputBox.addEventListener('keydown',(e)=>{ if(e.key==='Enter') handleUserInput(); });
  inputArea.appendChild(inputBox);

  const sendBtn=document.createElement('button'); sendBtn.textContent='Send'; sendBtn.style.cssText='background:#000;color:#fff;border:none;border-radius:6px;padding:10px 16px;cursor:pointer;font-size:13px;font-weight:bold;';
  sendBtn.addEventListener('click',handleUserInput);
  inputArea.appendChild(sendBtn);

  chatContainer.appendChild(inputArea);

  floatingBtn.addEventListener('click',()=>{
    if(chatContainer.style.display==='none'){
      scanCurrentPage(); floatingBtn.style.display='none'; chatContainer.style.display='flex'; inputBox.focus();
      if(agentState.messages.length===0){ addMessage('Hi! 👋 What are you looking for on this page?','agent'); }
    }
  });

  document.addEventListener('click', (e)=>{
    if((e.target||{}).id==='ai-agent-close'){ chatContainer.style.display='none'; floatingBtn.style.display='block'; }
  }, true);

  document.body.appendChild(floatingBtn);
  document.body.appendChild(chatContainer);

  log('✓ Loaded successfully on', location.hostname);
})();
