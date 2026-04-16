import { Request, Response } from 'express';
import {
  getAllTimeSlotSettings,
  getTimeSlotSettingById,
  updateTimeSlotSetting,
  updateAllTimeSlotSettings,
} from '../models/time-settings.model.js';
import { getInt } from '../utils/request.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getTimeSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getAllTimeSlotSettings();
    
    // Transform into a more frontend-friendly format
    const formatted = {
      morning: {
        start: '',
        end: '',
        enabled: true,
      },
      night_cottage: {
        start: '',
        end: '',
        enabled: true,
        is_overnight: false,
      },
      night_room: {
        start: '',
        end: '',
        enabled: true,
        is_overnight: true,
      },
      whole_day: {
        start: '',
        end: '',
        enabled: true,
        is_overnight: true,
      },
    };

    settings.forEach(setting => {
      // Format time from HH:MM:SS to HH:MM
      const formatTime = (time: string) => {
        if (!time) return '';
        return time.substring(0, 5);
      };

      if (setting.slot_type === 'morning' && setting.accommodation_type === 'all') {
        formatted.morning = {
          start: formatTime(setting.start_time),
          end: formatTime(setting.end_time),
          enabled: Boolean(setting.is_enabled),
        };
      } else if (setting.slot_type === 'night' && setting.accommodation_type === 'cottage') {
        formatted.night_cottage = {
          start: formatTime(setting.start_time),
          end: formatTime(setting.end_time),
          enabled: Boolean(setting.is_enabled),
          is_overnight: Boolean(setting.is_overnight),
        };
      } else if (setting.slot_type === 'night' && setting.accommodation_type === 'room') {
        formatted.night_room = {
          start: formatTime(setting.start_time),
          end: formatTime(setting.end_time),
          enabled: Boolean(setting.is_enabled),
          is_overnight: Boolean(setting.is_overnight),
        };
      } else if (setting.slot_type === 'whole_day' && setting.accommodation_type === 'room') {
        formatted.whole_day = {
          start: formatTime(setting.start_time),
          end: formatTime(setting.end_time),
          enabled: Boolean(setting.is_enabled),
          is_overnight: Boolean(setting.is_overnight),
        };
      }
    });

    res.json(successResponse(formatted, 'Time settings retrieved successfully'));
  } catch (error: any) {
    console.error('Get time settings error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getTimeSettingsRaw = async (req: Request, res: Response) => {
  try {
    const settings = await getAllTimeSlotSettings();
    res.json(successResponse(settings, 'Time settings retrieved successfully'));
  } catch (error: any) {
    console.error('Get time settings error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getTimeSetting = async (req: Request, res: Response) => {
  try {
    const id = getInt(req.params.id);
    const setting = await getTimeSlotSettingById(id);

    if (!setting) {
      return res.status(404).json(errorResponse('Time setting not found', 404));
    }

    res.json(successResponse(setting));
  } catch (error: any) {
    console.error('Get time setting error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const modifyTimeSetting = async (req: Request, res: Response) => {
  try {
    const id = getInt(req.params.id);
    const updates = req.body;

    const success = await updateTimeSlotSetting(id, updates);

    if (!success) {
      return res.status(404).json(errorResponse('Time setting not found or no changes made', 404));
    }

    res.json(successResponse(null, 'Time setting updated successfully'));
  } catch (error: any) {
    console.error('Update time setting error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const updateAllSettings = async (req: Request, res: Response) => {
  try {
    const { morning, night_cottage, night_room, whole_day } = req.body;

    // Validate input
    const validateTime = (time: string) => {
      if (!time) return false;
      const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return regex.test(time);
    };

    // Build update object with only valid entries
    const updateData: any = {};

    if (morning?.start && morning?.end) {
      if (!validateTime(morning.start) || !validateTime(morning.end)) {
        return res.status(400).json(errorResponse('Invalid morning time format. Use HH:MM'));
      }
      updateData.morning = {
        start_time: morning.start + ':00',
        end_time: morning.end + ':00',
      };
    }

    if (night_cottage?.start && night_cottage?.end) {
      if (!validateTime(night_cottage.start) || !validateTime(night_cottage.end)) {
        return res.status(400).json(errorResponse('Invalid night cottage time format. Use HH:MM'));
      }
      updateData.night_cottage = {
        start_time: night_cottage.start + ':00',
        end_time: night_cottage.end + ':00',
      };
    }

    if (night_room?.start && night_room?.end) {
      if (!validateTime(night_room.start) || !validateTime(night_room.end)) {
        return res.status(400).json(errorResponse('Invalid night room time format. Use HH:MM'));
      }
      updateData.night_room = {
        start_time: night_room.start + ':00',
        end_time: night_room.end + ':00',
      };
    }

    if (whole_day?.start && whole_day?.end) {
      if (!validateTime(whole_day.start) || !validateTime(whole_day.end)) {
        return res.status(400).json(errorResponse('Invalid whole day time format. Use HH:MM'));
      }
      updateData.whole_day = {
        start_time: whole_day.start + ':00',
        end_time: whole_day.end + ':00',
      };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(errorResponse('No valid time settings provided'));
    }

    await updateAllTimeSlotSettings(updateData);

    res.json(successResponse(null, 'Time settings updated successfully'));
  } catch (error: any) {
    console.error('Update all time settings error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};
