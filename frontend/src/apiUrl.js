const isProduction = process.env.NODE_ENV === 'production';

// In production, we assume the backend serves the frontend from the same origin
// In development, we default to localhost:5000
const BACKEND_URL = isProduction 
  ? '' // Relative path
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

const API_BASE_URL = `${BACKEND_URL}/api`;

export { BACKEND_URL, API_BASE_URL };
