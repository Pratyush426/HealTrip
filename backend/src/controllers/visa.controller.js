import MedicalVisaRequest from '../models/MedicalVisaRequest.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { apiResponse } from '../utils/apiResponse.js';
import { generateMedicalVisaLetter } from '../utils/visaLetterGenerator.js';
import { deleteFromCloudinary } from '../utils/uploader.js';

const VISA_LETTER_PREMIUM_FEE = 99; // USD
const VISA_LETTER_FEATURE_NAME = 'medical_visa_letter';

/**
 * Check if user has purchased the premium medical visa feature
 */
const checkPremiumAccess = (user) => {
    if (!user.premiumFeatures) return false;
    
    const visaFeature = user.premiumFeatures.find(
        (feature) =>
            feature.featureName === VISA_LETTER_FEATURE_NAME && feature.status === 'active'
    );
    
    return !!visaFeature;
};

/**
 * Create or update a medical visa request letter
 * POST /api/visa/generate
 * Requires: Medical info, treatment details, optional booking reference
 */
export const generateVisaLetter = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookingId, treatmentDetails, visaCountry, visaType } = req.body;

        // Fetch user with full medical data
        const user = await User.findById(userId);
        if (!user) {
            return apiResponse(res, 404, 'User not found');
        }

        // Check premium access
        const hasPremiumAccess = checkPremiumAccess(user);
        if (!hasPremiumAccess) {
            return apiResponse(res, 403, 'Premium feature not activated. Please purchase the Medical Visa Letter feature.', {
                featureName: VISA_LETTER_FEATURE_NAME,
                cost: VISA_LETTER_PREMIUM_FEE,
                currency: 'USD',
            });
        }

        // Validate booking if provided
        let bookingData = null;
        if (bookingId) {
            const booking = await Booking.findById(bookingId);
            if (!booking || booking.userId.toString() !== userId.toString()) {
                return apiResponse(res, 404, 'Booking not found or unauthorized');
            }
            bookingData = booking;
        }

        // Prepare medical information
        const medicalInfo = {
            conditions: user.conditions || [],
            symptoms: user.symptoms || [],
            medications: user.medications ? user.medications.map((m) => `${m.name} (${m.dosage})`) : [],
            allergies: user.allergies || [],
            bloodGroup: user.bloodGroup || null,
        };

        // Prepare treatment details (from booking or user input)
        const finalTreatmentDetails = {
            hospital: treatmentDetails?.hospital || bookingData?.hospital?.hospitalId || 'To be determined',
            doctor: treatmentDetails?.doctor || bookingData?.hospital?.doctor || 'Specialist',
            treatment: treatmentDetails?.treatment || bookingData?.hospital?.treatment || 'Medical intervention',
            estimatedDuration: treatmentDetails?.estimatedDuration || bookingData?.hospital?.estimatedDuration || '2-4 weeks',
            estimatedCost: treatmentDetails?.estimatedCost || bookingData?.pricing?.total || 0,
            currency: user.preferences?.currency || 'USD',
        };

        // Generate the visa letter
        const letterData = await generateMedicalVisaLetter(user, medicalInfo, finalTreatmentDetails);

        // Create visa request document
        const visaRequest = new MedicalVisaRequest({
            userId,
            bookingId: bookingId || null,
            letterContent: letterData.letterContent,
            letterPdfUrl: letterData.pdfUrl,
            letterPdfPublicId: letterData.publicId,
            medicalInfo,
            supportingDocuments: user.documents || [],
            treatmentDetails: finalTreatmentDetails,
            payment: {
                amount: VISA_LETTER_PREMIUM_FEE,
                currency: 'USD',
                paymentStatus: 'completed',
                transactionId: null, // Will be linked in payment integration
            },
            visaCountry,
            visaType,
            status: 'generated',
        });

        await visaRequest.save();

        // Add to user's visa letters
        if (!user.visaLetters) {
            user.visaLetters = [];
        }
        user.visaLetters.push(visaRequest._id);
        await user.save();

        return apiResponse(res, 201, 'Medical visa letter generated successfully', {
            visaRequestId: visaRequest._id,
            letterPdfUrl: letterData.pdfUrl,
            status: visaRequest.status,
            generatedAt: visaRequest.generatedAt,
        });
    } catch (error) {
        console.error('Error generating visa letter:', error);
        return apiResponse(res, 500, 'Failed to generate visa letter', { error: error.message });
    }
};

/**
 * Get visa letter by ID
 * GET /api/visa/:visaRequestId
 */
