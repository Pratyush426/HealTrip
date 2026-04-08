import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { getClerkUser } from '../utils/verifyToken.js';
import { uploadToCloudinary } from '../utils/uploader.js';

/**
 * Auth Controller
 * Handles user registration, profile management, and medical history
 */

/**
 * Register or sync user from Clerk
 * POST /api/auth/register
 */
export const registerUser = async (req, res) => {
    try {
        const { clerkId, email, firstName, lastName, phone, country } = req.body;

        // Check if user already exists
        let user = await User.findOne({ clerkId });

        if (user) {
            return successResponse(res, 200, user, 'User already registered');
        }

        // Create new user
        user = await User.create({
            clerkId,
            email,
            firstName,
            lastName,
            phone,
            country,
        });

        return successResponse(res, 201, user, 'User registered successfully');
    } catch (error) {
        console.error('Register user error:', error);
        return errorResponse(res, 500, 'Failed to register user', [error.message]);
    }
};

/**
 * Get user profile
 * GET /api/auth/profile
 */
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.userId }).populate('bookings');

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(res, 200, user, 'Profile fetched successfully');
    } catch (error) {
        console.error('Get profile error:', error);
        return errorResponse(res, 500, 'Failed to fetch profile', [error.message]);
    }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateUserProfile = async (req, res) => {
    try {
        const { 
            firstName, lastName, phone, country, bloodGroup, allergies, preferences,
            age, gender, homeCity, conditions, symptoms
        } = req.body;

        const user = await User.findOneAndUpdate(
            { clerkId: req.userId },
            {
                firstName,
                lastName,
                phone,
                country,
                bloodGroup,
                allergies,
                preferences,
                age,
                gender,
                homeCity,
                conditions,
                symptoms
            },
            { new: true, runValidators: true }
        );

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(res, 200, user, 'Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
        return errorResponse(res, 500, 'Failed to update profile', [error.message]);
    }
};

/**
 * Add medical history
 * POST /api/auth/medical-history
 */
export const addMedicalHistory = async (req, res) => {
    try {
        const { condition, diagnosedDate, treatment, notes } = req.body;

        const user = await User.findOne({ clerkId: req.userId });

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        user.medicalHistory.push({
            condition,
            diagnosedDate,
            treatment,
            notes,
        });

        await user.save();

        return successResponse(res, 200, user.medicalHistory, 'Medical history added successfully');
    } catch (error) {
        console.error('Add medical history error:', error);
        return errorResponse(res, 500, 'Failed to add medical history', [error.message]);
    }
};

/**
 * Upload medical document
 * POST /api/auth/upload-document
 */
export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, 400, 'No file uploaded');
        }

        const { name, type } = req.body;

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'healtrip/medical-documents');

        const user = await User.findOne({ clerkId: req.userId });

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        user.documents.push({
            name: name || req.file.originalname,
            url: result.secure_url,
            type: type || 'other',
        });

        await user.save();

        return successResponse(res, 200, user.documents, 'Document uploaded successfully');
    } catch (error) {
        console.error('Upload document error:', error);
        return errorResponse(res, 500, 'Failed to upload document', [error.message]);
    }
};

/**
 * Add medication
 * POST /api/auth/medications
 */
export const addMedication = async (req, res) => {
    try {
        const { name, dosage, frequency } = req.body;

        const user = await User.findOne({ clerkId: req.userId });

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        user.medications.push({ name, dosage, frequency });
        await user.save();

        return successResponse(res, 200, user.medications, 'Medication added successfully');
    } catch (error) {
        console.error('Add medication error:', error);
        return errorResponse(res, 500, 'Failed to add medication', [error.message]);
    }
};
