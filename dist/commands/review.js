import { review, printReviewResult } from '../agents/code-reviewer.js';
export async function runReview(args) {
    try {
        const options = {
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
    }
    catch (error) {
        console.error('❌ Review failed:', error.message);
        process.exit(1);
    }
}
