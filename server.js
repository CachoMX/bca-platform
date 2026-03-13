const path = require('path');
const { createServer } = require('http');
const next = require('next');

process.env.NODE_ENV = 'production';
process.chdir(__dirname);

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log('> PulseBC ready on port', port);
  });
});
