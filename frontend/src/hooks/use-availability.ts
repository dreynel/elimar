import { useState, useCallback } from 'react';
import { API_URL } from '@/lib/utils';
import { useTimeSlotSettings } from '@/contexts/TimeSlotContext';

export type TimeSlotType = 'morning' | 'night' | 'whole_day';

// This function will be replaced by context values, but kept for backward compatibility
export const getTimeSlotLabels = (
  getTimeSlotDescription: (slot: TimeSlotType, type?: 'cottage' | 'room') => string
) => ({
  morning: { 
    label: 'Morning', 
    description: getTimeSlotDescription('morning')
  },
  night: { 
    label: 'Night', 
    description: getTimeSlotDescription('night')
  },
  whole_day: { 
    label: 'Whole Day', 
    description: getTimeSlotDescription('whole_day')
  },
});

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

export interface UnavailableDatesResult {
  dates: string[];
  partiallyAvailable: Array<{
    date: string;
    availableSlots: TimeSlotType[];
    reason: string;
  }>;
}

export interface EventConflictsResult {
  hasWholeDay: boolean;
  hasMorning: boolean;
  hasEvening: boolean;
  availableSlots: TimeSlotType[];
  conflictingEvents: any[];
}

export function useAvailability() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if accommodation is available for regular booking with time slot
   */
  const checkRegularAvailability = useCallback(
    async (
      accommodationId: number,
      checkInDate: string,
      timeSlot?: TimeSlotType
    ): Promise<AvailabilityResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          accommodation_id: accommodationId.toString(),
          check_in_date: checkInDate,
        });

        if (timeSlot) {
          params.append('time_slot', timeSlot);
        }

        const response = await fetch(
          `${API_URL}/api/availability/check-regular?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check availability');
        }

        return data.data as AvailabilityResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check availability';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get available time slots for an accommodation on a specific date
   */
  const getAvailableSlots = useCallback(
    async (
      accommodationId: number,
      date: string
    ): Promise<TimeSlotType[] | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          accommodation_id: accommodationId.toString(),
          date: date,
        });

        const response = await fetch(
          `${API_URL}/api/availability/slots?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get available slots');
        }

        return data.data.availableSlots as TimeSlotType[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get available slots';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Check if date is available for event booking
   */
  const checkEventAvailability = useCallback(
    async (
      bookingDate: string,
      eventType: 'whole_day' | 'morning' | 'evening'
    ): Promise<AvailabilityResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          booking_date: bookingDate,
          event_type: eventType,
        });

        const response = await fetch(
          `${API_URL}/api/availability/check-event?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check availability');
        }

        return data.data as AvailabilityResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check availability';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get all unavailable dates for an accommodation
   */
  const getUnavailableDates = useCallback(
    async (
      accommodationId?: number,
      startDate?: string,
      endDate?: string
    ): Promise<UnavailableDatesResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (accommodationId) {
          params.append('accommodation_id', accommodationId.toString());
        }
        if (startDate) {
          params.append('start_date', startDate);
        }
        if (endDate) {
          params.append('end_date', endDate);
        }

        const response = await fetch(
          `${API_URL}/api/availability/unavailable-dates?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get unavailable dates');
        }

        return data.data as UnavailableDatesResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get unavailable dates';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get event conflicts for a specific date
   */
  const getEventConflicts = useCallback(
    async (date: string): Promise<EventConflictsResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/availability/event-conflicts/${date}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get event conflicts');
        }

        return data.data as EventConflictsResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get event conflicts';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get booking summary for a specific date
   */
  const getDateSummary = useCallback(
    async (date: string): Promise<any | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/availability/date-summary/${date}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get date summary');
        }

        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get date summary';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    checkRegularAvailability,
    checkEventAvailability,
    getUnavailableDates,
    getEventConflicts,
    getDateSummary,
    getAvailableSlots,
  };
}
