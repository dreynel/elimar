/**
 * Availability Service
 * Handles booking conflicts between regular bookings and event bookings
 * with priority given to event bookings
 * 
 * Time Slot System:
 * COTTAGE:
 * - morning: 9:00 AM - 5:00 PM
 * - night: 5:30 PM - 10:00 PM
 * - whole_day: NOT AVAILABLE for cottages
 * - Slots are INDEPENDENT (no blocking between morning and night)
 * 
 * ROOM:
 * - morning: 9:00 AM - 5:00 PM
 * - night: 5:30 PM - 8:00 AM (next day, overnight)
 * - whole_day: 9:00 AM - 8:00 AM (next day, overnight)
 * - Blocking rules:
 *   - whole_day blocks: morning, night
 *   - morning blocks: morning, whole_day (night still available)
 *   - night blocks: night, whole_day (morning still available)
 */

import { pool } from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export type TimeSlotType = 'morning' | 'night' | 'whole_day';

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
  conflictingBooking?: {
    type: 'event' | 'regular' | 'walk-in';
    id: number;
    date: string;
    eventType?: string;
    timeSlot?: TimeSlotType;
  };
  availableTimeSlots?: TimeSlotType[];
}

export interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

export const TIME_SLOTS: Record<TimeSlotType, TimeSlot> = {
  morning: { start: '09:00', end: '17:00', label: 'Morning (9:00 AM - 5:00 PM)' },
  night: { start: '17:30', end: '08:00', label: 'Night (5:30 PM - 8:00 AM)' },
  whole_day: { start: '09:00', end: '08:00', label: 'Whole Day (9:00 AM - 8:00 AM)' },
};

/**
 * Determine which slots are blocked by a given slot for ROOMS
 * - whole_day blocks: morning, night, whole_day
 * - morning blocks: morning, whole_day (night still available)
 * - night blocks: night, whole_day (morning still available)
 * 
 * For COTTAGES: morning and night are independent (no blocking between them)
 */
export const getBlockedSlots = (slot: TimeSlotType, accommodationType: 'cottage' | 'room'): TimeSlotType[] => {
  // Cottages: morning and night are independent
  if (accommodationType === 'cottage') {
    // Only block the same slot
    return [slot];
  }
  
  // Rooms: apply blocking rules
  switch (slot) {
    case 'whole_day':
      return ['morning', 'night', 'whole_day'];
    case 'morning':
      return ['morning', 'whole_day'];
    case 'night':
      return ['night', 'whole_day'];
    default:
      return [];
  }
};

/**
 * Determine which slots would conflict with a requested slot
 * For ROOMS:
 * - Requesting whole_day conflicts with: morning, night, whole_day
 * - Requesting morning conflicts with: morning, whole_day
 * - Requesting night conflicts with: night, whole_day
 * 
 * For COTTAGES:
 * - Requesting morning conflicts with: morning only
 * - Requesting night conflicts with: night only
 * - whole_day not available for cottages
 */
export const getConflictingSlots = (requestedSlot: TimeSlotType, accommodationType: 'cottage' | 'room'): TimeSlotType[] => {
  return getBlockedSlots(requestedSlot, accommodationType);
};

/**
 * Check if a date has any event bookings and determine available time slots
 */
export const checkEventConflictsForDate = async (
  date: string,
  excludeEventBookingId?: number
): Promise<{
  hasWholeDay: boolean;
  hasMorning: boolean;
  hasEvening: boolean;
  availableSlots: TimeSlotType[];
  conflictingEvents: any[];
}> => {
  let query = `
    SELECT id, event_type, booking_date 
    FROM event_bookings 
    WHERE booking_date = ? 
    AND status = 'approved'
  `;
  
  const params: any[] = [date];
  
  if (excludeEventBookingId) {
    query += ' AND id != ?';
    params.push(excludeEventBookingId);
  }
  
  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  const events = rows as any[];
  
  const hasWholeDay = events.some(e => e.event_type === 'whole_day');
  const hasMorning = events.some(e => e.event_type === 'morning');
  const hasEvening = events.some(e => e.event_type === 'evening');
  
  // Determine available slots based on event bookings
  // Event types map to our time slot system:
  // - whole_day event -> blocks all slots
  // - morning event -> blocks morning slot
  // - evening event -> blocks night slot
  const availableSlots: TimeSlotType[] = [];
  
  if (hasWholeDay) {
    // No slots available if whole day is booked
  } else if (hasMorning && hasEvening) {
    // Both morning and evening booked = no slots available
  } else if (hasMorning) {
    // Morning event blocks morning, only night available
    availableSlots.push('night');
  } else if (hasEvening) {
    // Evening event blocks night, only morning available
    availableSlots.push('morning');
  } else {
    // No events, all slots available
    availableSlots.push('morning', 'night', 'whole_day');
  }
  
  return {
    hasWholeDay,
    hasMorning,
    hasEvening,
    availableSlots,
    conflictingEvents: events,
  };
};

