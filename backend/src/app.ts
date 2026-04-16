import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import accommodationRoutes from './routes/accommodation.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import eventBookingRoutes from './routes/event-booking.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import emailLogRoutes from './routes/email-log.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import walkInRoutes from './routes/walk-in.routes.js';
import reportRoutes from './routes/report.routes.js';
import timeSettingsRoutes from './routes/time-settings.routes.js';
import paymentSettingsRoutes from './routes/payment-settings.routes.js';
import reviewRoutes from './routes/review.routes.js';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: env.CLIENT_URLS,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/event_bookings', eventBookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/email_logs', emailLogRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/walk_in', walkInRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/time-settings', timeSettingsRoutes);
app.use('/api/payment-settings', paymentSettingsRoutes);
app.use('/api/reviews', reviewRoutes);

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Resort Booking API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      accommodations: '/api/accommodations',
      bookings: '/api/bookings',
      eventBookings: '/api/event_bookings',
      availability: '/api/availability',
      gallery: '/api/gallery',
      verification: '/api/verification',
      emailLogs: '/api/email_logs',
      pricing: '/api/pricing',
      walkIn: '/api/walk_in',
      reports: '/api/reports',
      reviews: '/api/reviews',
      health: '/api/health',
    },
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
