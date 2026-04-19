import chalk from 'chalk';
import { initializeDatabase } from '../../db/init';
import { sqlite } from "../../db/service"

const dbHandlers = {
  init: async () => {
    console.log(chalk.cyan('Initializing database...'));
    initializeDatabase(sqlite);
    console.log(chalk.green('✓ Database initialized successfully!'));
  },
  tables: async () => {
    const tables = sqlite.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as { name: string }[];

    console.log(chalk.cyan('\n╔═══════════════════════════════╗'));
    console.log(chalk.cyan('║  ') + chalk.bold.yellow('Database Tables') + chalk.cyan(' '.repeat(18)) + '║');
    console.log(chalk.cyan('╠═══════════════════════════════╣'));

    if (tables.length === 0) {
      console.log(chalk.cyan('║  ') + chalk.gray('No tables found') + chalk.cyan(' '.repeat(23)) + '║');
    } else {
      tables.forEach((table) => {
        console.log(chalk.cyan('║  ') + chalk.green('• ') + chalk.white(table.name) + chalk.cyan(' '.repeat(33 - table.name.length)) + '║');
      });
    }

    console.log(chalk.cyan('╚═══════════════════════════════╝\n'));
  },
};

const runQuery = async (sql: string) => {
  try {
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    if (isSelect) {
      const results = sqlite.prepare(sql).all();
      console.log(chalk.cyan('\n╔═══════════════════════════════╗'));
      console.log(chalk.cyan('║  ') + chalk.bold.yellow('Query Results') + chalk.cyan(' '.repeat(22)) + '║');
      console.log(chalk.cyan('╠═══════════════════════════════╣'));
      console.log(chalk.cyan('║  ') + chalk.green(`${results.length} row(s) found`) + chalk.cyan(' '.repeat(26)) + '║');
      console.log(chalk.cyan('╚═══════════════════════════════╝\n'));
      if (results.length > 0) {
        console.log(chalk.gray(JSON.stringify(results, null, 2)));
      }
    } else {
      sqlite.exec(sql);
      console.log(chalk.green('✓ Query executed successfully'));
    }
  } catch (error: any) {
    console.log(chalk.red(`✗ Error: ${error.message}`));
  }
};

export const dbCommand = {
  command: 'db <subCommand> [options]',
  describe: 'Database operations',
  builder: (yargs: any) => {
    return yargs
      .positional('subCommand', {
        type: 'string',
        describe: 'init | tables | query',
        choices: ['init', 'tables', 'query'],
      })
      .option('sql', {
        type: 'string',
        describe: 'SQL query (for query command)',
      })
      .demandOption('subCommand');
  },
  handler: async (argv: any) => {
    const subCmd = argv.subCommand;
    if (subCmd === 'query') {
      if (!argv.sql) {
        console.log(chalk.red('Error: --sql is required for query command'));
        process.exit(1);
      }
      await runQuery(argv.sql);
    } else {
      const handler = dbHandlers[subCmd as keyof typeof dbHandlers];
      if (handler) {
        await handler();
      }
    }
  },
};
