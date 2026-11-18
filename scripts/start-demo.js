// Preview the hosted mobile app, or opt into running both demos locally.
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const frontend = path.resolve(__dirname, '..');
const mobile = path.resolve(frontend, '..', 'CMSMobileApp');
const localMobile = process.argv.includes('--local-mobile');
const hostedMobileUrl = 'https://cms-mobile-app.vercel.app/dashboard';
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}
function launch(label, cwd, script, args, env) {
  const child = spawn(process.execPath, [script, ...args], { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  children.push(child);
  child.stdout.on('data', (data) => process.stdout.write(`[${label}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${label}] ${data}`));
  child.on('error', (error) => { console.error(error.message); stop(1); });
  child.on('exit', (code) => { if (!stopping) stop(code || 0); });
}
function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(new Error(`Port ${port} is already in use. Stop the existing server before running npm run demo.`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
(async () => {
  const vite = path.join(mobile, 'node_modules/vite/bin/vite.js');
  if (localMobile && !fs.existsSync(vite)) throw new Error('CMSMobileApp must be next to CMSFrontend. Run npm install in both projects first.');
  await Promise.all(localMobile ? [checkPort(3000), checkPort(5173)] : [checkPort(3000)]);
  require('./patch-material-table');
  console.log(`\nCMS showcase: http://localhost:3000/mobile-demo\nMobile app: ${localMobile ? 'http://localhost:5173' : hostedMobileUrl}\nPress Ctrl+C to stop the demo.\n`);
  if (localMobile) launch('mobile', mobile, vite, ['--mode', 'demo', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { VITE_DEMO_MODE: 'true' });
  launch('frontend', frontend, require.resolve('react-scripts/scripts/start'), [], {
    BROWSER: 'none', HOST: '127.0.0.1', PORT: '3000', PUBLIC_URL: '/',
    REACT_APP_DEMO_MODE: 'true',
    ...(localMobile ? { REACT_APP_MOBILE_DEMO_URL: 'http://localhost:5173' } : {}),
  });
})().catch((error) => { console.error(error.message); stop(1); });
