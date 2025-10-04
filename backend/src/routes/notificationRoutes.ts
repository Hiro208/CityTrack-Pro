import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { NotificationController } from '../controllers/notificationController';

const router = Router();

router.use(requireAuth);
router.get('/', NotificationController.list);
router.patch('/:id/read', NotificationController.markRead);
router.patch('/read-all', NotificationController.markAllRead);
router.get('/push-config', NotificationController.getPushConfig);
router.post('/push-subscriptions', NotificationController.subscribePush);
router.delete('/push-subscriptions', NotificationController.unsubscribePush);
router.get('/settings', NotificationController.getSettings);
router.patch('/settings', NotificationController.updateSettings);

export default router;
