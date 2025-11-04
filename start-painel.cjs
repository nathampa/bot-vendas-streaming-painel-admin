// start-painel.cjs
const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando servidor de painel admin...');

const serve = spawn('serve', ['dist', '-p', '3001', '-s'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

serve.on('error', (err) => {
  console.error('Erro ao iniciar serve:', err);
  process.exit(1);
});

serve.on('exit', (code) => {
  console.log(`Serve encerrado com código ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  serve.kill('SIGINT');
});

process.on('SIGTERM', () => {
  serve.kill('SIGTERM');
});