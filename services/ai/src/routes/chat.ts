import { Router } from 'express';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const schema = z.object({
  messages: z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string().max(4000),
  })).max(20),
  context: z.object({
    currentSkill: z.string().optional(),
    targetRole:   z.string().optional(),
    progressPct:  z.number().optional(),
  }).optional(),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const { messages, context } = parsed.data;

  const systemPrompt = [
    'You are a friendly, knowledgeable career mentor for software developers.',
    'You help learners in India build practical skills and get jobs.',
    'Keep your answers clear, practical, and encouraging.',
    context?.targetRole    ? `The learner is targeting: ${context.targetRole}.`    : '',
    context?.currentSkill  ? `They are currently learning: ${context.currentSkill}.` : '',
    context?.progressPct   ? `They are ${context.progressPct}% through their roadmap.` : '',
    'Never give vague answers. Give specific, actionable advice.',
  ].filter(Boolean).join(' ');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const result = await streamText({
      model:    google('gemini-1.5-flash'),
      system:   systemPrompt,
      messages: messages as any,
    });

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`);
    res.end();
  }
});

export default router;
