import { Request, Response } from 'express';
import {
  getAllGalleryImages,
  getGalleryImageById,
  createGalleryImage,
  deleteGalleryImage,
} from '../models/gallery.model.js';
import { getInt } from '../utils/request.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getGalleryImages = async (req: Request, res: Response) => {
  try {
    const images = await getAllGalleryImages();
    res.json(successResponse(images));
  } catch (error: any) {
    console.error('Get gallery images error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getGalleryImage = async (req: Request, res: Response) => {
  try {
    const id = getInt(req.params.id);
    const image = await getGalleryImageById(id);

    if (!image) {
      return res.status(404).json(errorResponse('Image not found', 404));
    }

    res.json(successResponse(image));
  } catch (error: any) {
    console.error('Get gallery image error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const uploadGalleryImage = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json(errorResponse('No files uploaded', 400));
    }

    // Process each file as an individual gallery item
    const uploadPromises = files.map(file => {
      const imageUrl = `/uploads/${file.filename}`;
      // Store as individual record
      return createGalleryImage({ image_url: imageUrl, description });
    });

    await Promise.all(uploadPromises);

    res.status(201).json(successResponse(null, 'Images uploaded successfully'));
  } catch (error: any) {
    console.error('Upload gallery images error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const removeGalleryImage = async (req: Request, res: Response) => {
  try {
    const id = getInt(req.params.id);
    const success = await deleteGalleryImage(id);

    if (!success) {
      return res.status(404).json(errorResponse('Image not found', 404));
    }

    res.json(successResponse(null, 'Image deleted successfully'));
  } catch (error: any) {
    console.error('Delete gallery image error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};
