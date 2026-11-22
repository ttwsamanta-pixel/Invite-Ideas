const path = require('node:path')
const root = path.resolve(__dirname, '..')

module.exports = {
  apps: [
    { name: 'inviteideas-frontend', cwd: path.join(root, 'apps/web'), script: 'npm', args: 'start -- --hostname 127.0.0.1', env: { NODE_ENV: 'production' } },
    { name: 'inviteideas-backend', cwd: path.join(root, 'apps/api'), script: 'npm', args: 'start', env: { NODE_ENV: 'production' } },
  ],
}
