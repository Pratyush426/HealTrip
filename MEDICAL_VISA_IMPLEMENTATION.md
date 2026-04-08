# Medical Visa Automation - Implementation Guide

## Feature Overview

The **Medical Visa Automation** feature is a premium HealTrip service that automatically generates professional "Medical Visa Request Letters" using documents and medical information uploaded by users. It's a premium feature that users must purchase before accessing.

**Premium Feature Name:** `medical_visa_letter`  
**Cost:** $99 USD (one-time, lifetime access)

---

## Architecture Overview

### New Components Created

#### 1. **Models**
- **[MedicalVisaRequest.js](backend/src/models/MedicalVisaRequest.js)** - Stores generated visa letters and their status

#### 2. **Controllers**
- **[visa.controller.js](backend/src/controllers/visa.controller.js)** - Handles visa letter generation, retrieval, and management
- **[payment.controller.js](backend/src/controllers/payment.controller.js)** (Updated) - Added premium feature purchase endpoints

#### 3. **Routes**
- **[visa.routes.js](backend/src/routes/visa.routes.js)** - Visa letter API endpoints
- **[payment.routes.js](backend/src/routes/payment.routes.js)** (Updated) - Premium feature payment endpoints

#### 4. **Utilities**
- **[visaLetterGenerator.js](backend/src/utils/visaLetterGenerator.js)** - PDF generation and letter content creation

#### 5. **Models Updated**
- **[User.js](backend/src/models/User.js)** (Updated) - Added `premiumFeatures` and `visaLetters` fields

#### 6. **Server**
- **[server.js](backend/src/server.js)** (Updated) - Registered visa routes

---

## API Endpoints

### 1. **Check Premium Status**
```
GET /api/visa/premium/status
```
**Headers:** Authorization: Bearer {token}

**Response:**
```json
{
    "success": true,
    "message": "Premium status retrieved",
    "data": {
        "hasAccess": true,
        "feature": {
            "featureName": "medical_visa_letter",
            "purchasedAt": "2024-04-08T10:30:00Z",
            "expiresAt": null,
            "status": "active",
            "renewalCount": 0
        },
        "cost": 99,
        "currency": "USD"
    }
}
```

### 2. **Initiate Premium Purchase**
```
POST /api/visa/premium/purchase
```
**Headers:** Authorization: Bearer {token}

**Body:**
```json
{
    "paymentMethod": "razorpay" // or "stripe"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Ready to process premium purchase",
    "data": {
        "featureName": "medical_visa_letter",
        "amount": 99,
        "currency": "USD",
        "paymentMethod": "razorpay",
        "userId": "user_id_here"
    }
}
```

### 3. **Create Payment Order for Premium Feature**
```
POST /api/payment/premium/create-order
```
**Headers:** Authorization: Bearer {token}

**Body:**
```json
{
    "featureName": "medical_visa_letter",
    "paymentMethod": "razorpay"
}
```

### 4. **Verify Premium Purchase**
```
POST /api/payment/premium/verify
```
**Headers:** Authorization: Bearer {token}

**Body:**
```json
{
    "featureName": "medical_visa_letter",
    "paymentId": "pay_xxx",
    "signature": "signature_xxx",
    "paymentMethod": "razorpay"
}
```

### 5. **Generate Visa Letter**
```
POST /api/visa/generate
```
**Headers:** Authorization: Bearer {token}

**Body:**
```json
{
    "bookingId": "booking_id_optional",
    "treatmentDetails": {
        "hospital": "Apollo Hospital",
        "doctor": "Dr. Smith",
        "treatment": "Heart Surgery",
        "estimatedDuration": "3-4 weeks",
        "estimatedCost": 15000
    },
    "visaCountry": "Thailand",
    "visaType": "medical"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Medical visa letter generated successfully",
    "data": {
        "visaRequestId": "visa_req_xxx",
        "letterPdfUrl": "https://cloudinary_url/visa-letter.pdf",
        "status": "generated",
        "generatedAt": "2024-04-08T10:35:00Z"
    }
}
```

### 6. **Get Visa Letter**
```
GET /api/visa/:visaRequestId
```
**Headers:** Authorization: Bearer {token}

**Response:** Returns complete MedicalVisaRequest document with content and PDF URL

### 7. **Get All User Visa Letters**
```
GET /api/visa/user/all?status=generated&sortBy=createdAt&order=desc&limit=10&page=1
```
**Headers:** Authorization: Bearer {token}

**Query Parameters:**
- `status` - Filter by status (draft, generated, verified, submitted, approved, rejected)
- `sortBy` - Sort field (default: createdAt)
- `order` - Sort order (asc or desc)
- `limit` - Items per page (default: 10)
- `page` - Page number (default: 1)

### 8. **Update Visa Letter Status**
```
PUT /api/visa/:visaRequestId/status
```
**Headers:** Authorization: Bearer {token}

