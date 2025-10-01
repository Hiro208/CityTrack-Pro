import { Router } from 'express';
import { AlertController } from '../controllers/alertController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', AlertController.list);
router.get('/notifications/me', requireAuth, AlertController.myNotifications);

export default router;
