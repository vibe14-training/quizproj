const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const generate = require('./api/generate');

const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8']
};
const port = Number(process.env.PORT || 3000);

http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/generate') return generate(req, res);
  const file = files[pathname];
  if (!file || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  try {
    const content = await fs.readFile(path.join(__dirname, 'public', file[0]));
    res.writeHead(200, { 'Content-Type': file[1] });
    return res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    console.error(`Static file unavailable: ${file[0]}`);
    res.writeHead(500);
    return res.end('Server error');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Quiz app running at http://localhost:${port}`);
});