/**
 * Check if a regular booking can be made on a specific date with a specific time slot
 * Takes into account event bookings which have priority, other regular bookings, and walk-ins
 */
export const checkRegularBookingAvailability = async (
  accommodationId: number,
  checkInDate: string,
  timeSlot: TimeSlotType = 'morning',
  excludeBookingId?: number
): Promise<AvailabilityResult> => {
  // Get accommodation type and supported time slots
  const [accommodationRows] = await pool.query<RowDataPacket[]>(
    'SELECT type, supports_morning, supports_night, supports_whole_day FROM accommodations WHERE id = ?',
    [accommodationId]
  );
  
  if (accommodationRows.length === 0) {
    return {
      available: false,
      reason: 'Accommodation not found',
    };
  }
  
  const accommodationType = accommodationRows[0].type as 'cottage' | 'room';
  const supportsSlots = {
    morning: accommodationRows[0].supports_morning === 1,
    night: accommodationRows[0].supports_night === 1,
    whole_day: accommodationRows[0].supports_whole_day === 1,
  };
  
  // Check if accommodation supports the requested time slot
  if (!supportsSlots[timeSlot]) {
    const supportedSlots = Object.keys(supportsSlots)
      .filter(slot => supportsSlots[slot as TimeSlotType])
      .map(slot => slot.replace('_', ' '))
      .join(', ');
    
    return {
      available: false,
      reason: `This accommodation does not support ${timeSlot.replace('_', ' ')} bookings. Available slots: ${supportedSlots}`,
    };
  }
  
  // Validate: cottages cannot book whole_day (should be prevented by DB constraint too)
  if (accommodationType === 'cottage' && timeSlot === 'whole_day') {
    return {
      available: false,
      reason: 'Whole day bookings are not available for cottages. Please select morning or night slot.',
    };
  }
  
  // First check for event conflicts (event bookings have priority)
  const eventConflicts = await checkEventConflictsForDate(checkInDate);
  
  if (eventConflicts.hasWholeDay) {
    return {
      available: false,
      reason: 'This date is reserved for a whole-day event. Please select another date.',
      conflictingBooking: {
        type: 'event',
        id: eventConflicts.conflictingEvents[0].id,
        date: checkInDate,
        eventType: 'whole_day',
      },
      availableTimeSlots: [],
    };
  }
  
  // Check if requested slot conflicts with event bookings
  if (eventConflicts.hasMorning && (timeSlot === 'morning' || timeSlot === 'whole_day')) {
    return {
      available: false,
      reason: 'Morning slot is reserved for an event. Only night slot is available.',
      availableTimeSlots: eventConflicts.availableSlots,
    };
  }
  
  if (eventConflicts.hasEvening && (timeSlot === 'night' || timeSlot === 'whole_day')) {
    return {
      available: false,
      reason: 'Night slot is reserved for an event. Only morning slot is available.',
      availableTimeSlots: eventConflicts.availableSlots,
    };
  }
  
  // Get slots that would conflict with the requested slot based on accommodation type
  const conflictingSlots = getConflictingSlots(timeSlot, accommodationType);
  
  // Check for regular booking conflicts with time slot logic
  let query = `
    SELECT id, time_slot
    FROM bookings 
    WHERE accommodation_id = ? 
    AND check_in_date = ?
    AND status = 'approved'
    AND time_slot IN (${conflictingSlots.map(() => '?').join(', ')})
  `;
  
  const params: any[] = [accommodationId, checkInDate, ...conflictingSlots];
  
  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }
  
  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  
  if (rows.length > 0) {
    const existingSlot = rows[0].time_slot as TimeSlotType;
    return {
      available: false,
      reason: `This accommodation is already booked for the ${existingSlot.replace('_', ' ')} slot on this date.`,
      conflictingBooking: {
        type: 'regular',
        id: rows[0].id,
        date: checkInDate,
        timeSlot: existingSlot,
      },
      availableTimeSlots: await getAvailableSlotsForAccommodation(accommodationId, checkInDate, excludeBookingId),
    };
  }
  
  // Check walk-in logs (ongoing walk-ins that haven't checked out)
  const [walkInRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, time_slot
     FROM walk_in_logs 
     WHERE accommodation_id = ? 
     AND check_in_date = ?
     AND checked_out = FALSE
     AND time_slot IN (${conflictingSlots.map(() => '?').join(', ')})`,
    [accommodationId, checkInDate, ...conflictingSlots]
  );
  
  if (walkInRows.length > 0) {
    const existingSlot = (walkInRows[0].time_slot || 'morning') as TimeSlotType;
    return {
      available: false,
      reason: 'This accommodation is currently occupied by a walk-in guest.',
      conflictingBooking: {
        type: 'walk-in',
        id: walkInRows[0].id,
        date: checkInDate,
        timeSlot: existingSlot,
      },
      availableTimeSlots: await getAvailableSlotsForAccommodation(accommodationId, checkInDate, excludeBookingId),
    };
  }
  
  return {
    available: true,
    availableTimeSlots: await getAvailableSlotsForAccommodation(accommodationId, checkInDate, excludeBookingId),
  };
};

/**
 * Get available time slots for a specific accommodation on a specific date
 */
export const getAvailableSlotsForAccommodation = async (
  accommodationId: number,
  date: string,
  excludeBookingId?: number
): Promise<TimeSlotType[]> => {
  // Get accommodation type and supported time slots
  const [accommodationRows] = await pool.query<RowDataPacket[]>(
    'SELECT type, supports_morning, supports_night, supports_whole_day FROM accommodations WHERE id = ?',
    [accommodationId]
  );
  
  if (accommodationRows.length === 0) {
    return [];
  }
  
  const accommodationType = accommodationRows[0].type as 'cottage' | 'room';
  
  // Start with slots that this accommodation supports
  const supportedSlots: TimeSlotType[] = [];
  if (accommodationRows[0].supports_morning === 1) supportedSlots.push('morning');
  if (accommodationRows[0].supports_night === 1) supportedSlots.push('night');
  if (accommodationRows[0].supports_whole_day === 1) supportedSlots.push('whole_day');
  
  if (supportedSlots.length === 0) {
    return [];
  }
  
  // Filter by event availability
  const eventConflicts = await checkEventConflictsForDate(date);
  let availableSlots: TimeSlotType[] = supportedSlots.filter(slot => 
    eventConflicts.availableSlots.includes(slot)
  );
  
  if (availableSlots.length === 0) {
    return [];
  }
  
  // Check existing bookings for this accommodation
  let query = `
    SELECT time_slot
    FROM bookings 
    WHERE accommodation_id = ? 
    AND check_in_date = ?
    AND status = 'approved'
  `;
  
  const params: any[] = [accommodationId, date];
  
  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }
  
  const [bookingRows] = await pool.query<RowDataPacket[]>(query, params);
  
  // Check walk-in logs
  const [walkInRows] = await pool.query<RowDataPacket[]>(
    `SELECT time_slot
     FROM walk_in_logs 
     WHERE accommodation_id = ? 
     AND check_in_date = ?
     AND checked_out = FALSE`,
    [accommodationId, date]
  );
  
  // Collect all booked slots
  const bookedSlots: TimeSlotType[] = [
    ...bookingRows.map(r => r.time_slot as TimeSlotType),
    ...walkInRows.map(r => (r.time_slot || 'morning') as TimeSlotType),
  ];
  
  // Remove slots that are blocked by existing bookings
  bookedSlots.forEach(bookedSlot => {
    const blockedByBooking = getBlockedSlots(bookedSlot, accommodationType);
    availableSlots = availableSlots.filter(slot => !blockedByBooking.includes(slot));
  });
  
  return availableSlots;
};

/**
 * Check if an event booking can be made
 */
export const checkEventBookingAvailability = async (
  bookingDate: string,
  eventType: 'whole_day' | 'morning' | 'evening',
  excludeEventBookingId?: number
): Promise<AvailabilityResult> => {
  // Check for other event bookings on the same date
  const eventConflicts = await checkEventConflictsForDate(bookingDate, excludeEventBookingId);
  
  if (eventType === 'whole_day') {
    // Whole day booking cannot coexist with any other booking
    if (eventConflicts.conflictingEvents.length > 0) {
      const conflict = eventConflicts.conflictingEvents[0];
      return {
        available: false,
        reason: `This date already has a ${conflict.event_type.replace('_', ' ')} event booking.`,
        conflictingBooking: {
          type: 'event',
          id: conflict.id,
          date: bookingDate,
          eventType: conflict.event_type,
        },
      };
    }
  } else if (eventType === 'morning') {
    if (eventConflicts.hasWholeDay || eventConflicts.hasMorning) {
      return {
        available: false,
        reason: 'Morning slot is already booked.',
        conflictingBooking: {
          type: 'event',
          id: eventConflicts.conflictingEvents[0].id,
          date: bookingDate,
          eventType: eventConflicts.hasWholeDay ? 'whole_day' : 'morning',
        },
      };
    }
  } else if (eventType === 'evening') {
    if (eventConflicts.hasWholeDay || eventConflicts.hasEvening) {
      return {
        available: false,
        reason: 'Evening slot is already booked.',
        conflictingBooking: {
          type: 'event',
          id: eventConflicts.conflictingEvents[0].id,
          date: bookingDate,
          eventType: eventConflicts.hasWholeDay ? 'whole_day' : 'evening',
        },
      };
    }
  }
  
  // Check if there are any approved regular bookings on this date
  const [regularBookings] = await pool.query<RowDataPacket[]>(
    `SELECT id, accommodation_id, check_in_date, check_out_date
     FROM bookings
     WHERE status = 'approved'
     AND check_in_date = ?`,
    [bookingDate]
  );
  
  if (regularBookings.length > 0) {
    return {
      available: false,
      reason: 'There are existing accommodation bookings for this date. Event bookings take priority, but existing bookings must be cancelled first.',
      conflictingBooking: {
        type: 'regular',
        id: regularBookings[0].id,
        date: bookingDate,
      },
    };
  }
  
  // Also check for walk-in logs on this date
  const [walkInLogs] = await pool.query<RowDataPacket[]>(
    `SELECT id, accommodation_id, check_in_date
     FROM walk_in_logs
     WHERE accommodation_id IS NOT NULL
     AND check_in_date = ?
     AND checked_out = FALSE`,
    [bookingDate]
  );
  
  if (walkInLogs.length > 0) {
    return {
      available: false,
      reason: 'There are existing walk-in guests at accommodations for this date. Event bookings take priority, but existing guests must check out first.',
      conflictingBooking: {
        type: 'walk-in',
        id: walkInLogs[0].id,
        date: bookingDate,
      },
    };
  }
  
  return {
    available: true,
  };
};

/**
 * Get all unavailable dates for a specific accommodation
 * Returns dates that are completely unavailable due to event bookings or full slot bookings
 */
export const getUnavailableDates = async (
  accommodationId?: number,
  startDate?: string,
  endDate?: string
): Promise<{
  dates: string[];
  partiallyAvailable: Array<{
    date: string;
    availableSlots: TimeSlotType[];
    reason: string;
  }>;
}> => {
  const unavailableDates: string[] = [];
  const partiallyAvailable: Array<{
    date: string;
    availableSlots: TimeSlotType[];
    reason: string;
  }> = [];
  
  // Get all whole-day event bookings
  let eventQuery = `
    SELECT booking_date, event_type
    FROM event_bookings
    WHERE status = 'approved'
  `;
  
  const eventParams: any[] = [];
  
  if (startDate && endDate) {
    eventQuery += ' AND booking_date BETWEEN ? AND ?';
    eventParams.push(startDate, endDate);
  }
  
  const [eventRows] = await pool.query<RowDataPacket[]>(eventQuery, eventParams);
  const events = eventRows as any[];
  
  // Group events by date
  const eventsByDate = new Map<string, any[]>();
  events.forEach(event => {
    const dateStr = event.booking_date.toISOString().split('T')[0];
    if (!eventsByDate.has(dateStr)) {
      eventsByDate.set(dateStr, []);
    }
    eventsByDate.get(dateStr)!.push(event);
  });
  
  // Determine availability for each date based on events
  eventsByDate.forEach((dateEvents, date) => {
    const hasWholeDay = dateEvents.some(e => e.event_type === 'whole_day');
    const hasMorning = dateEvents.some(e => e.event_type === 'morning');
    const hasEvening = dateEvents.some(e => e.event_type === 'evening');
    
    if (hasWholeDay || (hasMorning && hasEvening)) {
      unavailableDates.push(date);
    } else if (hasMorning) {
      partiallyAvailable.push({
        date,
        availableSlots: ['night'],
        reason: 'Morning slot booked for event',
      });
    } else if (hasEvening) {
      partiallyAvailable.push({
        date,
        availableSlots: ['morning'],
        reason: 'Evening slot booked for event',
      });
    }
  });
  
  // If accommodation is specified, also check regular bookings and walk-ins with time slots
  if (accommodationId) {
    // Get accommodation type for slot blocking logic
    const [accRows] = await pool.query<RowDataPacket[]>(
      'SELECT type FROM accommodations WHERE id = ?',
      [accommodationId]
    );
    const accommodationType = (accRows.length > 0 ? accRows[0].type : 'room') as 'cottage' | 'room';

    let bookingQuery = `
      SELECT check_in_date, time_slot
      FROM bookings
      WHERE accommodation_id = ?
      AND status = 'approved'
    `;
    
    const bookingParams: any[] = [accommodationId];
    
    if (startDate && endDate) {
      bookingQuery += ` AND check_in_date BETWEEN ? AND ?`;
      bookingParams.push(startDate, endDate);
    }
    
    const [bookingRows] = await pool.query<RowDataPacket[]>(bookingQuery, bookingParams);
    const bookings = bookingRows as any[];
    
    // Also check walk-in logs
    let walkInQuery = `
      SELECT check_in_date, time_slot
      FROM walk_in_logs
      WHERE accommodation_id = ?
      AND checked_out = FALSE
    `;
    
    const walkInParams: any[] = [accommodationId];
    
    if (startDate && endDate) {
      walkInQuery += ` AND check_in_date BETWEEN ? AND ?`;
      walkInParams.push(startDate, endDate);
    }
    
    const [walkInRows] = await pool.query<RowDataPacket[]>(walkInQuery, walkInParams);
    const walkIns = walkInRows as any[];
    
    // Combine bookings and walk-ins
    const allReservations = [...bookings, ...walkIns];
    
    // Group by date
    const reservationsByDate = new Map<string, TimeSlotType[]>();
    allReservations.forEach(res => {
      const dateStr = res.check_in_date instanceof Date 
        ? res.check_in_date.toISOString().split('T')[0]
        : res.check_in_date.split('T')[0];
      const slot = (res.time_slot || 'morning') as TimeSlotType;
      
      if (!reservationsByDate.has(dateStr)) {
        reservationsByDate.set(dateStr, []);
      }
      reservationsByDate.get(dateStr)!.push(slot);
    });
    
    // Process each date
    reservationsByDate.forEach((slots, dateStr) => {
      // Skip if already in unavailable dates
      if (unavailableDates.includes(dateStr)) return;
      
      // Check if date already has partial availability from events
      const existingPartial = partiallyAvailable.find(p => p.date === dateStr);
      
      // Determine what slots are still available after bookings
      let availableSlots: TimeSlotType[] = existingPartial 
        ? [...existingPartial.availableSlots]
        : ['morning', 'night', 'whole_day'];
      
      // Remove slots blocked by existing bookings
      slots.forEach(bookedSlot => {
        const blocked = getBlockedSlots(bookedSlot, accommodationType);
        availableSlots = availableSlots.filter(s => !blocked.includes(s));
      });
      
      if (availableSlots.length === 0) {
        // Fully booked
        if (!unavailableDates.includes(dateStr)) {
          unavailableDates.push(dateStr);
        }
        // Remove from partially available if it was there
        const idx = partiallyAvailable.findIndex(p => p.date === dateStr);
        if (idx >= 0) {
          partiallyAvailable.splice(idx, 1);
        }
      } else if (availableSlots.length < 3 || existingPartial) {
        // Partially available
        if (existingPartial) {
          existingPartial.availableSlots = availableSlots;
          existingPartial.reason = 'Some slots are already booked';
        } else {
          partiallyAvailable.push({
            date: dateStr,
            availableSlots,
            reason: 'Some slots are already booked',
          });
        }
      }
    });
  }
  
  return {
    dates: unavailableDates,
    partiallyAvailable,
  };
};

/**
 * Get booking summary for a specific date
 * Shows what's booked and what's available
 */
export const getDateBookingSummary = async (date: string): Promise<{
  eventBookings: any[];
  regularBookings: any[];
  walkIns: any[];
  isFullyBooked: boolean;
  availableSlots: TimeSlotType[];
  availableAccommodations: number[];
}> => {
  // Get event bookings
  const [eventRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM event_bookings 
     WHERE booking_date = ? 
     AND status = 'approved'`,
    [date]
  );
  
  // Get regular bookings with time slots
  const [bookingRows] = await pool.query<RowDataPacket[]>(
    `SELECT b.*, a.name as accommodation_name
     FROM bookings b
     LEFT JOIN accommodations a ON b.accommodation_id = a.id
     WHERE b.check_in_date = ? 
     AND b.status = 'approved'`,
    [date]
  );
  
  // Get walk-in logs
  const [walkInRows] = await pool.query<RowDataPacket[]>(
    `SELECT wil.*, a.name as accommodation_name
     FROM walk_in_logs wil
     LEFT JOIN accommodations a ON wil.accommodation_id = a.id
     WHERE wil.check_in_date = ? 
     AND wil.checked_out = FALSE`,
    [date]
  );
  
  const eventBookings = eventRows as any[];
  const regularBookings = bookingRows as any[];
  const walkIns = walkInRows as any[];
  
  const eventConflicts = await checkEventConflictsForDate(date);
  
  // Get all accommodations
  const [allAccommodations] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM accommodations'
  );
  
  // For each accommodation, check what slots are available
  const bookedAccommodationIds = new Set<number>();
  
  // An accommodation is fully booked if whole_day is booked or both morning and night are booked
  regularBookings.forEach(b => {
    if (b.time_slot === 'whole_day') {
      bookedAccommodationIds.add(b.accommodation_id);
    }
  });
  
  walkIns.forEach(w => {
    if (w.time_slot === 'whole_day') {
      bookedAccommodationIds.add(w.accommodation_id);
    }
  });
  
  // Check for morning + night combination
  const slotsByAccommodation = new Map<number, Set<TimeSlotType>>();
  [...regularBookings, ...walkIns].forEach(res => {
    const accId = res.accommodation_id;
    if (!slotsByAccommodation.has(accId)) {
      slotsByAccommodation.set(accId, new Set());
    }
    slotsByAccommodation.get(accId)!.add(res.time_slot || 'morning');
  });
  
  slotsByAccommodation.forEach((slots, accId) => {
    if (slots.has('morning') && slots.has('night')) {
      bookedAccommodationIds.add(accId);
    }
  });
  
  const availableAccommodations = (allAccommodations as any[])
    .map(a => a.id)
    .filter(id => !bookedAccommodationIds.has(id));
  
  return {
    eventBookings,
    regularBookings,
    walkIns,
    isFullyBooked: eventConflicts.hasWholeDay || (eventConflicts.hasMorning && eventConflicts.hasEvening),
    availableSlots: eventConflicts.availableSlots,
    availableAccommodations,
  };
};

