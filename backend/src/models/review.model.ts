import { pool } from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Review {
  id: number;
  accommodation_id: number;
  user_id: number | null;
  user_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewCreate {
  accommodation_id: number;
  user_id?: number;
  rating: number;
  comment?: string;
}

export const getReviewsByAccommodationId = async (accommodationId: number): Promise<Review[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*, u.name as user_name 
     FROM accommodation_reviews r 
     LEFT JOIN users u ON r.user_id = u.id 
     WHERE r.accommodation_id = ? 
     ORDER BY r.created_at DESC`,
    [accommodationId]
  );
  return rows as Review[];
};

export const createReview = async (data: ReviewCreate): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO accommodation_reviews (accommodation_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)`,
    [
      data.accommodation_id,
      data.user_id || null,
      data.rating,
      data.comment || null
    ]
  );
  return result.insertId;
};

export const hasUserReviewed = async (accommodationId: number, userId: number): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM accommodation_reviews WHERE accommodation_id = ? AND user_id = ? LIMIT 1',
    [accommodationId, userId]
  );
  return rows.length > 0;
};

export const getAverageRating = async (accommodationId: number): Promise<{ average: number, count: number }> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT AVG(rating) as average, COUNT(*) as count 
     FROM accommodation_reviews 
     WHERE accommodation_id = ?`,
    [accommodationId]
  );
  
  const average = rows[0]?.average ? parseFloat(Number(rows[0].average).toFixed(1)) : 0;
  return {
    average,
    count: rows[0]?.count || 0
  };
};
