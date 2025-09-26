import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';

const router = Router();

router.get('/', VehicleController.getAllVehicles);

export default router;