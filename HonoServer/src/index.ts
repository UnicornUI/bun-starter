import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from "yargs/helpers"
import { serveCommand } from './cli/commands/serve';
import { dbCommand } from './cli/commands/db';
import { banner } from "./assets/logo";

console.log(chalk.cyan(banner.logo.trim()));
console.log(chalk.gray('─'.repeat(50)));
console.log(chalk.green('  Agent 会话管理服务 CLI'));
console.log(chalk.gray('─'.repeat(50)));
console.log('');

process.on("unhandledRejection", (e) => {
  console.error("unhandledRejection", e)
})

process.on("uncaughtException", (e) => {
  console.error("exception", e.message)
})

const cli = yargs(hideBin(process.argv))
  .scriptName('hono-server')
  .version('1.0.0')
  .wrap(100)
  .command(serveCommand)
  .command(dbCommand)
  .option("print-logs", {
    describe: "print logs to stderr",
    type: "boolean",
  })
  .option("log-level", {
    describe: "log level",
    type: "string",
    choices: ["DEBUG", "INFO", "WARN", "ERROR"],
  })
  .option("pure", {
    describe: "run without external plugins",
    type: "boolean",
  })
  .completion("completion", "generate shell completion script")
  .help("help", "show help")
  .alias('h', 'help')
  .alias('v', 'version')
  .demandCommand(1, 'Please specify a command')
  .fail((msg, err) => {
    if (
      msg?.startsWith("Unknown argument") ||
      msg?.startsWith("Not enough non-option arguments") ||
      msg?.startsWith("Invalid values:")
    ) {
      if (err) throw err
      cli.showHelp("log")
    }
    if (err) throw err
    process.exit(1)
  })
  .strict()

try {
  await cli.parse();
} catch (e) {
  let data: Record<string, any> = {}
  if (e instanceof Error) {
    Object.assign(data, {error: e.message })
  }

  if (e instanceof Error) {
    Object.assign(data, {
      name: e.name,
      message: e.message,
      cause: e.cause?.toString(),
      stack: e.stack,
    })
  }

  if (e instanceof ResolveMessage) {
    Object.assign(data, {
      name: e.name,
      message: e.message,
      code: e.code,
      specifier: e.specifier,
      referrer: e.referrer,
      position: e.position,
      importKind: e.importKind,
    })
  }
  process.exitCode = 1
} finally {
  // Some subprocesses don't react properly to SIGTERM and similar signals.
  // Most notably, some docker-container-based MCP servers don't handle such signals unless
  // run using `docker run --init`.
  // Explicitly exit to avoid any hanging subprocesses.
  // But don't exit if we're running the serve command (which keeps the server alive)
  const isServeCommand = process.argv.includes('serve');
  if (!isServeCommand) {
    process.exit()
  }
}