export const getVisaLetter = async (req, res) => {
    try {
        const { visaRequestId } = req.params;
        const userId = req.user._id;

        const visaRequest = await MedicalVisaRequest.findById(visaRequestId).populate('bookingId userId');

        if (!visaRequest) {
            return apiResponse(res, 404, 'Visa letter not found');
        }

        // Authorization check
        if (visaRequest.userId._id.toString() !== userId.toString()) {
            return apiResponse(res, 403, 'Unauthorized to access this visa letter');
        }

        return apiResponse(res, 200, 'Visa letter retrieved', visaRequest);
    } catch (error) {
        console.error('Error fetching visa letter:', error);
        return apiResponse(res, 500, 'Failed to fetch visa letter', { error: error.message });
    }
};

/**
 * Get all visa letters for a user
 * GET /api/visa/user/all
 */
export const getUserVisaLetters = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, sortBy = 'createdAt', order = 'desc', limit = 10, page = 1 } = req.query;

        let query = { userId };

        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const visaLetters = await MedicalVisaRequest.find(query)
            .populate('bookingId')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await MedicalVisaRequest.countDocuments(query);

        return apiResponse(res, 200, 'User visa letters retrieved', {
            visaLetters,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching user visa letters:', error);
        return apiResponse(res, 500, 'Failed to fetch visa letters', { error: error.message });
    }
};

/**
 * Update visa letter status (admin/system use)
 * PUT /api/visa/:visaRequestId/status
 */
export const updateVisaLetterStatus = async (req, res) => {
    try {
        const { visaRequestId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user._id;

        // Validate status
        const validStatuses = ['draft', 'generated', 'verified', 'submitted', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return apiResponse(res, 400, 'Invalid status');
        }

        const visaRequest = await MedicalVisaRequest.findById(visaRequestId);

        if (!visaRequest) {
            return apiResponse(res, 404, 'Visa letter not found');
        }

        // Authorization check
        if (visaRequest.userId.toString() !== userId.toString()) {
            return apiResponse(res, 403, 'Unauthorized to update this visa letter');
        }

        visaRequest.status = status;
        if (notes) visaRequest.notes = notes;

        if (status === 'approved') {
            visaRequest.approvedAt = new Date();
        }
        if (status === 'submitted') {
            visaRequest.submittedAt = new Date();
        }

        await visaRequest.save();

        return apiResponse(res, 200, 'Visa letter status updated', {
            visaRequestId: visaRequest._id,
            status: visaRequest.status,
        });
    } catch (error) {
        console.error('Error updating visa letter status:', error);
        return apiResponse(res, 500, 'Failed to update visa letter', { error: error.message });
    }
};

/**
 * Regenerate visa letter (if details changed)
 * POST /api/visa/:visaRequestId/regenerate
 */
export const regenerateVisaLetter = async (req, res) => {
    try {
        const { visaRequestId } = req.params;
        const { treatmentDetails, changes } = req.body;
        const userId = req.user._id;

        const visaRequest = await MedicalVisaRequest.findById(visaRequestId);

        if (!visaRequest) {
            return apiResponse(res, 404, 'Visa letter not found');
        }

        // Authorization check
        if (visaRequest.userId.toString() !== userId.toString()) {
            return apiResponse(res, 403, 'Unauthorized to update this visa letter');
        }

        // Fetch user for fresh medical info
        const user = await User.findById(userId);

        // Update treatment details if provided
        if (treatmentDetails) {
            visaRequest.treatmentDetails = {
                ...visaRequest.treatmentDetails,
                ...treatmentDetails,
            };
        }

        // Prepare data for regeneration
        const medicalInfo = visaRequest.medicalInfo;
        const finalTreatmentDetails = visaRequest.treatmentDetails;

        // Generate new PDF
        const letterData = await generateMedicalVisaLetter(user, medicalInfo, finalTreatmentDetails);

        // Store old version
        const newVersion = visaRequest.currentVersion + 1;
        visaRequest.versions.push({
            version: visaRequest.currentVersion,
            generatedAt: visaRequest.generatedAt,
            changes: visaRequest.notes || 'Initial generation',
            pdfUrl: visaRequest.letterPdfUrl,
        });

        // Update with new version
        visaRequest.letterContent = letterData.letterContent;
        visaRequest.letterPdfUrl = letterData.pdfUrl;
        visaRequest.letterPdfPublicId = letterData.publicId;
        visaRequest.currentVersion = newVersion;
        visaRequest.notes = changes || visaRequest.notes;

        await visaRequest.save();

        return apiResponse(res, 200, 'Visa letter regenerated successfully', {
            visaRequestId: visaRequest._id,
            version: visaRequest.currentVersion,
            letterPdfUrl: letterData.pdfUrl,
            updatedAt: visaRequest.updatedAt,
        });
    } catch (error) {
        console.error('Error regenerating visa letter:', error);
        return apiResponse(res, 500, 'Failed to regenerate visa letter', { error: error.message });
    }
};

/**
 * Delete visa letter
 * DELETE /api/visa/:visaRequestId
 */
export const deleteVisaLetter = async (req, res) => {
    try {
        const { visaRequestId } = req.params;
        const userId = req.user._id;

        const visaRequest = await MedicalVisaRequest.findById(visaRequestId);

        if (!visaRequest) {
            return apiResponse(res, 404, 'Visa letter not found');
        }

        // Authorization check
        if (visaRequest.userId.toString() !== userId.toString()) {
            return apiResponse(res, 403, 'Unauthorized to delete this visa letter');
        }

        // Delete PDF from Cloudinary
        if (visaRequest.letterPdfPublicId) {
            try {
                await deleteFromCloudinary(visaRequest.letterPdfPublicId);
            } catch (error) {
                console.error('Error deleting PDF from Cloudinary:', error);
                // Continue even if deletion fails
            }
        }

        // Delete document from DB
        await MedicalVisaRequest.deleteOne({ _id: visaRequestId });

        // Remove from user's visa letters
        await User.updateOne(
            { _id: userId },
            { $pull: { visaLetters: visaRequestId } }
        );

        return apiResponse(res, 200, 'Visa letter deleted successfully');
    } catch (error) {
        console.error('Error deleting visa letter:', error);
        return apiResponse(res, 500, 'Failed to delete visa letter', { error: error.message });
    }
};

/**
 * Check premium feature availability
 * GET /api/visa/premium/status
 */
export const checkPremiumStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return apiResponse(res, 404, 'User not found');
        }

        const hasPremium = checkPremiumAccess(user);
        const visaFeature = user.premiumFeatures?.find(
            (f) => f.featureName === VISA_LETTER_FEATURE_NAME
        );

        return apiResponse(res, 200, 'Premium status retrieved', {
            hasAccess: hasPremium,
            feature: visaFeature || null,
            cost: VISA_LETTER_PREMIUM_FEE,
            currency: 'USD',
        });
    } catch (error) {
        console.error('Error checking premium status:', error);
        return apiResponse(res, 500, 'Failed to check premium status', { error: error.message });
    }
};

