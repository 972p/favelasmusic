const path = require('path')
process.env.NODE_ENV = 'production'
// Hostinger uses passenger or direct PM2, so we need to set the working directory for standalone to find .next
process.chdir(__dirname)

// On charge le serveur Next.js depuis le build standalone
const NextServer = require('./.next/standalone/server.js')
