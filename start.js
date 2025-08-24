#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting S2Mangas Backend...');

// Check if dist/server.js exists
const serverPath = path.join(__dirname, 'dist', 'server.js');
const fs = require('fs');

if (!fs.existsSync(serverPath)) {
  console.error('❌ dist/server.js not found. Please run npm run build first.');
  process.exit(1);
}

// Start the server
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
});

// Handle process signals
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  server.kill('SIGINT');
});

// Handle server exit
server.on('close', (code) => {
  console.log(`✅ Server process exited with code ${code}`);
  process.exit(code);
});

server.on('error', (error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
