import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import hotelRoutes from './routes/hotel.routes.js';
import diagnosisRoutes from './routes/diagnosis.routes.js';
import wellnessRoutes from './routes/wellness.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import flightRoutes from './routes/flight.routes.js';


import aiRoutes from './routes/ai.routes.js';
import chatRoutes from './routes/chat.routes.js';
import mlRoutes from './routes/ml.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'HealTrip Backend API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ml', mlRoutes);

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../../frontend/build');
    app.use(express.static(buildPath));
    
    app.get('*', (req, res, next) => {
        // Only handle HTML requests (let API routes handle their own 404s)
        if (req.accepts('html') && !req.path.startsWith('/api')) {
            return res.sendFile(path.join(buildPath, 'index.html'));
        }
        next();
    });
}

// 404 handler for API routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        errors: err.errors || [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start server
        const server = app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log(`🚀 HealTrip Backend Server`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Server running on port ${PORT}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
            console.log('='.repeat(50));
            console.log('\n📋 Available Routes:');
            console.log('  - /api/auth          (Authentication & User Profile)');
            console.log('  - /api/hospitals     (Hospital Discovery & Search)');
            console.log('  - /api/hotels        (Hotel Search & Booking)');
            console.log('  - /api/diagnosis     (AI Recommendations & Cost Estimation)');
            console.log('  - /api/wellness      (Yoga Shivir & Wellness Sessions)');
            console.log('  - /api/payment       (Payment & Booking Management)');
            console.log('  - /api/flights       (Flight Search & Booking)');
            console.log('  - /api/ml            (ML Proxy API)');
            console.log('='.repeat(50));
        });

        // Catch port already in use cleanly
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Port ${PORT} is already taken!`);
                console.error(`✅ Good news: The HealTrip backend is ALREADY RUNNING in the background.`);
                console.error(`👉 If you really want to restart it, use: npm run dev:safe\n`);
                process.exit(0);
            } else {
                console.error('❌ Server error:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
