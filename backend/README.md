# Resort Booking System - Backend API

A production-ready Node.js backend for a resort booking system built with Express.js, TypeScript, and MySQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (Admin/User)
- **Bookings Management**: Complete CRUD operations for resort bookings
- **Accommodations**: Manage rooms and cottages with pricing and details
- **Gallery**: Image upload and management system
- **Email Notifications**: Automated booking confirmations via Nodemailer
- **Security**: Password hashing with bcrypt, CORS protection
- **TypeScript**: Fully typed for better development experience

## Prerequisites

- Node.js 18+ 
- MySQL (XAMPP recommended)
- npm or yarn

## Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

4. **Setup database**:
   - Start XAMPP MySQL server
   - Import the schema: `backend/database/schema.sql`
   - Or manually create database and run the SQL script

5. **Update default admin password**:
   - The schema includes a placeholder for admin password
   - Hash "Admin123" using bcrypt and update in the SQL file
   - Or create admin via API after first run

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Frontend URL / CORS
Set one of these environment variables so the backend accepts requests from your frontend without editing code:

- `FRONTEND_URL=https://your-frontend-domain`
- `CLIENT_URLS=https://your-frontend-domain,https://www.your-frontend-domain`

If none is set, the backend falls back to localhost development origins.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)

### Accommodations
- `GET /api/accommodations` - Get all accommodations
- `GET /api/accommodations/:id` - Get single accommodation
- `POST /api/accommodations` - Create accommodation (Admin only)
- `PUT /api/accommodations/:id` - Update accommodation (Admin only)
- `DELETE /api/accommodations/:id` - Delete accommodation (Admin only)

### Bookings
- `GET /api/bookings` - Get bookings (All for admin, own for users)
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking (Protected)
- `PUT /api/bookings/:id` - Update booking (Protected)
- `PATCH /api/bookings/:id/cancel` - Cancel booking (Protected)

### Gallery
- `GET /api/gallery` - Get all gallery images
- `GET /api/gallery/:id` - Get single image
- `POST /api/gallery` - Upload image (Admin only)
- `DELETE /api/gallery/:id` - Delete image (Admin only)

### Health Check
- `GET /api/health` - Server health check

## Environment Variables

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=resort_db
DB_PORT=3306
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
JWT_SECRET=your_secret_key_here
```

## Default Admin Credentials

- **Email**: admin@resort.com
- **Password**: Admin123

⚠️ **Change these credentials after first login in production!**

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (email, etc.)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── database/
│   └── schema.sql       # Database schema
├── uploads/             # Uploaded files storage
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Email Configuration

For Gmail:
1. Enable 2-factor authentication
2. Generate an app password
3. Use app password in `EMAIL_PASS`

## Security Notes

- Always use HTTPS in production
- Change JWT_SECRET to a strong random string
- Update default admin credentials
- Keep .env file secure and never commit it
- Use environment-specific configurations

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error message here",
  "statusCode": 400
}
```

## Success Responses

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

## License

ISC
