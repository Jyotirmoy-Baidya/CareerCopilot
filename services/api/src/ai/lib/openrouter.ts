const URL = 'https://openrouter.ai/api/v1/chat/completions';

function headers() {
  return {
    Authorization:   `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer':  process.env.WEB_URL ?? 'http://localhost:3000',
    'X-Title':       'CareerCopilot',
    'Content-Type':  'application/json',
  };
}

/** Single non-streaming call — returns the text content */
export async function openRouterText(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model:       'openai/gpt-4o',
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  options.maxTokens  ?? 800,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

/** Multi-turn chat with system prompt — returns the text content */
export async function openRouterChat(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model:    'openai/gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

/** Streaming chat — pipes SSE chunks to an Express response */
export async function openRouterStream(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  write: (chunk: string) => void,
): Promise<void> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model:    'openai/gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream:   true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`OpenRouter stream ${res.status}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const raw   = decoder.decode(value);
    const lines = raw.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      const payload = line.slice(6);
      if (payload === '[DONE]') return;
      try {
        const parsed  = JSON.parse(payload);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) write(content);
      } catch {}
    }
  }
}
