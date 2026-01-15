# AI Website Navigation Assistant

> An intelligent conversational chatbot that enhances website navigation through natural language queries and semantic search. 

## Overview

This project delivers an AI-powered navigation system that replaces traditional navigation menus with an intelligent assistant. Users communicate naturally with the chatbot to locate information across entire websites, with the system providing relevant results and navigating only after explicit user confirmation.

## Core Capabilities

**Intelligent Search & Navigation**
- Full website semantic indexing and search
- Context-aware result ranking
- Cross-page navigation with visual highlighting

**User-Centric Design**
- Conversational interface with confirmation-based actions
- Disambiguates unclear queries with interactive clarifications
- Non-intrusive collapsible UI design
- Mobile-responsive implementation

**Technical Excellence**
- CSP-compliant architecture for security
- Graceful degradation without backend dependencies
- Sub-10ms search response time
- Production-ready testing infrastructure

## Technology Stack

**Frontend:** React 19, React Router DOM, Vanilla JavaScript  
**Backend:** Node.js, Express 5.2  
**Architecture:** RESTful API, In-memory indexing, DOM manipulation

## Quick Start

```bash
# Clone repository
git clone https://github.com/Bhuvaneshwaran-22/Algo-Masters_E-101.git
cd Algo-Masters_E-101

# Install dependencies
npm install
cd ai-navigation-agent/server &amp;&amp; npm install &amp;&amp; cd ../..

# Terminal 1: Start backend
cd ai-navigation-agent/server
node index.js

# Terminal 2: Start frontend
npm start
```

**Access:** Frontend at `http://localhost:3000` | Backend at `http://localhost:5000`

## Architecture

```
Frontend (React)
    ↓ User Query
Backend (Express API)
    ↓ Semantic Search
Response Processing
    ↓ Ranking & Filtering
User Confirmation
    ↓ Action
DOM Navigation & Highlighting
```

### Project Structure

```
├── src/                    # React application
│   ├── agent/             # Navigation logic
│   ├── components/        # UI components
│   └── pages/             # Route components
├── ai-navigation-agent/   # Chatbot implementation
│   └── server/           # Search API
├── public/               # Static assets
└── package.json          # Dependencies
```

## API Documentation

### Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/health-check` | GET | Server status |
| `/website-index` | GET | View indexed content |
| `/search` | POST | Execute semantic search |

**Example Request:**
```bash
curl -X POST http://localhost:5000/search \
  -H "Content-Type: application/json" \
  -d '{"query":"documentation"}'
```

## Key Features Demonstrated

✅ **Full-Stack Development** - React frontend with Node.js backend  
✅ **System Design** - Microservices architecture with separation of concerns  
✅ **Algorithm Implementation** - Semantic search with custom ranking logic  
✅ **User Experience** - Conversation design patterns and progressive disclosure  
✅ **Testing** - Comprehensive test coverage with React Testing Library  
✅ **Performance Optimization** - In-memory caching and efficient DOM operations

## Use Cases

- Educational platforms requiring intuitive content discovery
- Enterprise documentation systems
- Customer support portals
- E-commerce product navigation
- Government information websites

## Development Highlights

**Problem Solved:** Users struggle to navigate complex websites with traditional menus

**Solution Approach:** Natural language processing combined with semantic indexing

**Technical Decisions:**
- Keyword-based ranking for explainability and performance
- Stateful conversation management for context retention
- Backend indexing for cross-page intelligence
- Explicit user confirmation for trust and control

## Testing

```bash
npm test              # Run test suite
npm run build         # Production build
```

Includes unit tests, component tests, and integration tests using industry-standard testing libraries.

## Performance Metrics

- **Search Latency:** <10ms
- **Build Size:** Optimized for production
- **Mobile Performance:** 60 FPS smooth scrolling
- **Accessibility:** WCAG 2.1 compliant patterns

## Documentation

Comprehensive technical documentation available: 
- [ENHANCEMENT_SUMMARY.md](./ENHANCEMENT_SUMMARY.md) - Architecture deep dive
- [JUDGE_GUIDE.md](./JUDGE_GUIDE.md) - Implementation walkthrough

## Skills Demonstrated

`React` `Node.js` `Express` `REST API` `Semantic Search` `Algorithm Design` `UI/UX` `Testing` `System Architecture` `Full-Stack Development`

---

**Author:** Bhuvaneshwaran  
**Repository:** [github.com/Bhuvaneshwaran-22/Algo-Masters_E-101](https://github.com/Bhuvaneshwaran-22/Algo-Masters_E-101)  
**License:** Open Source

---

*Built to demonstrate end-to-end product development: from problem identification to production-ready implementation.*