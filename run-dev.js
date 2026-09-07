const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'Backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '   Starting MitraScan AI (Backend + Frontend)   ');
console.log('\x1b[36m%s\x1b[0m', '==================================================\n');

// 1. Start Backend Server
const backend = spawn('node', ['server.js'], {
  cwd: backendDir,
  env: process.env,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe']
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[BACKEND]\x1b[0m ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[BACKEND ERROR]\x1b[0m ${data}`);
});

// 2. Start Frontend Dev Server
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  env: process.env,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe']
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[FRONTEND]\x1b[0m ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[FRONTEND INFO]\x1b[0m ${data}`);
});

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down MitraScan AI servers...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