**Body:**
```json
{
    "status": "submitted",
    "notes": "Submitted to embassy on 2024-04-08"
}
```

### 9. **Regenerate Visa Letter**
```
POST /api/visa/:visaRequestId/regenerate
```
**Headers:** Authorization: Bearer {token}

**Body:**
```json
{
    "treatmentDetails": {
        "hospital": "New Hospital Name"
    },
    "changes": "Updated hospital information"
}
```

### 10. **Delete Visa Letter**
```
DELETE /api/visa/:visaRequestId
```
**Headers:** Authorization: Bearer {token}

---

## Workflow

### User Flow for Medical Visa Letter Generation

1. **User uploads medical documents**
   - Via diagnosis upload or medical profile sections
   - Supports: JPG, PNG, PDF (max 10MB)

2. **User checks premium access**
   - Call `GET /api/visa/premium/status`
   - If no access, show purchase option ($99)

3. **User purchases premium feature** (if needed)
   - Call `POST /api/payment/premium/create-order`
   - User completes payment
   - Call `POST /api/payment/premium/verify` with payment details
   - System activates premium feature for user

4. **User generates visa letter**
   - Call `POST /api/visa/generate` with medical info
   - System extracts data from uploaded documents
   - Generates professional PDF letter
   - Returns PDF URL

5. **User manages generated letters**
   - View all letters: `GET /api/visa/user/all`
   - Update status: `PUT /api/visa/:id/status`
   - Regenerate with updated info: `POST /api/visa/:id/regenerate`
   - Download PDF from letterPdfUrl

---

## How It Works

### Letter Generation Process

1. **Data Collection**
   - User's personal info (name, DOB, nationality)
   - Medical conditions, symptoms, allergies, blood type
   - Medications
   - Treatment details (hospital, doctor, type of treatment, duration, estimated cost)

2. **Content Generation**
   - Professional letter template is populated with user data
   - Markdown content is generated with all necessary sections:
     - Applicant Information
     - Medical Condition & Treatment Details
     - Treatment & Hospital Details
     - Purpose of Visit
     - Declaration
     - Supporting Documentation
     - Contact Information

3. **PDF Generation**
   - Markdown content is converted to professional PDF using PDFKit
   - Formatted with proper headers, sections, and styling
   - Includes page breaks and professional styling

4. **Cloud Storage**
   - PDF is uploaded to Cloudinary
   - Secure URL is stored in database
   - User can download or share the PDF

5. **Version Control**
   - Original PDF is preserved in versions history
   - Updates create new versions with change tracking
   - Users can reference previous versions

---

## Database Schema

### MedicalVisaRequest Collection

```javascript
{
    userId: ObjectId,           // Reference to User
    bookingId: ObjectId,        // Optional booking reference
    letterContent: String,       // Markdown/HTML content
    letterPdfUrl: String,       // Cloudinary PDF URL
    letterPdfPublicId: String,  // For Cloudinary deletion
    
    medicalInfo: {
        conditions: [String],
        symptoms: [String],
        medications: [String],
        allergies: [String],
        bloodGroup: String
    },
    
    supportingDocuments: [{
        fileName: String,
        url: String,
        type: String
    }],
    
    treatmentDetails: {
        hospital: String,
        doctor: String,
        treatment: String,
        estimatedDuration: String,
        estimatedCost: Number,
        currency: String
    },
    
    payment: {
        amount: Number,           // 99 USD
        currency: String,
        paymentStatus: String,    // completed, pending, failed
        transactionId: String,
        paidAt: Date
    },
    
    status: String,              // generated, verified, submitted, approved
    visaCountry: String,
    visaType: String,
    
    versions: [{
        version: Number,
        generatedAt: Date,
        changes: String,
        pdfUrl: String
    }],
    
    currentVersion: Number,
    notes: String,
    generatedAt: Date,
    submittedAt: Date,
    approvedAt: Date,
    timestamps: true
}
```

### User Model Updates

```javascript
{
    // ... existing fields ...
    
    premiumFeatures: [{
        featureName: String,           // medical_visa_letter
        purchasedAt: Date,
        expiresAt: Date,              // null = lifetime
        status: String,               // active, expired, cancelled
        renewalCount: Number
    }],
    
    visaLetters: [ObjectId]           // References to MedicalVisaRequest
}
```

---

## Dependencies

### Required Packages

The implementation uses the following packages (add to `backend/package.json`):

```json
{
    "pdfkit": "^0.13.0",
    "mongoose": "existing",
    "cloudinary": "existing",
    "express": "existing"
}
```

**Installation:**
```bash
cd backend
npm install pdfkit
```

---

## Security & Authorization

### Authentication
- All visa endpoints require authentication via `verifyToken` middleware
- Premium purchase requires valid payment verification

