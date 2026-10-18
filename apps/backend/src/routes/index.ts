import * as express from 'express';
import feedbackRouter from './feedback';
import healthRouter from './health';
import meRouter from './me';
import workoutsRouter from './workouts';

const router = express.Router();

router.use('/feedback', feedbackRouter);
router.use('/health', healthRouter);
router.use('/me', meRouter);
router.use('/workouts', workoutsRouter);

export default router;
