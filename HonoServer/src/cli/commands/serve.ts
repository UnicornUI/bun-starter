import chalk from 'chalk';
import app from '../../routes/app';

export const serveCommand = {
  command: 'serve [options]',
  describe: 'Start the HTTP server',
  builder: (yargs: any) => {
    return yargs
      .option('port', {
        alias: 'p',
        type: 'number',
        default: 8080,
        describe: 'Port to listen on',
      })
      .option('host', {
        alias: 'H',
        type: 'string',
        default: '0.0.0.0',
        describe: 'Host to bind to',
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
        describe: 'Show verbose output',
      });
  },
  handler: async (argv: any) => {
    const port = argv.port || 8080;
    const host = argv.host || '0.0.0.0';
    const verbose = argv.verbose || false;

    console.log('');
    console.log(chalk.cyan('╔═══════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║  ') + chalk.bold.green('  Server starting...  ') + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.yellow(`Host: ${host}`) + chalk.cyan(' '.repeat(43 - host.length)) + '║');
    console.log(chalk.cyan('║  ') + chalk.yellow(`Port: ${port}`) + chalk.cyan(' '.repeat(44 - port.toString().length)) + '║');
    console.log(chalk.cyan('║  ') + chalk.blue(`API:  http://${host}:${port}/`) + chalk.cyan(' '.repeat(29)) + '║');
    console.log(chalk.cyan('║  ') + chalk.blue(`Doc:  http://${host}:${port}/doc`) + chalk.cyan(' '.repeat(28)) + '║');
    if (verbose) {
      console.log(chalk.cyan('║  ') + chalk.gray(`Verbose: enabled`) + chalk.cyan(' '.repeat(37)) + '║');
    }
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════╝'));
    console.log('');

    Bun.serve({
      port,
      hostname: host,
      fetch: app.fetch,
    });

    console.log(chalk.green(`✓ Server running at http://${host}:${port}`));
  },
};
