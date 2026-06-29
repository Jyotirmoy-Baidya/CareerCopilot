import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { openRouterText } from '../lib/openrouter';

const router = Router();

const schema = z.object({
  resumeText: z.string().min(50).max(10000),
  targetRole: z.string().max(100),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const { resumeText, targetRole } = parsed.data;

  try {
    const text = await openRouterText(
      `You are a senior tech recruiter. Review this resume for a candidate targeting "${targetRole}".
Resume:
${resumeText}

Return ONLY valid JSON with no markdown or explanation:
{
  "overallScore": 72,
  "strengths": ["..."],
  "gaps": ["..."],
  "suggestions": ["..."],
  "skillsFound": ["..."],
  "skillsMissing": ["..."]
}`,
    );

    const jsonMatch = text.match(/\{[\s\S]+\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    return res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('[resume] OpenRouter error:', (err as Error).message);
    return res.status(500).json({ error: 'Resume review failed' });
  }
});

export default router;
