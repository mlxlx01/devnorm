import type { CliOptions } from '../types.js';

const DEFAULT_API_URL = 'https://api.minimaxi.com/anthropic/v1/messages';
const DEFAULT_MODEL = 'M2.7-highspeed';

export async function chat(
  messages: Array<{ role: string; content: string }>,
  options: CliOptions
): Promise<string> {
  const apiKey = options.apiKey || process.env.MINIMAX_API_KEY;
  const apiUrl = options.apiUrl || process.env.MINIMAX_API_URL || DEFAULT_API_URL;
  const model = options.model || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY not set. Run `devnorm init` or set MINIMAX_API_KEY env var.');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MiniMax API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  return data.content?.[0]?.text ?? '';
}
