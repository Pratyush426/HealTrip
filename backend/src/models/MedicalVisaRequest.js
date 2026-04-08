import mongoose from 'mongoose';

/**
 * Medical Visa Request Model
 * Stores generated medical visa request letters and their status
 * Premium feature - requires payment
 */

const medicalVisaRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
        },
        // Generated Letter Details
        letterContent: {
            type: String, // Markdown or HTML content
            required: true,
        },
        letterPdfUrl: {
            type: String, // Cloudinary PDF URL
        },
        letterPdfPublicId: {
            type: String, // Cloudinary public ID for deletion
        },
        // Medical Information Used
        medicalInfo: {
            conditions: [String],
            symptoms: [String],
            medications: [String],
            allergies: [String],
            bloodGroup: String,
        },
        // Supporting Documents
        supportingDocuments: [
            {
                fileName: String,
                url: String,
                cloudinaryPublicId: String,
                type: String, // 'medical_report', 'prescription', 'scan', etc.
            },
        ],
        // Treatment Details
        treatmentDetails: {
            hospital: String,
            doctor: String,
            treatment: String,
            estimatedDuration: String,
            estimatedCost: Number,
            currency: String,
        },
        // Letter Status
        status: {
            type: String,
            enum: ['draft', 'generated', 'verified', 'submitted', 'approved', 'rejected'],
            default: 'generated',
            index: true,
        },
        // Payment Information
        payment: {
            amount: {
                type: Number,
                required: true, // Premium fee
            },
            currency: String,
            paymentStatus: {
                type: String,
                enum: ['pending', 'completed', 'failed', 'refunded'],
                default: 'completed',
            },
            transactionId: String,
            paidAt: Date,
        },
        // Visa Details
        visaCountry: String,
        visaType: String, // 'medical', 'tourist_medical', etc.
        
        // Regeneration History
        versions: [
            {
                version: Number,
                generatedAt: Date,
                changes: String,
                pdfUrl: String,
            },
        ],
        
        currentVersion: {
            type: Number,
            default: 1,
        },
        
        // Additional Notes
        notes: String,
        
        // Timestamps
        generatedAt: {
            type: Date,
            default: Date.now,
        },
        submittedAt: Date,
        approvedAt: Date,
    },
    { timestamps: true }
);

// Index for faster queries
medicalVisaRequestSchema.index({ userId: 1, createdAt: -1 });
medicalVisaRequestSchema.index({ status: 1 });

const MedicalVisaRequest = mongoose.model('MedicalVisaRequest', medicalVisaRequestSchema);

export default MedicalVisaRequest;
