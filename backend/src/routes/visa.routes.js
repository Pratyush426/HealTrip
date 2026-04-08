import express from 'express';
import { verifyToken } from '../utils/verifyToken.js';
import {
    generateVisaLetter,
    getVisaLetter,
    getUserVisaLetters,
    updateVisaLetterStatus,
    regenerateVisaLetter,
    deleteVisaLetter,
    checkPremiumStatus,
    initiatePremiumPurchase,
} from '../controllers/visa.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * Visa Letter Routes
 */

// Premium feature status
router.get('/premium/status', checkPremiumStatus);
router.post('/premium/purchase', initiatePremiumPurchase);

// Generate new visa letter
router.post('/generate', generateVisaLetter);

// Get user's visa letters
router.get('/user/all', getUserVisaLetters);

// Get specific visa letter
router.get('/:visaRequestId', getVisaLetter);

// Update visa letter status
router.put('/:visaRequestId/status', updateVisaLetterStatus);

// Regenerate visa letter (new version)
router.post('/:visaRequestId/regenerate', regenerateVisaLetter);

// Delete visa letter
router.delete('/:visaRequestId', deleteVisaLetter);

export default router;
