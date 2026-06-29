import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { openRouterText, OpenRouterError } from '../lib/openrouter';

const schema = z.object({
  action:    z.enum(['summarise', 'improve', 'fix_grammar', 'continue', 'make_shorter', 'make_longer']),
  content:   z.string().max(20000),
  selection: z.string().max(5000).optional(),
  title:     z.string().max(500).optional(),
});

const PROMPTS: Record<string, (content: string, selection: string, title: string) => string> = {
  summarise: (content, _sel, title) =>
    `You are a study assistant. Summarise the following note titled "${title}" in 3-5 concise bullet points.
Return ONLY the bullet points, no preamble.

NOTE CONTENT:
${content}`,

  improve: (_content, selection) =>
    `Rewrite the following text to be clearer, more professional, and better structured.
Return ONLY the improved text. No explanation, no preamble.

TEXT:
${selection}`,

  fix_grammar: (_content, selection) =>
    `Fix all grammar, spelling, and punctuation errors in the following text.
Return ONLY the corrected text. Do not change the meaning or style.

TEXT:
${selection}`,

  continue: (content, _sel, title) =>
    `You are helping write a study note titled "${title}".
Continue writing naturally from where the note ends. Write 2-4 sentences that fit the existing style and topic.
Return ONLY the continuation text, no preamble.

NOTE SO FAR:
${content}`,

  make_shorter: (_content, selection) =>
    `Make the following text shorter and more concise while preserving the key information.
Return ONLY the shortened text.

TEXT:
${selection}`,

  make_longer: (_content, selection) =>
    `Expand the following text with more detail and explanation while keeping the same meaning and tone.
Return ONLY the expanded text.

TEXT:
${selection}`,
};

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const { action, content, selection = '', title = 'Untitled' } = parsed.data;

  const needsSelection = ['improve', 'fix_grammar', 'make_shorter', 'make_longer'];
  if (needsSelection.includes(action) && !selection.trim()) {
    return res.status(400).json({ error: 'Please select some text first' });
  }

  const strip = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const prompt = PROMPTS[action](strip(content), strip(selection), title);

  try {
    const text = await openRouterText(prompt, { maxTokens: 800, temperature: 0.4 });
    return res.json({ result: text, action });
  } catch (err) {
    if (err instanceof OpenRouterError && err.status === 402) {
      return res.status(402).json({ error: 'out_of_credits', message: 'AI credits exhausted. Please contact support.' });
    }
    console.error('[ai/document] OpenRouter error:', (err as Error).message);
    return res.status(500).json({ error: 'AI request failed' });
  }
});

export default router;
