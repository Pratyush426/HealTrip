import express from 'express';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const router = express.Router();

// ML service base URLs
const ML_HOTELS_URL = process.env.ML_HOTELS_URL || 'http://localhost:8000';
const ML_HOSPITALS_URL = process.env.ML_HOSPITALS_URL || 'http://localhost:8001';
const ML_FLIGHTS_URL = process.env.ML_FLIGHTS_URL || 'http://localhost:8002';

/**
 * Generic proxy helper — forwards request to ML service
 */
const proxyGet = async (targetUrl, res, serviceName) => {
    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            return errorResponse(res, response.status, `${serviceName} returned an error`);
        }
        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        console.error(`[ML Proxy] ${serviceName} error:`, err.message);
        return errorResponse(res, 503, `${serviceName} is not available. Make sure Python ML services are running.`);
    }
};

const proxyPost = async (targetUrl, body, res, serviceName) => {
    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            return errorResponse(res, response.status, `${serviceName} returned an error`);
        }
        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        console.error(`[ML Proxy] ${serviceName} error:`, err.message);
        return errorResponse(res, 503, `${serviceName} is not available.`);
    }
};

// ─── HOTELS ─────────────────────────────────────────────────────────────────

/**
 * GET /api/ml/hotels?location=Mumbai&budget=5000&stars=3
 * Proxy to hotels ML service /recommend
 */
router.get('/hotels', async (req, res) => {
    const params = new URLSearchParams(req.query).toString();
    await proxyGet(`${ML_HOTELS_URL}/recommend?${params}`, res, 'Hotels ML');
});

/**
 * POST /api/ml/hotels/predict-price
 * Proxy to hotels ML service /predict-price
 */
router.post('/hotels/predict-price', async (req, res) => {
    await proxyPost(`${ML_HOTELS_URL}/predict-price`, req.body, res, 'Hotels ML (price prediction)');
});

// ─── HOSPITALS ───────────────────────────────────────────────────────────────

/**
 * GET /api/ml/hospitals?city=Bangalore
 * Proxy to hospitals ML service /hospitals-by-city
 */
router.get('/hospitals', async (req, res) => {
    const { city } = req.query;
    if (!city) return errorResponse(res, 400, 'city query param is required');
    await proxyGet(`${ML_HOSPITALS_URL}/hospitals-by-city?city=${encodeURIComponent(city)}`, res, 'Hospitals ML');
});

/**
 * GET /api/ml/hospitals/top?disease=diabetes
 * Proxy to hospitals ML /top-hospitals
 */
router.get('/hospitals/top', async (req, res) => {
    const { disease } = req.query;
    if (!disease) return errorResponse(res, 400, 'disease query param is required');
    await proxyGet(`${ML_HOSPITALS_URL}/top-hospitals?disease=${encodeURIComponent(disease)}`, res, 'Hospitals ML');
});

/**
 * GET /api/ml/hospitals/health
 * Check if hospitals ML service is online
 */
router.get('/hospitals/health', async (req, res) => {
    await proxyGet(`${ML_HOSPITALS_URL}/health`, res, 'Hospitals ML');
});

// ─── FLIGHTS ─────────────────────────────────────────────────────────────────

/**
 * GET /api/ml/flights?origin=Delhi&destination=Bangalore&budget=10000
 * Proxy to flights ML service /recommend-flights
 */
router.get('/flights', async (req, res) => {
    const { origin, destination, budget } = req.query;
    if (!origin || !destination) return errorResponse(res, 400, 'origin and destination are required');
    const params = new URLSearchParams({ origin, destination, ...(budget && { budget }) }).toString();
    await proxyGet(`${ML_FLIGHTS_URL}/recommend-flights?${params}`, res, 'Flights ML');
});

/**
 * POST /api/ml/flights/predict-price
 * Proxy to flights ML /predict-flight-price
 */
router.post('/flights/predict-price', async (req, res) => {
    await proxyPost(`${ML_FLIGHTS_URL}/predict-flight-price`, req.body, res, 'Flights ML (price prediction)');
});

// ─── DISEASE DETECTION ───────────────────────────────────────────────────────

/**
 * GET /api/ml/health
 * Check all 3 ML services at once
 */
router.get('/health', async (req, res) => {
    const checkService = async (url, name) => {
        try {
            const r = await fetch(`${url}/health`);
            const d = await r.json();
            return { service: name, status: 'online', ...d };
        } catch {
            return { service: name, status: 'offline' };
        }
    };

    const [hotels, hospitals, flights] = await Promise.all([
        checkService(ML_HOTELS_URL, 'hotels'),
        checkService(ML_HOSPITALS_URL, 'hospitals'),
        checkService(ML_FLIGHTS_URL, 'flights'),
    ]);

    res.json({ hotels, hospitals, flights });
});

export default router;
