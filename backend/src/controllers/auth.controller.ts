import { Request, Response } from 'express';
import { findUserByEmail, createUser, getAllClients, updatePassword, updateUserEmailVerified, getUsersByRole, deleteUser } from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { getInt } from '../utils/request.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { generateVerificationCode, createVerificationCode, verifyCode, deleteVerificationCode } from '../models/verification.model.js';
import { sendVerificationCodeEmail, sendAdminInvitationEmail, sendPasswordResetEmail } from '../services/email.service.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, contact_number, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(errorResponse('Name, email, and password are required', 400));
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json(errorResponse('Email already registered', 409));
    }

    // Create user with email_verified = false
    const hashedPassword = await hashPassword(password);
    const userId = await createUser({
      name,
      email,
      contact_number,
      password: hashedPassword,
      role: 'user',
    });

    // Generate verification code
    const verificationCode = generateVerificationCode();
    await createVerificationCode(email, verificationCode, 15);
    
    // Send verification code email
    console.log(`📧 Sending verification code to ${email} (signup)...`);
    await sendVerificationCodeEmail({
      to: email,
      name: name,
      code: verificationCode,
    });

    res.status(201).json(
      successResponse(
        {
          user: { id: userId, name, email, contact_number, role: 'user' },
          message: 'User registered successfully. Please check your email to verify your account.',
        },
        'User registered successfully'
      )
    );
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required', 400));
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json(errorResponse('Invalid credentials', 401));
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json(errorResponse('Please verify your email before logging in', 403));
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('Invalid credentials', 401));
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json(
      successResponse(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
        'Login successful'
      )
    );
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await findUserByEmail(req.user!.email);
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }

    res.json(
      successResponse({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      })
    );
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await getAllClients();
    
    res.json(
      successResponse(
        clients.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          contactNumber: client.contact_number,
          memberSince: client.created_at,
          totalBookings: parseInt(client.total_bookings) || 0,
        })),
        'Clients retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('Get clients error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(errorResponse('Email is required', 400));
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // For security, don't reveal if user exists
      return res.json(successResponse(null, 'If your email is registered, you will receive a verification code.'));
    }

    const code = generateVerificationCode();
    await createVerificationCode(email, code, 15);

    await sendPasswordResetEmail({
      to: email,
      name: user.name,
      code: code,
    });

    res.json(successResponse(null, 'If your email is registered, you will receive a verification code.'));
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const verifyResetOTP = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json(errorResponse('Email and code are required', 400));
    }

    const isValid = await verifyCode(email, code);
    if (!isValid) {
      return res.status(400).json(errorResponse('Invalid or expired verification code', 400));
    }

    res.json(successResponse({ valid: true }, 'Verification code is valid'));
  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json(errorResponse('Email, code, and new password are required', 400));
    }

    const isValid = await verifyCode(email, code);
    if (!isValid) {
      return res.status(400).json(errorResponse('Invalid or expired verification code', 400));
    }

    const hashedPassword = await hashPassword(newPassword);
    await updatePassword(email, hashedPassword);
    await deleteVerificationCode(email, code);

    res.json(successResponse(null, 'Password reset successfully'));
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const inviteAdmin = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json(errorResponse('Email is required', 400));
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json(errorResponse('User with this email already exists', 409));
    }

    const code = generateVerificationCode();
    await createVerificationCode(email, code, 1440); // 24 hours expiration

    await sendAdminInvitationEmail({
      to: email,
      name: name || 'New Admin',
      code: code,
    });

    res.json(successResponse(null, 'Invitation code sent to email'));
  } catch (error: any) {
    console.error('Invite admin error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await getUsersByRole('admin');
    res.json(successResponse(admins, 'Admins retrieved successfully'));
  } catch (error: any) {
    console.error('Get admins error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json(errorResponse('Admin ID is required', 400));
    }

    // Prevent deleting self
    if (getInt(id) === req.user!.id) {
      return res.status(403).json(errorResponse('Cannot delete your own account', 403));
    }

    await deleteUser(getInt(id));
    res.json(successResponse(null, 'Admin deleted successfully'));
  } catch (error: any) {
    console.error('Delete admin error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, code, name, contact_number, password } = req.body;

    if (!email || !code || !name || !password) {
      return res.status(400).json(errorResponse('All fields are required', 400));
    }

    const isValid = await verifyCode(email, code);
    if (!isValid) {
      return res.status(400).json(errorResponse('Invalid or expired verification code', 400));
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json(errorResponse('User already exists', 409));
    }

    const hashedPassword = await hashPassword(password);
    const userId = await createUser({
      name,
      email,
      contact_number,
      password: hashedPassword,
      role: 'admin',
    });

    await updateUserEmailVerified(userId, true);
    await deleteVerificationCode(email, code);

    res.status(201).json(successResponse({ userId }, 'Admin account created successfully'));
  } catch (error: any) {
    console.error('Create admin error:', error);
    res.status(500).json(errorResponse(error.message));
  }
};
