import { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { RowDataPacket } from 'mysql2';
import {
  getAllBookings,
  getBookingById,
  getBookingsByUserId,
  createBooking,
  updateBooking,
  checkAccommodationAvailability,
} from '../models/booking.model.js';
import { getAccommodationById, updateAccommodationStatus } from '../models/accommodation.model.js';
import { findUserById } from '../models/user.model.js';
import { sendBookingConfirmation, sendBookingNotificationEmail, sendCheckOutThankYouEmail, sendAutoRejectionWithRefundEmail } from '../services/email.service.js';
import { checkRegularBookingAvailability, TimeSlotType, TIME_SLOTS } from '../services/availability.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getBookings = async (req: Request, res: Response) => {
  try {
    let bookings;

    if (req.user!.role === 'admin') {
      bookings = await getAllBookings();
    } else {
      bookings = await getBookingsByUserId(req.user!.id);
    }

    res.json(successResponse(bookings));
  } catch (error: any) {
    console.error('Get bookings error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', 404));
    }

    // Users can only view their own bookings
    if (req.user!.role !== 'admin' && booking.user_id !== req.user!.id) {
      return res.status(403).json(errorResponse('Access denied', 403));
    }

    res.json(successResponse(booking));
  } catch (error: any) {
    console.error('Get booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const addBooking = async (req: Request, res: Response) => {
  try {
    const {
      accommodation_id,
      check_in_date,
      time_slot,
      booking_time, // Legacy support
      check_out_date,
      adults,
      kids,
      pwd,
      senior,
      adult_swimming,
      kid_swimming,
      pwd_swimming,
      senior_swimming,
      overnight_stay,
      overnight_swimming,
      total_price,
    } = req.body;

    // Get uploaded file path
    const file = req.file as Express.Multer.File | undefined;
    const proof_of_payment_url = file ? `/uploads/${file.filename}` : null;

    if (!accommodation_id || !check_in_date || !adults || !total_price) {
      return res.status(400).json(errorResponse('Missing required fields', 400));
    }

    if (!proof_of_payment_url) {
      return res.status(400).json(errorResponse('Proof of payment is required', 400));
    }

    // Determine time slot - use provided time_slot or derive from legacy booking_time
    const validSlots: TimeSlotType[] = ['morning', 'night', 'whole_day'];
    let selectedSlot: TimeSlotType = 'morning';
    
    if (time_slot && validSlots.includes(time_slot)) {
      selectedSlot = time_slot;
    } else if (booking_time) {
      // Legacy: Convert booking_time to time_slot
      const hour = parseInt(booking_time.split(':')[0]);
      if (hour >= 17) {
        selectedSlot = 'night';
      } else {
        selectedSlot = 'morning';
      }
    }
    
    // Override with whole_day for overnight stays on rooms
    if (overnight_stay === 'true' || overnight_stay === true) {
      selectedSlot = 'whole_day';
    }

    // Verify accommodation exists
    const accommodation = await getAccommodationById(accommodation_id);
    if (!accommodation) {
      return res.status(404).json(errorResponse('Accommodation not found', 404));
    }

    // Validate time slot based on accommodation type
    // Cottages: morning or night only
    // Rooms: morning, night, or whole_day
    if (accommodation.type === 'cottage' && selectedSlot === 'whole_day') {
      return res.status(400).json(
        errorResponse('Cottages cannot be booked for whole day. Please select morning or night slot.', 400)
      );
    }

    // Check availability considering event bookings (which have priority)
    const availabilityResult = await checkRegularBookingAvailability(
      accommodation_id,
      check_in_date,
      selectedSlot
    );

    if (!availabilityResult.available) {
      return res.status(409).json(
        errorResponse(
          availabilityResult.reason || 'This accommodation is not available for the selected time slot', 
          409
        )
      );
    }

    const bookingId = await createBooking({
      user_id: req.user!.id,
      accommodation_id,
      check_in_date,
      time_slot: selectedSlot,
      booking_time: booking_time || TIME_SLOTS[selectedSlot].start + ':00',
      check_out_date,
      adults: parseInt(adults) || 0,
      kids: parseInt(kids) || 0,
      pwd: parseInt(pwd) || 0,
      senior: parseInt(senior) || 0,
      adult_swimming: parseInt(adult_swimming) || 0,
      kid_swimming: parseInt(kid_swimming) || 0,
      pwd_swimming: parseInt(pwd_swimming) || 0,
      senior_swimming: parseInt(senior_swimming) || 0,
      overnight_stay: overnight_stay === 'true' || overnight_stay === true,
      overnight_swimming: overnight_swimming === 'true' || overnight_swimming === true,
      total_price: parseFloat(total_price),
      proof_of_payment_url,
    });

    // Update accommodation status to pending when booking is created
    await updateAccommodationStatus(accommodation_id, 'pending');

    // Send confirmation email
    const user = await findUserById(req.user!.id);
    if (user) {
      await sendBookingConfirmation({
        clientName: user.name,
        clientEmail: user.email,
        accommodationName: accommodation.name,
        checkInDate: check_in_date,
        checkOutDate: check_out_date,
        adults: parseInt(adults) || 0,
        kids: parseInt(kids) || 0,
        pwd: parseInt(pwd) || 0,
        totalAmount: parseFloat(total_price),
        bookingId,
      });
    }

    res.status(201).json(successResponse({ id: bookingId }, 'Booking created successfully'));
  } catch (error: any) {
    console.error('Add booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const modifyBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, guest_names } = req.body;

    // Get uploaded file path if exists
    const file = req.file as Express.Multer.File | undefined;
    const proof_of_payment_url = file ? `/uploads/${file.filename}` : undefined;

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', 404));
    }

    // Only admin can change status, users can update payment proof
    if (status && req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can change booking status', 403));
    }

    if (req.user!.role !== 'admin' && booking.user_id !== req.user!.id) {
      return res.status(403).json(errorResponse('Access denied', 403));
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (proof_of_payment_url) updateData.proof_of_payment_url = proof_of_payment_url;
    if (guest_names !== undefined) updateData.guest_names = guest_names;

    const success = await updateBooking(id, updateData);

    if (!success) {
      return res.status(400).json(errorResponse('Update failed', 400));
    }

    // Send notification email if status changed to approved/rejected
    if (status && (status === 'approved' || status === 'cancelled')) {
      const user = await findUserById(booking.user_id);
      const accommodation = await getAccommodationById(booking.accommodation_id);
      if (user && accommodation) {
        await sendBookingNotificationEmail({
          to: user.email,
          clientName: user.name,
          status: status === 'approved' ? 'approved' : 'rejected',
          bookingId: id,
          accommodation: accommodation.name,
          checkIn: booking.check_in_date,
          checkOut: booking.check_out_date || undefined,
        });
      }
    }

    res.json(successResponse(null, 'Booking updated successfully'));
  } catch (error: any) {
    console.error('Update booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', 404));
    }

    if (req.user!.role !== 'admin' && booking.user_id !== req.user!.id) {
      return res.status(403).json(errorResponse('Access denied', 403));
    }

    const success = await updateBooking(id, { status: 'cancelled' });

    if (!success) {
      return res.status(400).json(errorResponse('Cancellation failed', 400));
    }

    res.json(successResponse(null, 'Booking cancelled successfully'));
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

// Approve booking (admin only)
export const approveBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can approve bookings', 403));
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', 404));
    }

    if (booking.status === 'approved') {
      return res.status(400).json(errorResponse('Booking is already approved', 400));
    }

    // Check if accommodation is still available for the dates
    const isAvailable = await checkAccommodationAvailability(
      booking.accommodation_id,
      booking.check_in_date,
      booking.check_out_date || null,
      id // Exclude current booking from availability check
    );

    if (!isAvailable) {
      return res.status(409).json(
        errorResponse('This accommodation is already booked for the selected dates by another booking', 409)
      );
    }

    const success = await updateBooking(id, { status: 'approved' });

    if (!success) {
      return res.status(400).json(errorResponse('Approval failed', 400));
    }

    // Update accommodation status based on time slot
    const timeSlot = booking.time_slot || 'morning';
    let statusMap: { [key: string]: 'booked(morning)' | 'booked(night)' | 'booked(whole_day)' } = {
      'morning': 'booked(morning)',
      'night': 'booked(night)',
      'whole_day': 'booked(whole_day)'
    };
    await updateAccommodationStatus(booking.accommodation_id, statusMap[timeSlot]);

    // Auto-reject conflicting pending bookings with same accommodation, date, and time slot
    const conflictingBookings = await pool.query<RowDataPacket[]>(
      `SELECT b.*, u.name as user_name, u.email as user_email, a.name as accommodation_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN accommodations a ON b.accommodation_id = a.id
       WHERE b.accommodation_id = ?
       AND b.check_in_date = ?
       AND b.time_slot = ?
       AND b.status = 'pending'
       AND b.id != ?`,
      [booking.accommodation_id, booking.check_in_date, timeSlot, id]
    );

    const conflicting = conflictingBookings[0] as RowDataPacket[];
    let rejectedCount = 0;

    // Auto-reject each conflicting booking and send refund notification
    for (const conflictBooking of conflicting) {
      await updateBooking(Number(conflictBooking.id), { status: 'rejected' as any });
      rejectedCount++;

      // Send auto-rejection email with refund notice
      if (conflictBooking.user_email) {
        const timeSlotLabels: Record<string, string> = {
          morning: 'Morning (9 AM - 5 PM)',
          night: 'Night (5:30 PM - 8 AM)',
          whole_day: 'Whole Day (9 AM - 8 AM)'
        };

        await sendAutoRejectionWithRefundEmail({
          to: conflictBooking.user_email,
          clientName: conflictBooking.user_name || 'Valued Customer',
          bookingId: conflictBooking.id,
          accommodation: conflictBooking.accommodation_name || `Accommodation #${conflictBooking.accommodation_id}`,
          checkIn: conflictBooking.check_in_date,
          timeSlot: timeSlotLabels[conflictBooking.time_slot] || conflictBooking.time_slot,
        });
      }
    }

    // Send approval notification email
    const user = await findUserById(booking.user_id);
    const accommodation = await getAccommodationById(booking.accommodation_id);
    if (user && accommodation) {
      await sendBookingNotificationEmail({
        to: user.email,
        clientName: user.name,
        status: 'approved',
        bookingId: id,
        accommodation: accommodation.name,
        checkIn: booking.check_in_date,
        checkOut: booking.check_out_date || undefined,
      });
    }

    const message = rejectedCount > 0 
      ? `Booking approved successfully. ${rejectedCount} conflicting request(s) were automatically rejected.`
      : 'Booking approved successfully';

    res.json(successResponse({ rejectedCount }, message));
  } catch (error: any) {
    console.error('Approve booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

// Reject booking (admin only)
export const rejectBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can reject bookings', 403));
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', 404));
    }

    const success = await updateBooking(id, { status: 'cancelled' });

    if (!success) {
      return res.status(400).json(errorResponse('Rejection failed', 400));
    }

    // Reset accommodation status to vacant when booking is rejected
    await updateAccommodationStatus(booking.accommodation_id, 'vacant');

    // Send rejection notification email
    const user = await findUserById(booking.user_id);
    const accommodation = await getAccommodationById(booking.accommodation_id);
    if (user && accommodation) {
      await sendBookingNotificationEmail({
        to: user.email,
        clientName: user.name,
        status: 'rejected',
        bookingId: id,
        accommodation: accommodation.name,
        checkIn: booking.check_in_date,
        checkOut: booking.check_out_date || undefined,
      });
    }

    res.json(successResponse(null, 'Booking rejected successfully'));
  } catch (error: any) {
    console.error('Reject booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

// Check out booking (admin only)
export const checkOutBooking = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can check out bookings', 403));
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', 404));
    }

    if (booking.status !== 'approved') {
      return res.status(400).json(errorResponse('Only approved bookings can be checked out', 400));
    }

    // Update status to completed and set checked_out_at timestamp
    const [result] = await pool.query(
      'UPDATE bookings SET status = ?, checked_out_at = NOW() WHERE id = ?',
      ['completed', id]
    );

    // Reset accommodation status to vacant
    await updateAccommodationStatus(booking.accommodation_id, 'vacant');

    // Get updated booking with accommodation details
    const updatedBooking = await getBookingById(id);
    
    // Send thank you email
    const user = await findUserById(booking.user_id);
    if (user && updatedBooking) {
      await sendCheckOutThankYouEmail({
        clientEmail: user.email,
        clientName: user.name,
        bookingDetails: {
          accommodationName: updatedBooking.accommodation_name,
          checkInDate: updatedBooking.check_in_date,
          checkOutDate: updatedBooking.check_out_date || new Date().toISOString().split('T')[0],
          amountPaid: updatedBooking.total_price,
        },
      });
    }

    res.json(successResponse(null, 'Guest checked out successfully'));
  } catch (error: any) {
    console.error('Check out booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

// Delete booking (admin only)
export const deleteBookingById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user!.role !== 'admin') {
      return res.status(403).json(errorResponse('Only admin can delete bookings', 403));
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', 404));
    }

    // Only allow deletion of cancelled/rejected bookings
    if (booking.status !== 'cancelled' && booking.status !== 'rejected') {
      return res.status(400).json(errorResponse('Only cancelled or rejected bookings can be deleted', 400));
    }

    const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [id]);

    res.json(successResponse(null, 'Booking deleted successfully'));
  } catch (error: any) {
    console.error('Delete booking error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};
