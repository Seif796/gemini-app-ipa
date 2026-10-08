const { spawn } = require('child_process');
const path = require('path');

console.log('⚡ Starting Aether AI iOS Companion (Server + Client)...\n');

// Start backend
const serverProcess = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' }
});

// Start frontend
const clientProcess = spawn('npx', ['vite', '--host'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
});
