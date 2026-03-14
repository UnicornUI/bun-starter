import chalk from 'chalk';
import yargs from 'yargs';
import { serveCommand } from './cli/commands/serve';
import { dbCommand } from './cli/commands/db';
import { banner } from "./assets/logo";

console.log(chalk.cyan(banner.logo.trim()));
console.log(chalk.gray('─'.repeat(50)));
console.log(chalk.green('  Agent 会话管理服务 CLI'));
console.log(chalk.gray('─'.repeat(50)));
console.log('');

yargs(process.argv.slice(2))
  .scriptName('hono-server')
  .version('1.0.0')
  .command(serveCommand)
  .command(dbCommand)
  .help()
  .alias('h', 'help')
  .alias('v', 'version')
  .demandCommand(1, 'Please specify a command')
  .showHelpOnFail(true)
  .parse();
