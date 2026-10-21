// Runs after every `npm install` (npm lifecycle hook). Only triggers the
// production build when CPANEL_AUTOBUILD=1 is set — i.e. only when this is
// running inside cPanel's "Run NPM Install" (Setup Node.js App), not during
// normal local development or the existing GitHub Actions CI, where `npm
// install`/`npm ci` must stay fast and side-effect-free.
//
// Set CPANEL_AUTOBUILD=1 as an Environment Variable in cPanel's Setup Node.js
// App screen before clicking "Run NPM Install" — see DEPLOYMENT.md.

const { execSync } = require('child_process');

if (process.env.CPANEL_AUTOBUILD !== '1') {
  process.exit(0);
}

console.log('==> CPANEL_AUTOBUILD=1 detected: building for production');
execSync('npx next build', { stdio: 'inherit' });
execSync('bash scripts/postbuild-cpanel.sh', { stdio: 'inherit' });
