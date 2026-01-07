# 🚀 Quick Start: Use AI Navigator on ANY Website

## Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd d:\HACK-Tide\ai-navigation-agent\server
node index.js
```

You should see:
```
[agent-backend] Running on http://localhost:5000
[agent-backend] ✓ Bookmarklet available at http://localhost:5000/bookmarklet.js
```

## Step 2: Add the Bookmarklet to Your Browser

### In Chrome/Edge:
1. Open **Bookmarks Manager** (Ctrl+Shift+B)
2. Click **⋮ → Add new bookmark**
3. **Name:** `AI Navigator`
4. **URL:** Paste this:
```javascript
javascript:(function(){fetch('http://localhost:5000/bookmarklet.js').then(r=>r.text()).then(code=>eval(code)).catch(e=>alert('Backend not running!'))})();
```
5. **Save**

### In Firefox:
1. Right-click toolbar → **Add bookmark...**
2. Name: `AI Navigator`
3. Location: Paste the URL above
4. Folder: Bookmarks Toolbar
5. Save

## Step 3: Use It On Any Website

1. **Visit any website** (try W3Schools, MDN, GitHub, etc.)
2. **Click the "AI Navigator" bookmark**
3. **Wait 1 second** for the 🤖 button to appear
4. **Click the button** to open the chat
5. **Ask a question** like:
   - "show me javascript"
   - "find css section"
   - "where is HTML"
   - "tell me about styling"

## Example Workflows

### Scenario 1: W3Schools Navigation
```
You:     "javascript tutorial"
Agent:   "Found: JS Introduction. Take you there?"
You:     Click "✓ Take me there"
Result:  Smoothly scrolls to the JavaScript section
```

### Scenario 2: MDN Multiple Results
```
You:     "css"
Agent:   "Multiple results. Which one?"
         1. CSS Introduction
         2. CSS Advanced
         3. CSS Examples
You:     Click "2. CSS Advanced"
Agent:   "Found: CSS Advanced. Take you there?"
You:     Click "✓ Take me there"
Result:  Navigates to CSS Advanced section
```

### Scenario 3: No Backend (Standalone Mode)
```
No backend running?
→ Agent falls back to scanning current page
→ Still works! Just slower and page-only
```

## Testing Checklist

- [ ] Backend running on localhost:5000
- [ ] Bookmarklet added to browser
- [ ] Visit any website
- [ ] Click bookmarklet - 🤖 button appears
- [ ] Type a question and press Enter
- [ ] Agent shows results
- [ ] Click "Take me there" - scrolls to section
- [ ] Works on different websites

## Troubleshooting

**"Backend not running!" alert?**
→ Start the server: `node server/index.js`

**Bookmarklet button not appearing?**
→ Reload the webpage
→ Check browser console for errors (F12)

**Agent not finding results?**
→ Try simpler keywords
→ Page must have proper h1/h2/h3 headings

**Works on one page but not another?**
→ Fallback to DOM-only mode automatically
→ Agent scans current page headings
→ Perfect for any HTML structure

## Advanced: Deploy to Public URL

Once you're happy with it locally, deploy the backend:

1. **Deploy to Heroku/Render/Railway:**
   ```bash
   git push heroku main
   ```

2. **Update bookmark URL:**
   ```javascript
   javascript:(function(){fetch('https://your-domain.com/bookmarklet.js').then(r=>r.text()).then(code=>eval(code)).catch(e=>alert('Backend unavailable'))})();
   ```

3. **Share with others** - they can now use your AI Navigator!

## How It Works

```
You type "javascript"
         ↓
    Agent scans page for h1/h2/h3
         ↓
    Queries backend for semantic search
         ↓
    Backend returns ranked results
         ↓
    Shows results or asks for clarification
         ↓
    On confirmation: scrolls or navigates
```

## No Backend Required!

The bookmarklet works **STANDALONE**:
- ✅ Scans current page for sections
- ✅ Full-text search within page
- ✅ Smooth scroll navigation
- ✅ Works offline

Backend is **optional** for:
- Cross-page semantic search
- Website-wide indexing
- Better rankings

---

**Ready?** Add the bookmarklet and try it on W3Schools right now! 🚀
