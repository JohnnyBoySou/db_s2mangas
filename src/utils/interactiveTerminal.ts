import chalk from 'chalk';
import inquirer from 'inquirer';
import { logger } from './logger';
import { getRedisClient } from '@/config/redis';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
}

class InteractiveTerminal {
  private logs: LogEntry[] = [];
  private isRunning = true;

  constructor() {
    this.setupLogCapture();
  }

  private setupLogCapture() {
    // Capturar logs do sistema
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      this.addLog('info', args.join(' '));
      originalLog(...args);
    };

    console.error = (...args) => {
      this.addLog('error', args.join(' '));
      originalError(...args);
    };

    console.warn = (...args) => {
      this.addLog('warn', args.join(' '));
      originalWarn(...args);
    };
  }

  private addLog(level: LogEntry['level'], message: string) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message
    });

    // Manter apenas os últimos 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }

  private clearScreen() {
    console.clear();
  }

  private showHeader() {
    console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║                    S2Mangas Dev Terminal                    ║'));
    console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
    console.log();
  }

  private async showMenu() {
    const choices = [
      { name: '📊 Status do Sistema', value: 'status' },
      { name: '📝 Visualizar Logs', value: 'logs' },
      { name: '🗑️  Limpar Logs', value: 'clear-logs' },
      { name: '🔄 Reload do Servidor', value: 'reload' },
      { name: '🗄️  Status do Redis', value: 'redis' },
      { name: '🧪 Testes Rápidos', value: 'tests' },
      { name: '📁 Abrir no VS Code', value: 'vscode' },
      { name: '🌐 Abrir no Navegador', value: 'browser' },
      { name: '📚 Documentação', value: 'docs' },
      { name: '❌ Sair', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Escolha uma opção:',
        choices,
        pageSize: 10
      }
    ]);

    return action;
  }

  private async showSystemStatus() {
    this.clearScreen();
    this.showHeader();
    
    console.log(chalk.yellow.bold('📊 Status do Sistema:'));
    console.log();

    // Status do Redis
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        const ping = await redisClient.ping();
        console.log(chalk.green('✅ Redis: Conectado') + ` (${ping})`);
      } else {
        console.log(chalk.red('❌ Redis: Não conectado'));
      }
    } catch (error: any) {
      console.log(chalk.red('❌ Redis: Erro na conexão'));
    }

    // Status das variáveis de ambiente
    console.log();
    console.log(chalk.yellow.bold('🔧 Variáveis de Ambiente:'));
    console.log(`NODE_ENV: ${chalk.cyan(process.env.NODE_ENV || 'development')}`);
    console.log(`PORT: ${chalk.cyan(process.env.PORT || '3000')}`);
    console.log(`REDIS_URL: ${chalk.cyan(process.env.REDIS_URL ? 'Configurado' : 'Não configurado')}`);
    console.log(`REDIS_PUBLIC_URL: ${chalk.cyan(process.env.REDIS_PUBLIC_URL ? 'Configurado' : 'Não configurado')}`);
    console.log(`DATABASE_URL: ${chalk.cyan(process.env.DATABASE_URL ? 'Configurado' : 'Não configurado')}`);

    // Uptime
    console.log();
    console.log(chalk.yellow.bold('⏱️  Informações:'));
    console.log(`Uptime: ${chalk.cyan(this.formatUptime(process.uptime()))}`);
    console.log(`Memória: ${chalk.cyan(this.formatMemoryUsage())}`);
    console.log(`PID: ${chalk.cyan(process.pid)}`);

    await this.waitForEnter();
  }

  private async showLogs() {
    this.clearScreen();
    this.showHeader();
    
    console.log(chalk.yellow.bold('📝 Logs Recentes:'));
    console.log();

    const recentLogs = this.logs.slice(-20);
    
    if (recentLogs.length === 0) {
      console.log(chalk.gray('Nenhum log disponível'));
    } else {
      recentLogs.forEach(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const levelColor = this.getLevelColor(log.level);
        const levelText = this.getLevelText(log.level);
        
        console.log(`${chalk.gray(time)} ${levelColor(levelText)} ${log.message}`);
      });
    }

    console.log();
    console.log(chalk.gray(`Mostrando ${recentLogs.length} de ${this.logs.length} logs`));
    await this.waitForEnter();
  }

  private async clearLogs() {
    this.logs = [];
    console.log(chalk.green('✅ Logs limpos com sucesso!'));
    await this.waitForEnter();
  }

  private async reloadServer() {
    console.log(chalk.yellow('🔄 Reiniciando servidor...'));
    console.log(chalk.gray('Pressione Ctrl+C para parar o processo atual'));
    console.log(chalk.gray('Em seguida, execute: npm run dev'));
    await this.waitForEnter();
  }

  private async showRedisStatus() {
    this.clearScreen();
    this.showHeader();
    
    console.log(chalk.yellow.bold('🗄️  Status do Redis:'));
    console.log();

    try {
      const redisClient = getRedisClient();
      if (!redisClient) {
        console.log(chalk.red('❌ Cliente Redis não disponível'));
        await this.waitForEnter();
        return;
      }

      // Teste de conexão
      const ping = await redisClient.ping();
      console.log(chalk.green(`✅ Ping: ${ping}`));

      // Informações do servidor
      const info = await redisClient.info();
      const lines = info.split('\n');
      
      console.log();
      console.log(chalk.yellow.bold('📊 Informações do Servidor:'));
      
      const relevantInfo = [
        'redis_version',
        'connected_clients',
        'used_memory_human',
        'uptime_in_seconds',
        'total_commands_processed'
      ];

      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (relevantInfo.includes(key)) {
          console.log(`${chalk.cyan(key)}: ${chalk.white(value)}`);
        }
      });

      // Teste de operações básicas
      console.log();
      console.log(chalk.yellow.bold('🧪 Teste de Operações:'));
      
      await redisClient.set('test_key', 'test_value');
      const value = await redisClient.get('test_key');
      await redisClient.del('test_key');
      
      console.log(chalk.green('✅ Set/Get/Delete: Funcionando'));

    } catch (error: any) {
      console.log(chalk.red(`❌ Erro: ${error.message}`));
    }

    await this.waitForEnter();
  }

  private async runQuickTests() {
    this.clearScreen();
    this.showHeader();
    
    console.log(chalk.yellow.bold('🧪 Testes Rápidos:'));
    console.log();

    const tests = [
      { name: 'Redis Connection', fn: this.testRedis },
      { name: 'Environment Variables', fn: this.testEnvVars },
      { name: 'File System', fn: this.testFileSystem },
      { name: 'Network', fn: this.testNetwork }
    ];

    for (const test of tests) {
      try {
        console.log(`🔍 Testando: ${test.name}...`);
        await test.fn();
        console.log(chalk.green(`✅ ${test.name}: OK`));
      } catch (error: any) {
        console.log(chalk.red(`❌ ${test.name}: ${error.message}`));
      }
      console.log();
    }

    await this.waitForEnter();
  }

  private async testRedis() {
    const redisClient = getRedisClient();
    if (!redisClient) throw new Error('Cliente não disponível');
    await redisClient.ping();
  }

  private testEnvVars() {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Variáveis faltando: ${missing.join(', ')}`);
    }
  }

  private async testFileSystem() {
    const fs = require('fs').promises;
    await fs.access('./src');
  }

  private async testNetwork() {
    const { default: axios } = await import('axios');
    await axios.get('http://localhost:3000/health', { timeout: 5000 });
  }

  private async openInVSCode() {
    try {
      await execAsync('code .');
      console.log(chalk.green('✅ VS Code aberto!'));
    } catch (error) {
      console.log(chalk.red('❌ Erro ao abrir VS Code'));
    }
    await this.waitForEnter();
  }

  private async openInBrowser() {
    const port = process.env.PORT || 3000;
    const url = `http://localhost:${port}`;
    
    try {
      await execAsync(`open ${url}`);
      console.log(chalk.green(`✅ Navegador aberto em ${url}`));
    } catch (error) {
      console.log(chalk.red('❌ Erro ao abrir navegador'));
      console.log(chalk.cyan(`Acesse manualmente: ${url}`));
    }
    await this.waitForEnter();
  }

  private async showDocumentation() {
    this.clearScreen();
    this.showHeader();
    
    console.log(chalk.yellow.bold('📚 Documentação:'));
    console.log();
    console.log(chalk.cyan('🔗 Endpoints:'));
    console.log('  • Health: /health');
    console.log('  • API Docs: /docs');
    console.log('  • Metrics: /metrics');
    console.log();
    console.log(chalk.cyan('📁 Estrutura:'));
    console.log('  • src/modules/ - Módulos da aplicação');
    console.log('  • src/config/ - Configurações');
    console.log('  • src/middlewares/ - Middlewares');
    console.log('  • docs/ - Documentação técnica');
    console.log();
    console.log(chalk.cyan('🛠️  Comandos Úteis:'));
    console.log('  • npm run dev - Desenvolvimento');
    console.log('  • npm run build - Build de produção');
    console.log('  • npm run test - Executar testes');
    console.log('  • npm run studio - Prisma Studio');

    await this.waitForEnter();
  }

  private getLevelColor(level: LogEntry['level']) {
    switch (level) {
      case 'error': return chalk.red;
      case 'warn': return chalk.yellow;
      case 'info': return chalk.blue;
      case 'debug': return chalk.gray;
      default: return chalk.white;
    }
  }

  private getLevelText(level: LogEntry['level']) {
    switch (level) {
      case 'error': return 'ERROR';
      case 'warn': return 'WARN ';
      case 'info': return 'INFO ';
      case 'debug': return 'DEBUG';
      default: return 'LOG  ';
    }
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }

  private formatMemoryUsage(): string {
    const usage = process.memoryUsage();
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100;
    return `${mb(usage.heapUsed)}MB / ${mb(usage.heapTotal)}MB`;
  }

  private async waitForEnter() {
    console.log();
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Pressione Enter para continuar...',
        default: ''
      }
    ]);
  }

  public async start() {
    while (this.isRunning) {
      this.clearScreen();
      this.showHeader();

      const action = await this.showMenu();

      switch (action) {
        case 'status':
          await this.showSystemStatus();
          break;
        case 'logs':
          await this.showLogs();
          break;
        case 'clear-logs':
          await this.clearLogs();
          break;
        case 'reload':
          await this.reloadServer();
          break;
        case 'redis':
          await this.showRedisStatus();
          break;
        case 'tests':
          await this.runQuickTests();
          break;
        case 'vscode':
          await this.openInVSCode();
          break;
        case 'browser':
          await this.openInBrowser();
          break;
        case 'docs':
          await this.showDocumentation();
          break;
        case 'exit':
          this.isRunning = false;
          console.log(chalk.green('👋 Até logo!'));
          process.exit(0);
          break;
      }
    }
  }
}

export const startInteractiveTerminal = () => {
  const terminal = new InteractiveTerminal();
  terminal.start();
};
