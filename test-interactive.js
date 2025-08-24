require('dotenv').config();
const chalk = require('chalk');
const inquirer = require('inquirer');

async function showTestMenu() {
  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║                    S2Mangas Dev Terminal                    ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
  console.log();

  const choices = [
    { name: '📊 Status do Sistema', value: 'status' },
    { name: '🔧 Variáveis de Ambiente', value: 'env' },
    { name: '🧪 Teste de Cores', value: 'colors' },
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

  switch (action) {
    case 'status':
      console.log(chalk.green('✅ Sistema funcionando!'));
      console.log(`PID: ${process.pid}`);
      console.log(`Uptime: ${process.uptime()}s`);
      break;
    case 'env':
      console.log(chalk.cyan('🔧 Variáveis de Ambiente:'));
      console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log(`PORT: ${process.env.PORT || '3000'}`);
      console.log(`REDIS_URL: ${process.env.REDIS_URL ? 'Configurado' : 'Não configurado'}`);
      console.log(`REDIS_PUBLIC_URL: ${process.env.REDIS_PUBLIC_URL ? 'Configurado' : 'Não configurado'}`);
      break;
    case 'colors':
      console.log(chalk.red('🔴 Vermelho'));
      console.log(chalk.green('🟢 Verde'));
      console.log(chalk.blue('🔵 Azul'));
      console.log(chalk.yellow('🟡 Amarelo'));
      console.log(chalk.magenta('🟣 Magenta'));
      console.log(chalk.cyan('🔵 Ciano'));
      break;
    case 'exit':
      console.log(chalk.green('Até logo!'));
      process.exit(0);
      break;
  }

  console.log(chalk.gray('\nPressione Enter para continuar...'));
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: '',
      default: ''
    }
  ]);
}

showTestMenu();