/**
 * Get available accommodations for a specific date and time slot
 * Used for walk-in and booking forms to filter accommodation selection
 */
export const getAvailableAccommodations = async (
  date: string,
  timeSlot: TimeSlotType,
  accommodationType: 'cottage' | 'room'
): Promise<number[]> => {
  // Get all accommodations of the requested type
  const [allAccommodations] = await pool.query<RowDataPacket[]>(
    'SELECT id, type FROM accommodations WHERE type = ?',
    [accommodationType]
  );
  
  // Check if this is for today's date (using local timezone without UTC conversion)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const localToday = `${year}-${month}-${day}`;
  const isToday = date === localToday;
  
  console.log('Date comparison:', { requestedDate: date, localToday, isToday, serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  
  // If checking for today, use accommodation status instead of bookings
  if (isToday) {
    // Get all accommodations of the specified type
    const [allAccommodations] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, status FROM accommodations WHERE type = ?',
      [accommodationType]
    );
    
    console.log('All accommodations for type', accommodationType, ':', 
      (allAccommodations as any[]).map(a => ({ id: a.id, name: a.name, status: a.status }))
    );
    
    // Filter accommodations by status for today
    // vacant = available for all slots
    // pending = available (not yet approved)
    // booked(morning) = not available for morning/whole_day
    // booked(night) = not available for night/whole_day
    // booked(whole_day) = not available for any slot
    
    const availableIds = (allAccommodations as any[])
      .filter(acc => {
        // If vacant or pending, available for all slots
        if (acc.status === 'vacant' || acc.status === 'pending') return true;
        
        // If booked for whole day, never available
        if (acc.status === 'booked(whole_day)') return false;
        
        // Check time slot conflicts
        if (timeSlot === 'morning' && acc.status === 'booked(morning)') return false;
        if (timeSlot === 'night' && acc.status === 'booked(night)') return false;
        if (timeSlot === 'whole_day' && (acc.status === 'booked(morning)' || acc.status === 'booked(night)')) {
          // For rooms, whole_day conflicts with any booked slot
          // For cottages, whole_day is not available anyway
          return false;
        }
        
        return true;
      })
      .map(acc => acc.id);
    
    console.log('Available accommodation IDs for today:', availableIds);
    
    return availableIds;
  }
  
  // For future dates, check event conflicts
  const eventConflicts = await checkEventConflictsForDate(date);
  
  // If whole day event, no accommodations available
  if (eventConflicts.hasWholeDay) {
    return [];
  }
  
  // If requesting morning and morning event exists, no morning slots
  if (timeSlot === 'morning' && eventConflicts.hasMorning) {
    console.log('Returning empty: morning event conflict');
    return [];
  }
  
  // If requesting night and evening event exists, no night slots
  if (timeSlot === 'night' && eventConflicts.hasEvening) {
    console.log('Returning empty: evening event conflict');
    return [];
  }
  
  // If requesting whole_day and either event slot exists, can't book whole day
  if (timeSlot === 'whole_day' && (eventConflicts.hasMorning || eventConflicts.hasEvening)) {
    console.log('Returning empty: whole_day event conflict');
    return [];
  }
  
  // Get conflicting slots for this accommodation type
  const conflictingSlots = getConflictingSlots(timeSlot, accommodationType);
  
  console.log('Future date availability check:', {
    date,
    timeSlot,
    accommodationType,
    conflictingSlots,
    allAccommodationIds: (allAccommodations as any[]).map(a => a.id)
  });
  
  // Get accommodations already booked in conflicting slots
  const [bookedAccommodations] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT accommodation_id
     FROM bookings
     WHERE check_in_date = ?
     AND status = 'approved'
     AND time_slot IN (${conflictingSlots.map(() => '?').join(', ')})`,
    [date, ...conflictingSlots]
  );
  
  // Get accommodations occupied by walk-ins in conflicting slots
  const [walkInAccommodations] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT accommodation_id
     FROM walk_in_logs
     WHERE check_in_date = ?
     AND checked_out = FALSE
     AND accommodation_id IS NOT NULL
     AND time_slot IN (${conflictingSlots.map(() => '?').join(', ')})`,
    [date, ...conflictingSlots]
  );
  
  // Combine booked accommodation IDs
  const bookedIds = new Set<number>([
    ...bookedAccommodations.map((b: any) => b.accommodation_id),
    ...walkInAccommodations.map((w: any) => w.accommodation_id),
  ]);
  
  console.log('Booked/occupied IDs:', Array.from(bookedIds));
  
  // Filter available accommodations
  const availableIds = (allAccommodations as any[])
    .map(a => a.id)
    .filter(id => !bookedIds.has(id));
  
  console.log('Final available IDs for future date:', availableIds);
  
  return availableIds;
};
