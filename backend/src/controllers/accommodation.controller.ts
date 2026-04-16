import { Request, Response } from 'express';
import {
  getAllAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
} from '../models/accommodation.model.js';
import { getFloat, getInt, getString } from '../utils/request.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAccommodations = async (req: Request, res: Response) => {
  try {
    const accommodations = await getAllAccommodations();
    res.json(successResponse(accommodations));
  } catch (error: any) {
    console.error('Get accommodations error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getAccommodation = async (req: Request, res: Response) => {
  try {
    const id = getInt(req.params.id);
    const accommodation = await getAccommodationById(id);

    if (!accommodation) {
      return res.status(404).json(errorResponse('Accommodation not found', 404));
    }

    res.json(successResponse(accommodation));
  } catch (error: any) {
    console.error('Get accommodation error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const addAccommodation = async (req: Request, res: Response) => {
  try {
    const { name, type, capacity, description, price, add_price, inclusions } = req.body;

    if (!name || !type || !capacity || !price) {
      return res.status(400).json(errorResponse('Missing required fields', 400));
    }

    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let mainImages: string[] = [];
    let panoramicUrl: string | undefined = undefined;

    if (files?.mainImages) {
      mainImages = files.mainImages.map(file => `/uploads/${file.filename}`);
    }

    if (files?.panoramicImage && files.panoramicImage.length > 0) {
      panoramicUrl = `/uploads/${files.panoramicImage[0].filename}`;
    }

    // Store main images as JSON string (or comma-separated)
    const imageUrl = mainImages.length > 0 ? JSON.stringify(mainImages) : undefined;

    const id = await createAccommodation({
      name,
      type,
      capacity,
      description,
      price: getFloat(price),
      add_price: add_price ? getFloat(add_price) : undefined,
      inclusions,
      image_url: imageUrl,
      panoramic_url: panoramicUrl,
    });

    res.status(201).json(successResponse({ id }, 'Accommodation created successfully'));
  } catch (error: any) {
    console.error('Add accommodation error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const modifyAccommodation = async (req: Request, res: Response) => {
  try {
    const id = getInt(req.params.id);
    const updates: any = {};

    // Get text fields from body
    if (req.body.name) updates.name = req.body.name;
    if (req.body.price) updates.price = getFloat(req.body.price);
    if (req.body.add_price !== undefined) {
      updates.add_price = req.body.add_price ? getFloat(req.body.add_price) : null;
    }
    if (req.body.description) updates.description = req.body.description;
    if (req.body.capacity) updates.capacity = req.body.capacity;
    if (req.body.inclusions) updates.inclusions = req.body.inclusions;

    // Handle image updates
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Get current accommodation to access existing images
    const currentAccommodation = await getAccommodationById(id);
    if (!currentAccommodation) {
      return res.status(404).json(errorResponse('Accommodation not found', 404));
    }

    // Handle main images
    let existingImages: string[] = [];
    try {
      if (currentAccommodation.image_url) {
        const parsed = JSON.parse(currentAccommodation.image_url);
        existingImages = Array.isArray(parsed) ? parsed : [currentAccommodation.image_url];
      }
    } catch {
      existingImages = currentAccommodation.image_url ? [currentAccommodation.image_url] : [];
    }

    // Remove images by index if specified
    if (req.body.removedImageIndices) {
      try {
        const removedIndices: number[] = JSON.parse(getString(req.body.removedImageIndices));
        existingImages = existingImages.filter((_, idx) => !removedIndices.includes(idx));
      } catch (e) {
        console.error('Error parsing removedImageIndices:', e);
      }
    }

    // Add new images
    if (files?.mainImages) {
      const newImagePaths = files.mainImages.map(file => `/uploads/${file.filename}`);
      existingImages = [...existingImages, ...newImagePaths];
    }

    // Update image_url if there were changes
    if (files?.mainImages || req.body.removedImageIndices) {
      updates.image_url = existingImages.length > 0 ? JSON.stringify(existingImages) : null;
    }

    // Handle panoramic image replacement
    if (files?.panoramicImage && files.panoramicImage.length > 0) {
      updates.panoramic_url = `/uploads/${files.panoramicImage[0].filename}`;
    }

    const success = await updateAccommodation(id, updates);

    if (!success) {
      return res.status(404).json(errorResponse('Accommodation not found or no changes made', 404));
    }

    res.json(successResponse(null, 'Accommodation updated successfully'));
  } catch (error: any) {
    console.error('Update accommodation error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const removeAccommodation = async (req: Request, res: Response) => {
  try {
    const id = getInt(req.params.id);
    const success = await deleteAccommodation(id);

    if (!success) {
      return res.status(404).json(errorResponse('Accommodation not found', 404));
    }

    res.json(successResponse(null, 'Accommodation deleted successfully'));
  } catch (error: any) {
    console.error('Delete accommodation error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const updateAccommodationAvailability = async (req: Request, res: Response) => {
  try {
    const id = getInt(req.params.id);
    const { supports_morning, supports_night, supports_whole_day } = req.body;

    // Get current accommodation to check type
    const accommodation = await getAccommodationById(id);
    if (!accommodation) {
      return res.status(404).json(errorResponse('Accommodation not found', 404));
    }

    // Cottages cannot have whole_day
    if (accommodation.type === 'cottage' && supports_whole_day === true) {
      return res.status(400).json(errorResponse('Cottages cannot support whole day booking'));
    }

    const updates: any = {};
    if (supports_morning !== undefined) updates.supports_morning = supports_morning ? 1 : 0;
    if (supports_night !== undefined) updates.supports_night = supports_night ? 1 : 0;
    if (supports_whole_day !== undefined) updates.supports_whole_day = supports_whole_day ? 1 : 0;

    const success = await updateAccommodation(id, updates);

    if (!success) {
      return res.status(404).json(errorResponse('Accommodation not found or no changes made', 404));
    }

    res.json(successResponse(null, 'Accommodation availability updated successfully'));
  } catch (error: any) {
    console.error('Update accommodation availability error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};
