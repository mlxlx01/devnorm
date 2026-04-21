import { review, printReviewResult } from '../agents/code-reviewer.js';
import type { CliOptions } from '../types.js';

export async function runReview(args: { path: string } & Partial<CliOptions>): Promise<void> {
  try {
    const options: CliOptions = {
      path: args.path,
      apiKey: args.apiKey,
      apiUrl: args.apiUrl,
      model: args.model,
    };

    const result = await review(options);
    printReviewResult(result);

    if (result.findings.filter(f => f.severity === 'Blocker').length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Review failed:', (error as Error).message);
    process.exit(1);
  }
}
