import express from 'express';
import { handleChat, getChatHistory, generateReport, deleteChatHistory } from '../controllers/chat.controller.js';

const router = express.Router();

// Get chat history and medical record
router.get('/history/:userId', getChatHistory);

// Delete chat history
router.delete('/history/:userId', deleteChatHistory);

// Send message (saves to DB and gets AI reply)
router.post('/message', handleChat);

// Update medical record directly
import { updateMedicalRecord } from '../controllers/chat.controller.js';
router.post('/update-record', updateMedicalRecord);

// Generate medical report
router.post('/report', generateReport);

export default router;
