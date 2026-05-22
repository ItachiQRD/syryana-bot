import http from 'http';

const port = Number(process.env.PORT || 3000);

http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Syrbot Syryana — en ligne');
}).listen(port, () => {
  console.log(`💓 Health check actif sur le port ${port} (hébergement gratuit)`);
});
