import { pool } from '../config/db.js';
import { EventBooking, EventBookingCreate, EventBookingUpdate } from '../types/event-booking.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getAllEventBookings = async (): Promise<EventBooking[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      eb.*,
      u.name as user_name,
      u.email as user_email,
      u.contact_number as user_contact
    FROM event_bookings eb
    LEFT JOIN users u ON eb.user_id = u.id
    ORDER BY eb.created_at DESC`
  );
  return rows as EventBooking[];
};

export const getEventBookingById = async (id: number): Promise<EventBooking | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      eb.*,
      u.name as user_name,
      u.email as user_email,
      u.contact_number as user_contact
    FROM event_bookings eb
    LEFT JOIN users u ON eb.user_id = u.id
    WHERE eb.id = ?`,
    [id]
  );
  return rows.length > 0 ? (rows[0] as EventBooking) : null;
};

export const getEventBookingsByUserId = async (userId: number): Promise<EventBooking[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      eb.*,
      u.name as user_name,
      u.email as user_email,
      u.contact_number as user_contact
    FROM event_bookings eb
    LEFT JOIN users u ON eb.user_id = u.id
    WHERE eb.user_id = ? 
    ORDER BY eb.created_at DESC`,
    [userId]
  );
  return rows as EventBooking[];
};

export const checkEventBookingConflict = async (bookingDate: string, eventType: string): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM event_bookings 
     WHERE booking_date = ? 
     AND event_type = ? 
     AND status IN ('pending', 'approved')`,
    [bookingDate, eventType]
  );
  return rows.length > 0;
};

export const createEventBooking = async (data: EventBookingCreate): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO event_bookings (
      user_id, event_type, booking_date, event_details, 
      total_price, proof_of_payment_url, guest_names
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id,
      data.event_type,
      data.booking_date,
      data.event_details || null,
      data.total_price,
      data.proof_of_payment_url || null,
      data.guest_names || null,
    ]
  );
  return result.insertId;
};

export const updateEventBooking = async (id: number, data: EventBookingUpdate): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return false;

  values.push(id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE event_bookings SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteEventBooking = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM event_bookings WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};
