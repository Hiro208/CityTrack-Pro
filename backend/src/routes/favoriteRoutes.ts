import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);
router.get('/', FavoriteController.getAll);
router.post('/routes', FavoriteController.addRoute);
router.delete('/routes/:routeId', FavoriteController.removeRoute);
router.post('/stops', FavoriteController.addStop);
router.delete('/stops/:stopId', FavoriteController.removeStop);

export default router;
