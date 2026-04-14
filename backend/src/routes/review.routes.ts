import { Router } from 'express';
import { getReviews, addReview } from '../controllers/review.controller.js';

const router = Router();

router.get('/:accommodationId', getReviews);
router.post('/:accommodationId', addReview);

export default router;
