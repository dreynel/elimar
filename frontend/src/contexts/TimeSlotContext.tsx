"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '@/lib/utils';

interface TimeSlotSetting {
  start: string;
  end: string;
  enabled: boolean;
}

interface TimeSlotSettingsData {
  morning: TimeSlotSetting;
  night_cottage: TimeSlotSetting & { is_overnight: boolean };
  night_room: TimeSlotSetting & { is_overnight: boolean };
  whole_day: TimeSlotSetting & { is_overnight: boolean };
}

interface TimeSlotContextValue {
  timeSettings: TimeSlotSettingsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getTimeSlotLabel: (slotType: 'morning' | 'night' | 'whole_day', accommodationType?: 'cottage' | 'room') => string;
  getTimeSlotDescription: (slotType: 'morning' | 'night' | 'whole_day', accommodationType?: 'cottage' | 'room') => string;
}

const TimeSlotContext = createContext<TimeSlotContextValue | undefined>(undefined);

export function TimeSlotProvider({ children }: { children: ReactNode }) {
  const [timeSettings, setTimeSettings] = useState<TimeSlotSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/time-settings`);
      const data = await response.json();
      
      if (response.ok && data.data) {
        setTimeSettings(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch time settings');
      }
    } catch (err) {
      console.error('Error fetching time settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch time settings');
      // Set default values on error
      setTimeSettings({
        morning: { start: '09:00', end: '17:00', enabled: true },
        night_cottage: { start: '17:30', end: '22:00', enabled: true, is_overnight: false },
        night_room: { start: '17:30', end: '08:00', enabled: true, is_overnight: true },
        whole_day: { start: '09:00', end: '08:00', enabled: true, is_overnight: true },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSettings();
  }, []);

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeSlotLabel = (
    slotType: 'morning' | 'night' | 'whole_day',
    accommodationType?: 'cottage' | 'room'
  ): string => {
    if (slotType === 'morning') return 'Morning';
    if (slotType === 'night') return 'Night';
    if (slotType === 'whole_day') return 'Whole Day';
    return '';
  };

  const getTimeSlotDescription = (
    slotType: 'morning' | 'night' | 'whole_day',
    accommodationType?: 'cottage' | 'room'
  ): string => {
    if (!timeSettings) return '';

    if (slotType === 'morning') {
      return `${formatTime(timeSettings.morning.start)} - ${formatTime(timeSettings.morning.end)}`;
    }

    if (slotType === 'night') {
      if (accommodationType === 'cottage') {
        return `${formatTime(timeSettings.night_cottage.start)} - ${formatTime(timeSettings.night_cottage.end)}`;
      } else {
        // Room or default
        const endLabel = timeSettings.night_room.is_overnight ? ' (next day)' : '';
        return `${formatTime(timeSettings.night_room.start)} - ${formatTime(timeSettings.night_room.end)}${endLabel}`;
      }
    }

    if (slotType === 'whole_day') {
      return `${formatTime(timeSettings.whole_day.start)} - ${formatTime(timeSettings.whole_day.end)} (overnight)`;
    }

    return '';
  };

  return (
    <TimeSlotContext.Provider
      value={{
        timeSettings,
        loading,
        error,
        refetch: fetchTimeSettings,
        getTimeSlotLabel,
        getTimeSlotDescription,
      }}
    >
      {children}
    </TimeSlotContext.Provider>
  );
}

export function useTimeSlotSettings() {
  const context = useContext(TimeSlotContext);
  if (context === undefined) {
    throw new Error('useTimeSlotSettings must be used within a TimeSlotProvider');
  }
  return context;
}
