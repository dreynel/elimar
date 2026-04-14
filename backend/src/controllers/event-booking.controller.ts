import { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { RowDataPacket } from 'mysql2';
import {
  getAllEventBookings,
  getEventBookingById,
  getEventBookingsByUserId,
  createEventBooking,
  updateEventBooking,
  checkEventBookingConflict,
} from '../models/event-booking.model.js';
import { findUserById } from '../models/user.model.js';
import { checkEventBookingAvailability } from '../services/availability.service.js';
import { sendCheckOutThankYouEmail, sendBookingNotificationEmail, sendAutoRejectionWithRefundEmail } from '../services/email.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getEventBookings = async (req: Request, res: Response) => {
  try {
    let bookings;

    if (req.user!.role === 'admin') {
      bookings = await getAllEventBookings();
    } else {
      bookings = await getEventBookingsByUserId(req.user!.id);
    }

    res.json(successResponse(bookings));
  } catch (error: any) {
    console.error('Get event bookings error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getEventBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await getEventBookingById(id);

    if (!booking) {
      return res.status(404).json(errorResponse('Event booking not found', 404));
    }

    // Users can only view their own bookings
    if (req.user!.role !== 'admin' && booking.user_id !== req.user!.id) {
      return res.status(403).json(errorResponse('Access denied', 403));
    }

    res.json(successResponse(booking));
  } catch (error: any) {
    console.error('Get event booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const addEventBooking = async (req: Request, res: Response) => {
  try {
    const {
      event_type,
      booking_date,
      event_details,
      total_price,
    } = req.body;

    // Get uploaded file path
    const file = req.file as Express.Multer.File | undefined;
    const proof_of_payment_url = file ? `/uploads/${file.filename}` : null;

    if (!event_type || !booking_date || !total_price) {
      return res.status(400).json(errorResponse('Missing required fields', 400));
    }

    if (!proof_of_payment_url) {
      return res.status(400).json(errorResponse('Proof of payment is required', 400));
    }

    // Check for conflicts using the comprehensive availability service
    const availabilityResult = await checkEventBookingAvailability(
      booking_date,
      event_type as 'whole_day' | 'morning' | 'evening'
    );
    
    if (!availabilityResult.available) {
      return res.status(409).json(
        errorResponse(
          availabilityResult.reason || 'This date and time slot is already booked', 
          409
        )
      );
    }

    const bookingId = await createEventBooking({
      user_id: req.user!.id,
      event_type,
      booking_date,
      event_details,
      total_price: parseFloat(total_price),
      proof_of_payment_url,
    });

    res.status(201).json(successResponse({ id: bookingId }, 'Event booking created successfully'));
  } catch (error: any) {
    console.error('Add event booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const modifyEventBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, event_details } = req.body;

    // Get uploaded file path if exists
    const file = req.file as Express.Multer.File | undefined;
    const proof_of_payment_url = file ? `/uploads/${file.filename}` : undefined;

    const booking = await getEventBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Event booking not found', 404));
    }

    // Only admin can change status
    if (status && req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can change booking status', 403));
    }

    if (req.user!.role !== 'admin' && booking.user_id !== req.user!.id) {
      return res.status(403).json(errorResponse('Access denied', 403));
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (proof_of_payment_url) updateData.proof_of_payment_url = proof_of_payment_url;
    if (event_details !== undefined) updateData.event_details = event_details;

    const success = await updateEventBooking(id, updateData);

    if (!success) {
      return res.status(400).json(errorResponse('Update failed', 400));
    }

    res.json(successResponse(null, 'Event booking updated successfully'));
  } catch (error: any) {
    console.error('Update event booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const cancelEventBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await getEventBookingById(id);

    if (!booking) {
      return res.status(404).json(errorResponse('Event booking not found', 404));
    }

    if (req.user!.role !== 'admin' && booking.user_id !== req.user!.id) {
      return res.status(403).json(errorResponse('Access denied', 403));
    }

    const success = await updateEventBooking(id, { status: 'cancelled' });

    if (!success) {
      return res.status(400).json(errorResponse('Cancellation failed', 400));
    }

    res.json(successResponse(null, 'Event booking cancelled successfully'));
  } catch (error: any) {
    console.error('Cancel event booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const approveEventBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Only admin can approve
    if (req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can approve bookings', 403));
    }

    const booking = await getEventBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Event booking not found', 404));
    }

    if (booking.status !== 'pending') {
      return res.status(400).json(errorResponse('Only pending bookings can be approved', 400));
    }

    // Check for conflicts using the comprehensive availability service
    const availabilityResult = await checkEventBookingAvailability(
      booking.booking_date.toString().split('T')[0],
      booking.event_type as 'whole_day' | 'morning' | 'evening'
    );
    
    if (!availabilityResult.available) {
      return res.status(409).json(
        errorResponse(
          availabilityResult.reason || 'This date and time slot is already booked', 
          409
        )
      );
    }

    const success = await updateEventBooking(id, { status: 'approved' });

    if (!success) {
      return res.status(400).json(errorResponse('Approval failed', 400));
    }

    // Auto-reject conflicting pending event bookings with same date and time slot
    // For event bookings: morning conflicts with morning, evening conflicts with evening, whole_day conflicts with all
    const eventType = booking.event_type;
    const bookingDate = booking.booking_date.toString().split('T')[0];
    
    let conflictQuery = `
      SELECT eb.*, u.name as user_name, u.email as user_email
      FROM event_bookings eb
      LEFT JOIN users u ON eb.user_id = u.id
      WHERE eb.booking_date = ?
      AND eb.status = 'pending'
      AND eb.id != ?
    `;

    // Determine which event types to reject based on the approved booking type
    if (eventType === 'whole_day') {
      // Whole day booking conflicts with all time slots
      conflictQuery += ` AND eb.event_type IN ('morning', 'evening', 'whole_day')`;
    } else {
      // Morning/evening only conflicts with same time slot or whole_day
      conflictQuery += ` AND (eb.event_type = ? OR eb.event_type = 'whole_day')`;
    }

    const queryParams = eventType === 'whole_day' 
      ? [bookingDate, id]
      : [bookingDate, id, eventType];

    const conflictingBookings = await pool.query<RowDataPacket[]>(conflictQuery, queryParams);
    const conflicting = conflictingBookings[0] as RowDataPacket[];
    let rejectedCount = 0;

    // Auto-reject each conflicting event booking and send refund notification
    for (const conflictBooking of conflicting) {
      await updateEventBooking(conflictBooking.id, { status: 'rejected' });
      rejectedCount++;

      // Send auto-rejection email with refund notice
      if (conflictBooking.user_email) {
        const eventTypeLabels: Record<string, string> = {
          morning: 'Morning Event',
          evening: 'Evening Event',
          whole_day: 'Whole Day Event'
        };

        await sendAutoRejectionWithRefundEmail({
          to: conflictBooking.user_email,
          clientName: conflictBooking.user_name || 'Valued Customer',
          bookingId: conflictBooking.id,
          accommodation: `Event: ${conflictBooking.event_type.replace('_', ' ').toUpperCase()}`,
          checkIn: bookingDate,
          timeSlot: eventTypeLabels[conflictBooking.event_type] || conflictBooking.event_type,
        });
      }
    }

    // Send approval notification email
    const user = await findUserById(booking.user_id);
    if (user) {
      await sendBookingNotificationEmail({
        to: user.email,
        clientName: user.name,
        status: 'approved',
        bookingId: id,
        accommodation: `Event: ${booking.event_type.replace('_', ' ').toUpperCase()}`,
        checkIn: bookingDate,
      });
    }

    const message = rejectedCount > 0 
      ? `Event booking approved successfully. ${rejectedCount} conflicting request(s) were automatically rejected.`
      : 'Event booking approved successfully';

    res.json(successResponse({ rejectedCount }, message));
  } catch (error: any) {
    console.error('Approve event booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const rejectEventBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Only admin can reject
    if (req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can reject bookings', 403));
    }

    const booking = await getEventBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Event booking not found', 404));
    }

    const success = await updateEventBooking(id, { status: 'rejected' });

    if (!success) {
      return res.status(400).json(errorResponse('Rejection failed', 400));
    }

    // Send rejection notification email
    const user = await findUserById(booking.user_id);
    if (user) {
      await sendBookingNotificationEmail({
        to: user.email,
        clientName: user.name,
        status: 'rejected',
        bookingId: id,
        accommodation: `Event: ${booking.event_type.replace('_', ' ').toUpperCase()}`,
        checkIn: booking.booking_date.toString().split('T')[0],
      });
    }

    res.json(successResponse(null, 'Event booking rejected successfully'));
  } catch (error: any) {
    console.error('Reject event booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const checkOutEventBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Only admin can check out
    if (req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can check out bookings', 403));
    }

    const booking = await getEventBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Event booking not found', 404));
    }

    if (booking.status !== 'approved') {
      return res.status(400).json(errorResponse('Only approved bookings can be checked out', 400));
    }

    // Update status to completed and set checked_out_at timestamp
    const [result] = await pool.query(
      'UPDATE event_bookings SET status = ?, checked_out_at = NOW() WHERE id = ?',
      ['completed', id]
    );

    // Get updated booking details
    const updatedBooking = await getEventBookingById(id);
    
    // Send thank you email
    const user = await findUserById(booking.user_id);
    if (user && updatedBooking) {
      await sendCheckOutThankYouEmail({
        clientEmail: user.email,
        clientName: user.name,
        bookingDetails: {
          accommodationName: `Event: ${updatedBooking.event_type.replace('_', ' ').toUpperCase()}`,
          checkInDate: updatedBooking.booking_date instanceof Date ? updatedBooking.booking_date.toISOString().split('T')[0] : String(updatedBooking.booking_date),
          amountPaid: updatedBooking.total_price,
        },
      });
    }

    res.json(successResponse(null, 'Event booking checked out successfully'));
  } catch (error: any) {
    console.error('Check out event booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

// Delete event booking (admin only)
export const deleteEventBookingById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can delete bookings', 403));
    }

    const booking = await getEventBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Event booking not found', 404));
    }

    // Only allow deletion of cancelled/rejected bookings
    if (booking.status !== 'cancelled' && booking.status !== 'rejected') {
      return res.status(400).json(errorResponse('Only cancelled or rejected bookings can be deleted', 400));
    }

    const [result] = await pool.query('DELETE FROM event_bookings WHERE id = ?', [id]);

    res.json(successResponse(null, 'Event booking deleted successfully'));
  } catch (error: any) {
    console.error('Delete event booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};
