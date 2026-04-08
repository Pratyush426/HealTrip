import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
    createPaymentOrder,
    verifyPayment,
    getBookingDetails,
    getUserBookings,
    cancelBooking,
    createPremiumPurchaseOrder,
    verifyPremiumPurchase,
} from '../controllers/payment.controller.js';

const router = express.Router();

/**
 * Payment Routes
 * Base path: /api/payment
 */

// All payment routes require authentication
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/booking/:id', authenticate, getBookingDetails);
router.get('/my-bookings', authenticate, getUserBookings);
router.post('/cancel/:id', authenticate, cancelBooking);

// Premium feature payment routes
router.post('/premium/create-order', authenticate, createPremiumPurchaseOrder);
router.post('/premium/verify', authenticate, verifyPremiumPurchase);

export default router;
