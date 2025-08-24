import 'dotenv/config';
import { spawn } from 'child_process';
import chalk from 'chalk';
import readlineSync from 'readline-sync';
import { startInteractiveTerminal } from '@/utils/interactiveTerminal';

console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
console.log(chalk.blue.bold('║                S2Mangas Interactive Dev Mode                ║'));
console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
console.log();

console.log(chalk.yellow.bold('🚀 Iniciando servidor em modo interativo...'));
console.log();

// Iniciar o servidor em background
const serverProcess = spawn('tsx', ['watch', 'src/server.ts'], {
  stdio: 'pipe',
  shell: true
});

// Capturar logs do servidor
serverProcess.stdout?.on('data', (data) => {
  const output = data.toString();
  if (output.includes('✅ Servidor inciado com sucesso')) {
    console.log(chalk.green('✅ Servidor iniciado com sucesso!'));
    console.log();
    console.log(chalk.cyan('🎮 Terminal interativo disponível!'));
    console.log(chalk.gray('Pressione Enter para acessar o menu...'));
    
    // Aguardar um pouco para o servidor estabilizar
    setTimeout(() => {
      readlineSync.question('');
      startInteractiveTerminal();
    }, 2000);
  } else {
    process.stdout.write(data);
  }
});

serverProcess.stderr?.on('data', (data) => {
  process.stderr.write(data);
});

// Capturar sinais de término
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Encerrando servidor...'));
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Encerrando servidor...'));
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

// Aguardar o processo do servidor
serverProcess.on('close', (code) => {
  console.log(chalk.red(`\n❌ Servidor encerrado com código: ${code}`));
  process.exit(code || 0);
});
