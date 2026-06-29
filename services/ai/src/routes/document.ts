import { Router } from 'express';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { requireAuth } from '../middleware/requireAuth';

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

  improve: (_content, selection, _title) =>
    `Rewrite the following text to be clearer, more professional, and better structured.
Return ONLY the improved text. No explanation, no preamble.

TEXT:
${selection}`,

  fix_grammar: (_content, selection, _title) =>
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

  make_shorter: (_content, selection, _title) =>
    `Make the following text shorter and more concise while preserving the key information.
Return ONLY the shortened text.

TEXT:
${selection}`,

  make_longer: (_content, selection, _title) =>
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

  // Actions that need a selection but none provided
  const needsSelection = ['improve', 'fix_grammar', 'make_shorter', 'make_longer'];
  if (needsSelection.includes(action) && !selection.trim()) {
    return res.status(400).json({ error: 'Please select some text first' });
  }

  const prompt = PROMPTS[action](
    content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    selection.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    title,
  );

  try {
    const { text } = await generateText({
      model:       google('gemini-1.5-flash'),
      prompt,
      maxTokens:   800,
      temperature: 0.4,
    });
    return res.json({ result: text.trim(), action });
  } catch (err) {
    console.error('[ai/document] Gemini error:', (err as Error).message);
    return res.status(500).json({ error: 'AI request failed — check GEMINI_API_KEY' });
  }
});

export default router;
