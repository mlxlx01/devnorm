import crypto from 'crypto';
import { review } from '../src/agents/code-reviewer.js';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

export async function handlePullRequest(payload, githubToken) {
  const { action, pull_request, repository } = payload;

  if (!['opened', 'synchronize'].includes(action)) {
    return { status: 'skipped', reason: `Action ${action} not relevant` };
  }

  const prNumber = pull_request.number;
  const repoFullName = repository.full_name;
  const prTitle = pull_request.title;
  const prBody = pull_request.body || '';
  const commitsUrl = pull_request.commits_url;

  // Get the diff
  const diffResponse = await fetch(pull_request.diff_url, {
    headers: { Authorization: `token ${githubToken}` }
  });
  const diff = await diffResponse.text();

  if (!diff || diff.length < 50) {
    return { status: 'skipped', reason: 'Empty diff' };
  }

  console.log(`[DevNorm] Reviewing PR #${prNumber} in ${repoFullName}`);

  // Run the review
  const reviewResult = await review({
    path: '.',
    apiKey: MINIMAX_API_KEY,
  });

  // Post review as PR comment
  const comment = buildReviewComment(reviewResult);
  await postPRComment(repoFullName, prNumber, comment, githubToken);

  // If blockers found, request changes
  if (reviewResult.findings.some(f => f.severity === 'Blocker')) {
    return {
      status: 'changes_requested',
      blockers: reviewResult.findings.filter(f => f.severity === 'Blocker').length
    };
  }

  return { status: 'approved' };
}

function buildReviewComment(result) {
  let comment = `## DevNorm Review\n\n`;

  if (result.findings.length === 0) {
    comment += `✅ **No high-confidence issues found.**\n\n${result.summary}\n`;
    return comment;
  }

  const blockers = result.findings.filter(f => f.severity === 'Blocker');
  const majors = result.findings.filter(f => f.severity === 'Major');
  const minors = result.findings.filter(f => f.severity === 'Minor');

  if (blockers.length > 0) {
    comment += `🚨 **${blockers.length} Blocker(s):**\n`;
    blockers.forEach((f, i) => {
      comment += `${i + 1}. [${f.title}](${f.file}${f.line ? `#L${f.line}` : ''})\n`;
      comment += `   - ${f.failure}\n`;
      comment += `   - Fix: ${f.fix}\n\n`;
    });
  }

  if (majors.length > 0) {
    comment += `⚠️ **${majors.length} Major(s):**\n`;
    majors.forEach((f, i) => {
      comment += `${i + 1}. [${f.title}](${f.file}${f.line ? `#L${f.line}` : ''})\n`;
      comment += `   - ${f.failure}\n`;
      comment += `   - Fix: ${f.fix}\n\n`;
    });
  }

  if (minors.length > 0) {
    comment += `💡 **${minors.length} Minor(s):**\n`;
    minors.forEach((f, i) => {
      comment += `${i + 1}. [${f.title}](${f.file}${f.line ? `#L${f.line}` : ''})\n`;
      comment += `   - ${f.failure}\n\n`;
    });
  }

  comment += `---\n*🤖 DevNorm · AI-powered code review*\n`;

  return comment;
}

async function postPRComment(repo, prNumber, body, token) {
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({ body })
  });
}

export function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
