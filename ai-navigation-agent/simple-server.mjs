import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

console.log('[Start] Creating HTTP server...');

const server = http.createServer((req, res) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  
  let filePath = path.join(__dirname, req.url === '/' ? 'demo.html' : req.url);
  
  // Security check
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Read file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    
    // Determine content type
    const ext = path.extname(filePath);
    let contentType = 'text/plain';
    if (ext === '.html') contentType = 'text/html';
    if (ext === '.js' || ext === '.mjs') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

console.log('[Setup] Adding error handler...');
server.on('error', (err) => {
  console.error('[Error]', err.message);
  process.exit(1);
});

console.log('[Setup] Starting listen on port ' + PORT);
server.listen(PORT, () => {
  console.log('[Ready] Server running at http://localhost:' + PORT);
});

console.log('[End of startup code]');
