import crypto from 'crypto';
import { review } from '../dist/agents/code-reviewer.js';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

export async function handlePullRequest(payload, githubToken) {
  const { action, pull_request, repository } = payload;

  if (!['opened', 'synchronize'].includes(action)) {
    return { status: 'skipped', reason: `Action ${action} not relevant` };
  }

  const prNumber = pull_request.number;
  const repoFullName = repository.full_name;
  const diffUrl = pull_request.diff_url;

  console.log(`[DevNorm] Reviewing PR #${prNumber} in ${repoFullName}`);

  // Get the diff from GitHub
  let diff = '';
  try {
    const diffResponse = await fetch(diffUrl, {
      headers: { Authorization: `token ${githubToken}` }
    });
    if (diffResponse.ok) {
      diff = await diffResponse.text();
    }
  } catch (e) {
    console.error('[DevNorm] Failed to fetch diff:', e.message);
  }

  if (!diff || diff.length < 50) {
    console.log('[DevNorm] Empty or small diff, using PR info only');
    diff = `PR #${prNumber}: ${pull_request.title || 'No title'}\n\n${pull_request.body || 'No description'}`;
  }

  // Run the review on the diff
  const reviewResult = await review({
    path: '.',
    diff: diff,
    apiKey: MINIMAX_API_KEY,
  });

  // Post review as PR comment
  const comment = buildReviewComment(reviewResult, prNumber);
  await postPRComment(repoFullName, prNumber, comment, githubToken);

  if (reviewResult.findings.some(f => f.severity === 'Blocker')) {
    return { status: 'changes_requested', blockers: reviewResult.findings.filter(f => f.severity === 'Blocker').length };
  }

  return { status: 'approved' };
}

function buildReviewComment(result, prNumber) {
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
      comment += `${i+1}. [${f.title}](${f.file}${f.line ? '#L'+f.line : ''})\n   - ${f.failure}\n   - Fix: ${f.fix}\n\n`;
    });
  }
  if (majors.length > 0) {
    comment += `⚠️ **${majors.length} Major(s):**\n`;
    majors.forEach((f, i) => {
      comment += `${i+1}. [${f.title}](${f.file}${f.line ? '#L'+f.line : ''})\n   - ${f.failure}\n   - Fix: ${f.fix}\n\n`;
    });
  }
  if (minors.length > 0) {
    comment += `💡 **${minors.length} Minor(s):**\n`;
    minors.forEach((f, i) => {
      comment += `${i+1}. [${f.title}](${f.file}${f.line ? '#L'+f.line : ''})\n   - ${f.failure}\n\n`;
    });
  }
  comment += `---\n*🤖 DevNorm · AI-powered code review*\n`;
  return comment;
}

async function postPRComment(repo, prNumber, body, token) {
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
    body: JSON.stringify({ body })
  });
  if (!response.ok) {
    console.error(`[DevNorm] Failed to post comment: ${response.status} ${await response.text()}`);
  }
}

export function verifyWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    const sigBuf = Buffer.from(signature);
    const digBuf = Buffer.from(digest);
    if (sigBuf.length !== digBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, digBuf);
  } catch {
    return false;
  }
}
