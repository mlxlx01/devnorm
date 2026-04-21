import * as fs from 'fs';
import * as path from 'path';
import { chat } from '../api/minimax.js';
const AGENT_PROMPT = `You are a reviewer focused on bugs and maintenance debt, not style. Linters handle style. You find things that will break in production or cost future hours.

## Confidence Gating — Report Threshold

Every finding requires:
1. Severity: Blocker / Major / Minor
2. Confidence: 1-10. 10 = you can describe the input that triggers it. 5 = "this smells wrong." <6 = drop it.
3. Concrete failure: "When <input/state>, this <observable result>." No failure sentence, no finding.
4. Fix: code or one-line directive.

Report only Confidence >= 8. Confidence 6-7 collapses into a single "Worth a second look" bulleted list. Below 6: silent drop. If the diff is clean at this bar, say so — one sentence.

## Core Checks — Always Run

- **Off-by-one.** Inclusive/exclusive range confusion, fence-post errors.
- **Null/undefined.** Property access on values that can be null along the traced path.
- **Logic.** Inverted conditions, mutation of shared references returned from functions.
- **Error handling.** Swallowed errors in paths that need to surface them. Try/catch too broad.
- **Race conditions.** Check-then-act on shared state across await.
- **Complexity.** A function crossed ~50 lines AND has >3 responsibilities.

## Stack Detection

Detect: TypeScript strict mode, React (.tsx files), Node.js (package.json).

## Output Format

## Stack detected
<stack>

## Findings (Confidence >= 8)
<findings>

## Worth a second look
<items>

## Summary
<one sentence>
`;
function findFiles(dir, extensions) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build')
                continue;
            files.push(...findFiles(full, extensions));
        }
        else if (extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(full);
        }
    }
    return files;
}
function detectStack(files) {
    // files = absolute paths
    const hasTsConfig = files.some(f => f.endsWith('tsconfig.json'));
    const hasReact = files.some(f => f.endsWith('.tsx') || fs.readFileSync(f, 'utf-8').includes("from 'react'"));
    const hasPackage = files.some(f => f.endsWith('package.json'));
    const stack = [];
    if (hasTsConfig)
        stack.push('TypeScript (strict)');
    if (hasReact)
        stack.push('React');
    if (hasPackage)
        stack.push('Node.js');
    return stack.length > 0 ? stack.join(', ') : 'Unknown stack';
}
function buildReviewPrompt(stack, files) {
    const fileSection = files.map(f => `\`\`\`${f.path}\n${f.content}\n\`\`\``).join('\n\n');
    return `${AGENT_PROMPT}\n\n## Stack detected\n${stack}\n\n## Files to review\n\n${fileSection}\n\n## Your review:\n`;
}
function parseReviewOutput(output) {
    const result = {
        stackDetected: '',
        findings: [],
        worthSecondLook: [],
        summary: '',
    };
    const stackMatch = output.match(/## Stack detected\n([^\n]+)/);
    if (stackMatch)
        result.stackDetected = stackMatch[1].trim();
    const findingsMatch = output.match(/## Findings \(Confidence >= 8\)([\s\S]*?)(?=## Worth a second look|$)/);
    if (findingsMatch) {
        const findingsText = findingsMatch[1];
        const findingBlocks = findingsText.split(/### \d+\./).filter(Boolean);
        for (const block of findingBlocks) {
            const lines = block.trim().split('\n');
            if (lines.length === 0)
                continue;
            const titleMatch = lines[0].match(/\[(Blocker|Major|Minor)\] (.+)/);
            if (!titleMatch)
                continue;
            const finding = {
                severity: titleMatch[1],
                title: titleMatch[2],
                file: '',
                confidence: 8,
                failure: '',
                fix: '',
            };
            for (const line of lines) {
                if (line.startsWith('- File:'))
                    finding.file = line.replace('- File:', '').trim();
                if (line.startsWith('- Confidence:'))
                    finding.confidence = parseInt(line.replace('- Confidence:', '').trim());
                if (line.startsWith('- Failure:'))
                    finding.failure = line.replace('- Failure:', '').trim();
                if (line.startsWith('- Fix:'))
                    finding.fix = line.replace('- Fix:', '').trim();
            }
            if (finding.file && finding.failure)
                result.findings.push(finding);
        }
    }
    const worthMatch = output.match(/## Worth a second look\n([\s\S]*?)(?=## Summary|$)/);
    if (worthMatch) {
        const items = worthMatch[1].split('\n').filter(l => l.includes('-'));
        result.worthSecondLook = items.map(l => l.replace('-', '').trim());
    }
    const summaryMatch = output.match(/## Summary\n(.+)/);
    if (summaryMatch)
        result.summary = summaryMatch[1].trim();
    return result;
}
export async function review(options) {
    const targetPath = path.resolve(options.path);
    if (!fs.existsSync(targetPath)) {
        throw new Error(`Path does not exist: ${targetPath}`);
    }
    const isDir = fs.statSync(targetPath).isDirectory();
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'];
    let files = [];
    if (isDir) {
        files = findFiles(targetPath, extensions);
    }
    else {
        files = [targetPath];
    }
    // Limit to 10 files for now to keep token usage manageable
    files = files.slice(0, 10);
    console.log(`📂 Found ${files.length} files to review`);
    const fileContents = files.map(f => {
        return {
            path: path.relative(targetPath, f).replace(/\\/g, '/'),
            content: fs.readFileSync(f, 'utf-8'),
        };
    });
    const stack = detectStack(files); // Use absolute paths
    console.log(`🔍 Stack detected: ${stack}`);
    const prompt = buildReviewPrompt(stack, fileContents);
    const messages = [
        { role: 'user', content: prompt },
    ];
    console.log('🤖 Sending to MiniMax API...');
    let output;
    try {
        output = await chat(messages, options);
    }
    catch (e) {
        console.error('Error during chat:', e);
        throw e;
    }
    return parseReviewOutput(output);
}
export function printReviewResult(result) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REVIEW RESULTS');
    console.log('='.repeat(60));
    if (result.findings.length > 0) {
        console.log(`\n🚨 ${result.findings.length} findings (Confidence >= 8):\n`);
        for (const f of result.findings) {
            console.log(`  [${f.severity}] ${f.title}`);
            console.log(`    File: ${f.file}`);
            console.log(`    Confidence: ${f.confidence}/10`);
            console.log(`    Problem: ${f.failure}`);
            console.log(`    Fix: ${f.fix}`);
            console.log();
        }
    }
    else {
        console.log('\n✅ No high-confidence findings.');
    }
    if (result.worthSecondLook.length > 0) {
        console.log(`\n👀 Worth a second look (Confidence 6-7):`);
        for (const item of result.worthSecondLook) {
            console.log(`  - ${item}`);
        }
    }
    console.log(`\n📝 Summary: ${result.summary}`);
    console.log('='.repeat(60));
}
