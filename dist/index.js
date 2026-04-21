#!/usr/bin/env node
import { Command } from 'commander';
import { runReview } from './commands/review.js';
import { runInit } from './commands/init.js';
const program = new Command();
program
    .name('devnorm')
    .description('AI-powered code quality for teams')
    .version('0.1.0');
program
    .command('review')
    .alias('r')
    .description('Review code for bugs and quality issues')
    .option('-p, --path <path>', 'Path to review', '.')
    .option('--api-key <key>', 'MiniMax API key')
    .option('--api-url <url>', 'MiniMax API URL')
    .option('--model <model>', 'Model to use')
    .action(async (args) => {
    await runReview(args);
});
program
    .command('init')
    .description('Initialize DevNorm in current directory')
    .action(async () => {
    await runInit();
});
program.parse();
