# 🤖 Universal AI Navigator Bookmarklet

Inject the AI navigation agent into **ANY website** instantly!

## Quick Start

### 1. Create Bookmarklet (One-time setup)

**Option A: Manual Setup**
1. Open your browser
2. Create a new bookmark
3. Name it: `AI Navigator`
4. Paste this as the URL:

```javascript
javascript:(function(){fetch('http://localhost:5000/bookmarklet.js').then(r=>r.text()).then(code=>eval(code)).catch(e=>alert('Backend unavailable. Start servers first.'))})();
```

**Option B: Click to Add (if deployed)**
- We'll provide a clickable link once deployed to public URL

### 2. Use It

1. Visit **any website** (W3Schools, MDN, GitHub, etc.)
2. Click the `AI Navigator` bookmark
3. A floating 🤖 button appears
4. Click it and ask questions!

## How It Works

### Phase 1: Page Scanning
When you open chat, the agent scans the current page for all sections (h1, h2, h3)

### Phase 2: Smart Search
- **If backend available**: Searches both backend index + current page
- **If backend offline**: Falls back to DOM-only search (still works!)

### Phase 3: Results
- **1 match** → Confirms and navigates
- **Multiple matches** → Asks you to clarify
- **No matches** → Suggests better phrasing

### Phase 4: Navigation
- **Same page** → Smooth scroll + highlight
- **Different page** → Navigates to relevant page (if backend indexed it)

## Configuration

### For Production Deployment

Edit the backend URL in `bookmarklet.js`:

```javascript
const BACKEND_URL = 'https://your-domain.com';  // Change this
```

Or set env variable:
```bash
export BACKEND_URL=https://your-domain.com
```

## Supported Websites

Works on any website with semantic HTML:
- ✅ W3Schools
- ✅ MDN Web Docs
- ✅ GitHub
- ✅ Stack Overflow
- ✅ Your own websites
- ✅ **ANY website!**

## Browser Compatibility

- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Any browser with JavaScript + Fetch API

## Testing Locally

```bash
# Terminal 1: Start backend
cd server && node index.js

# Terminal 2: (optional) Start demo server
cd ai-navigation-agent && node serve-demo.mjs

# Then in browser:
# 1. Add the bookmarklet above
# 2. Visit http://localhost:3000
# 3. Click bookmarklet
# 4. Try: "javascript", "css", "html"
```

## No Backend? DOM-Only Mode

If you don't have a backend running, the bookmarklet still works!
- Scans current page for content
- Searches within visible sections
- Navigates by scrolling

Perfect for quick demos without setup.

## Advanced: Custom Backend Index

To index a specific website with the backend:

```bash
curl -X POST http://localhost:5000/index-website \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "https://example.com"}'
```

Backend will crawl and index all pages for semantic search.

## Troubleshooting

**"Backend unavailable" message?**
- Ensure backend is running: `node server/index.js`
- Check URL in bookmarklet code
- Backend will work if accessible

**Agent not appearing?**
- Check browser console for errors
- Verify JavaScript is enabled
- Try a different website

**Search not finding things?**
- Try different keywords
- Check the page has proper HTML headings (h1, h2, h3)
- Use simpler query terms

## Security Notes

- ✅ No data sent to external servers (by default)
- ✅ All processing happens in browser or your own backend
- ✅ Works on secure (HTTPS) sites
- ⚠️ Only for websites you own or trust

---

**Ready to use?** Add the bookmarklet above and visit any website!
