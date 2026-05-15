import { Router, Request, Response } from 'express';
import { validateWebhookPayload } from '../services/validator';
import { sendLeadToBitrix } from '../services/bitrix.service';

const router = Router();

router.post('/lead', async (req: Request, res: Response) => {
  const payload = req.body;
  const validation = validateWebhookPayload(payload);

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    await sendLeadToBitrix(payload);
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to sync lead:', error);
    return res.status(502).json({ error: 'bitrix_sync_failed' });
  }
});

export default router;