/**
 * Initiate premium purchase for visa feature
 * POST /api/visa/premium/purchase
 * (This will be linked with payment controller)
 */
export const initiatePremiumPurchase = async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentMethod = 'razorpay' } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return apiResponse(res, 404, 'User not found');
        }

        // Check if already purchased
        const existingFeature = user.premiumFeatures?.find(
            (f) =>
                f.featureName === VISA_LETTER_FEATURE_NAME &&
                f.status === 'active'
        );

        if (existingFeature) {
            return apiResponse(res, 400, 'You already have access to this premium feature', {
                expiresAt: existingFeature.expiresAt,
            });
        }

        return apiResponse(res, 200, 'Ready to process premium purchase', {
            featureName: VISA_LETTER_FEATURE_NAME,
            amount: VISA_LETTER_PREMIUM_FEE,
            currency: 'USD',
            paymentMethod,
            userId,
        });
    } catch (error) {
        console.error('Error initiating premium purchase:', error);
        return apiResponse(res, 500, 'Failed to initiate purchase', { error: error.message });
    }
};

/**
 * Add premium feature after successful payment
 * (Called internally by payment service after successful transaction)
 */
export const addPremiumFeatureAfterPayment = async (userId, transactionId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Add premium feature
        if (!user.premiumFeatures) {
            user.premiumFeatures = [];
        }

        user.premiumFeatures.push({
            featureName: VISA_LETTER_FEATURE_NAME,
            purchasedAt: new Date(),
            expiresAt: null, // Lifetime access
            status: 'active',
            renewalCount: 0,
        });

        await user.save();

        return {
            success: true,
            message: 'Premium feature activated',
            feature: VISA_LETTER_FEATURE_NAME,
        };
    } catch (error) {
        console.error('Error adding premium feature:', error);
        throw error;
    }
};
