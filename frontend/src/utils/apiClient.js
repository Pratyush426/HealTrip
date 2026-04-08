import { API_BASE_URL } from '../apiUrl';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Hospital APIs
    async searchHospitals(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/hospitals/search?${queryString}`);
    }

    async getHospitalById(id) {
        return this.request(`/hospitals/${id}`);
    }

    // Hotel APIs
    async searchHotels(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/hotels/search?${queryString}`);
    }

    async getHotelById(id) {
        return this.request(`/hotels/${id}`);
    }

    // Flight APIs
    async searchFlights(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/flights/search?${queryString}`);
    }

    async getFlightById(id) {
        return this.request(`/flights/${id}`);
    }

    // Cab APIs
    async searchCabs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/cabs/search?${queryString}`);
    }

    async getCabById(id) {
        return this.request(`/cabs/${id}`);
    }

    // Wellness APIs
    async getWellnessSessions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/wellness?${queryString}`);
    }

    // Diagnosis APIs
    async getDiagnosis(data) {
        return this.request('/diagnosis/analyze', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Payment APIs
    async createBooking(data) {
        return this.request('/payment/create-booking', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

export default new ApiClient();
