// Custom server for IIS/iisnode - handles named pipes via process.env.PORT
const path = require('path')
const { createServer } = require('http')

const dir = path.join(__dirname)
process.env.NODE_ENV = 'production'
process.chdir(__dirname)

// Read nextConfig from the generated standalone server.js
const nextConfig = require('./server.standalone.config.json')

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)

const next = require('next')
const app = next({ dev: false, dir, conf: nextConfig })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res)
  })

  // iisnode passes named pipe path as PORT, e.g. \\.\pipe\GUID
  // Regular deployments pass a numeric port
  const port = process.env.PORT || 3000
  server.listen(port, () => {
    console.log('> Ready on', port)
  })
})
