import { Request, Response } from 'express';
import {
  getAllWalkInLogs,
  getWalkInLogById,
  getWalkInLogsByDateRange,
  createWalkInLog,
  updateWalkInLog,
  deleteWalkInLog,
  checkOutWalkInLog,
} from '../models/walk-in.model.js';
import { updateAccommodationStatus } from '../models/accommodation.model.js';
import { getInt, getString } from '../utils/request.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getWalkInLogs = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let logs;
    if (startDate && endDate) {
      logs = await getWalkInLogsByDateRange(
        getString(startDate),
        getString(endDate)
      );
    } else {
      logs = await getAllWalkInLogs();
    }

    return res.json(successResponse(logs, 'Walk-in logs retrieved successfully'));
  } catch (err) {
    console.error('Error fetching walk-in logs:', err);
    return res.status(500).json(errorResponse('Failed to fetch walk-in logs'));
  }
};

export const getWalkInLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const log = await getWalkInLogById(getInt(id));

    if (!log) {
      return res.status(404).json(errorResponse('Walk-in log not found'));
    }

    return res.json(successResponse(log, 'Walk-in log retrieved successfully'));
  } catch (err) {
    console.error('Error fetching walk-in log:', err);
    return res.status(500).json(errorResponse('Failed to fetch walk-in log'));
  }
};

export const createWalkInLogEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const logData = {
      ...req.body,
      created_by: userId,
    };

    const logId = await createWalkInLog(logData);
    const newLog = await getWalkInLogById(logId);

    // Update accommodation status based on time slot
    if (newLog && newLog.accommodation_id) {
      const timeSlot = newLog.time_slot || 'morning';
      let statusMap: { [key: string]: 'booked(morning)' | 'booked(night)' | 'booked(whole_day)' } = {
        'morning': 'booked(morning)',
        'night': 'booked(night)',
        'whole_day': 'booked(whole_day)'
      };
      await updateAccommodationStatus(newLog.accommodation_id, statusMap[timeSlot]);
    }

    return res.status(201).json(successResponse(newLog, 'Walk-in log created successfully'));
  } catch (err) {
    console.error('Error creating walk-in log:', err);
    return res.status(500).json(errorResponse('Failed to create walk-in log'));
  }
};

export const updateWalkInLogEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateWalkInLog(getInt(id), req.body);

    if (!updated) {
      return res.status(404).json(errorResponse('Walk-in log not found or no changes made'));
    }

    const updatedLog = await getWalkInLogById(getInt(id));
    return res.json(successResponse(updatedLog, 'Walk-in log updated successfully'));
  } catch (err) {
    console.error('Error updating walk-in log:', err);
    return res.status(500).json(errorResponse('Failed to update walk-in log'));
  }
};

export const deleteWalkInLogEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteWalkInLog(getInt(id));

    if (!deleted) {
      return res.status(404).json(errorResponse('Walk-in log not found'));
    }

    return res.json(successResponse(null, 'Walk-in log deleted successfully'));
  } catch (err) {
    console.error('Error deleting walk-in log:', err);
    return res.status(500).json(errorResponse('Failed to delete walk-in log'));
  }
};

export const checkOutWalkInLogEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the log first to get accommodation_id
    const log = await getWalkInLogById(getInt(id));
    if (!log) {
      return res.status(404).json(errorResponse('Walk-in log not found'));
    }

    const checkedOut = await checkOutWalkInLog(getInt(id));

    if (!checkedOut) {
      return res.status(404).json(errorResponse('Walk-in log not found'));
    }

    // Reset accommodation status to vacant
    if (log.accommodation_id) {
      await updateAccommodationStatus(log.accommodation_id, 'vacant');
    }

    const updatedLog = await getWalkInLogById(getInt(id));
    return res.json(successResponse(updatedLog, 'Guest checked out successfully'));
  } catch (err) {
    console.error('Error checking out walk-in log:', err);
    return res.status(500).json(errorResponse('Failed to check out walk-in log'));
  }
};
