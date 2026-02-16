// Routes placeholder for evaluations (Express-style)
import { Router } from 'express';

const router = Router();
router.post('/evaluations', (req, res) => res.send({ ok: true }));

export default router;
