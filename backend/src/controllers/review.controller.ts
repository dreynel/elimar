import { Request, Response } from 'express';
import { getReviewsByAccommodationId, createReview, getAverageRating, hasUserReviewed } from '../models/review.model.js';

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const accommodationId = parseInt(req.params.accommodationId);
    if (isNaN(accommodationId)) {
      res.status(400).json({ success: false, message: 'Invalid accommodation ID' });
      return;
    }

    const reviews = await getReviewsByAccommodationId(accommodationId);
    const stats = await getAverageRating(accommodationId);

    res.json({
      success: true,
      data: {
        reviews: reviews,
        average: stats.average,
        total: stats.count
      }
    });
  } catch (error) {
    console.error('Error in getReviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const accommodationId = parseInt(req.params.accommodationId);
    const { rating, comment, user_id } = req.body;

    if (!user_id) {
      res.status(401).json({ success: false, message: 'You must be logged in to leave a review.' });
      return;
    }

    if (isNaN(accommodationId) || rating === undefined || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Invalid payload: rating must be between 1 and 5' });
      return;
    }

    const alreadyReviewed = await hasUserReviewed(accommodationId, user_id);
    if (alreadyReviewed) {
      res.status(400).json({ success: false, message: 'You have already reviewed this accommodation.' });
      return;
    }

    const newId = await createReview({
      accommodation_id: accommodationId,
      rating: Number(rating),
      comment: comment?.trim() || null,
      user_id: user_id
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { id: newId }
    });
  } catch (error) {
    console.error('Error in addReview:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