### Authorization
- Users can only access their own visa letters
- Users can only generate if they have active premium feature
- Payment transactions are validated before feature activation

### Data Privacy
- Medical information is encrypted in transit (HTTPS)
- PDFs are stored on Cloudinary with secure URLs
- Database records include user-scoped queries

---

## Error Handling

### Common Error Responses

**User doesn't have premium access:**
```json
{
    "success": false,
    "message": "Premium feature not activated. Please purchase the Medical Visa Letter feature.",
    "statusCode": 403,
    "data": {
        "featureName": "medical_visa_letter",
        "cost": 99,
        "currency": "USD"
    }
}
```

**Visa letter not found:**
```json
{
    "success": false,
    "message": "Visa letter not found",
    "statusCode": 404
}
```

**Unauthorized access:**
```json
{
    "success": false,
    "message": "Unauthorized to access this visa letter",
    "statusCode": 403
}
```

---

## Frontend Integration Examples

### React/Vue Component Flow

```javascript
// 1. Check if user has premium access
const checkPremiumAccess = async () => {
    const response = await fetch('/api/visa/premium/status', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

// 2. If no access, show purchase button
const purchasePremium = async () => {
    const response = await fetch('/api/payment/premium/create-order', {
        method: 'POST',
        body: JSON.stringify({
            featureName: 'medical_visa_letter',
            paymentMethod: 'razorpay'
        }),
        headers: { Authorization: `Bearer ${token}` }
    });
    // Open Razorpay/Stripe payment modal
};

// 3. Generate visa letter
const generateVisaCLetter = async (treatmentDetails) => {
    const response = await fetch('/api/visa/generate', {
        method: 'POST',
        body: JSON.stringify({
            treatmentDetails,
            visaCountry: 'Thailand',
            visaType: 'medical'
        }),
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

// 4. Download PDF
const downloadVisaPDF = (pdfUrl) => {
    window.open(pdfUrl, '_blank');
};
```

---

## Testing the Feature

### Manual Testing Checklist

```
[ ] 1. Check premium status endpoint
[ ] 2. Initiate premium purchase
[ ] 3. Complete payment (test with Razorpay/Stripe test credentials)
[ ] 4. Verify premium purchase activation
[ ] 5. Generate visa letter with valid data
[ ] 6. Verify PDF is generated and uploaded to Cloudinary
[ ] 7. List all visa letters for user
[ ] 8. Get specific visa letter details
[ ] 9. Update visa letter status
[ ] 10. Regenerate visa letter with updated info
[ ] 11. Delete visa letter
[ ] 12. Verify user can't access deleted letter
[ ] 13. Test unauthorized access attempts
[ ] 14. Test with missing medical information
```

### cURL Test Examples

```bash
# Check premium status
curl -X GET http://localhost:5000/api/visa/premium/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Initiate purchase
curl -X POST http://localhost:5000/api/payment/premium/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"featureName":"medical_visa_letter","paymentMethod":"razorpay"}'

# Generate visa letter
curl -X POST http://localhost:5000/api/visa/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "treatmentDetails": {
      "hospital": "Apollo Hospital",
      "doctor": "Dr. Smith",
      "treatment": "Surgery",
      "estimatedDuration": "3 weeks",
      "estimatedCost": 15000
    },
    "visaCountry": "Thailand",
    "visaType": "medical"
  }'
```

---

## Future Enhancements

1. **Template Customization**
   - Allow users to customize letter template
   - Multiple letter formats

2. **Multi-language Support**
   - Generate letters in different languages
   - Support for different visa requirements

3. **Automatic Status Tracking**
   - Integrate with Embassy/Visa tracking APIs
   - Send notifications on visa status updates

4. **Subscription Model**
   - Monthly/yearly subscription options
   - Batch letter generation discounts

5. **API Integration**
   - Direct visa application submission via APIs
   - Immigration authority integration

6. **Analytics**
   - Track letter generation statistics
   - Success rate tracking

---

## Support & Troubleshooting

### Issue: PDF not generating
**Solution:** Ensure PDFKit is installed: `npm install pdfkit`

### Issue: Cloudinary upload failing
**Solution:** Verify Cloudinary credentials in `.env`

### Issue: User can't access premium feature after payment
**Solution:** Verify payment verification endpoint is called and completes successfully

### Issue: Letter content missing medical information
**Solution:** Ensure user has completed medical profile and uploaded documents

---

## Summary

The Medical Visa Automation feature is now fully integrated into HealTrip:

✅ Models created for visa requests and premium features  
✅ Controller logic for generation, retrieval, and management  
✅ Routes configured and integrated with main server  
✅ Payment integration for premium feature sales  
✅ PDF generation utility with professional formatting  
✅ Full error handling and authorization checks  
✅ Version control for regenerating letters  

**The feature is ready for frontend integration and user testing.**
