const http = require('http');

const port = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'CareerVerse backend is running' }));
});

server.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
