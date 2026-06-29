import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  res.clearCookie('refreshToken');
  return res.json({ message: 'Logged out' });
});

export default router;
