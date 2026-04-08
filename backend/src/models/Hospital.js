import mongoose from 'mongoose';

/**
 * Hospital Model
 * Stores hospital information, treatments, pricing, and accreditation
 */

const hospitalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: true,
        },
        // Location
        location: {
            address: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
                index: true,
            },
            state: {
                type: String,
                required: true,
            },
            country: {
                type: String,
                required: true,
                index: true,
            },
            zipCode: String,
            coordinates: {
                latitude: {
                    type: Number,
                    required: true,
                },
                longitude: {
                    type: Number,
                    required: true,
                },
            },
        },
        // Contact Information
        contact: {
            phone: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
            website: String,
            emergencyPhone: String,
        },
        // Treatments & Specializations
        treatments: [
            {
                name: {
                    type: String,
                    required: true,
                },
                category: {
                    type: String,
                    required: true,
                }, // 'cardiology', 'orthopedics', 'oncology', etc.
                description: String,
                pricing: {
                    min: Number,
                    max: Number,
                    currency: {
                        type: String,
                        default: 'USD',
                    },
                },
                duration: String, // '3-5 days', '2 weeks', etc.
                successRate: Number, // Percentage
                availableDoctors: [
                    {
                        name: String,
                        qualification: String,
                        experience: Number, // years
                        specialization: String,
                        image: String,
                    },
                ],
            },
        ],
        // Accreditation & Verification
        accreditation: {
            certifications: [
                {
                    name: String,
                    issuedBy: String,
                    issuedDate: Date,
                    expiryDate: Date,
                    certificateUrl: String,
                },
            ],
            licenses: [
                {
                    licenseNumber: String,
                    issuedBy: String,
                    issuedDate: Date,
                    expiryDate: Date,
                },
            ],
            // Blockchain verification
            blockchainHash: String, // Hash of accreditation data stored on blockchain
            blockchainVerified: {
                type: Boolean,
                default: false,
            },
            verificationDate: Date,
        },
        // Ratings & Reviews
        ratings: {
            overall: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            totalReviews: {
                type: Number,
                default: 0,
            },
            breakdown: {
                facilities: { type: Number, default: 0 },
                doctors: { type: Number, default: 0 },
                staff: { type: Number, default: 0 },
                cleanliness: { type: Number, default: 0 },
                valueForMoney: { type: Number, default: 0 },
            },
        },
        reviews: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                rating: Number,
                comment: String,
                treatment: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // Facilities & Amenities
        facilities: [String], // ['ICU', 'Emergency', 'Pharmacy', 'Lab', etc.]
        amenities: [String], // ['WiFi', 'Parking', 'Cafeteria', etc.]
        // Images
        images: [
            {
                url: String,
                caption: String,
                isPrimary: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        // Packages
        packages: [
            {
                name: String,
                description: String,
                includes: [String],
                price: Number,
                currency: {
                    type: String,
                    default: 'USD',
                },
                duration: String,
            },
        ],
        // Availability
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
hospitalSchema.index({ 'location.city': 1, 'location.country': 1 });
hospitalSchema.index({ 'treatments.category': 1 });
hospitalSchema.index({ 'ratings.overall': -1 });
hospitalSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;
