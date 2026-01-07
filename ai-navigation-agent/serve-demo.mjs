import fs from 'fs';
import http from 'http';
import path from 'path';

const PORT = 3000;

const server = http.createServer((req, res) => {
  let filePath = path.join(process.cwd(), req.url === '/' ? 'demo.html' : req.url);
  
  // Prevent directory traversal
  if (!filePath.startsWith(process.cwd())) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    const ext = path.extname(filePath);
    let contentType = 'text/plain';
    if (ext === '.html') contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Demo server running at http://localhost:${PORT}`);
});
