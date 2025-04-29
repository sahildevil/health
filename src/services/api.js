import axios from 'axios';

// Base URL for API calls - adjust based on your development environment
// For Android Emulator to access localhost on host machine:
const API_URL = 'http://192.168.1.15:5000/api';

// For iOS Simulator:
// const API_URL = 'http://localhost:5000/api';

// For physical devices testing, use your computer's IP address:
// const API_URL = 'http://192.168.X.X:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error:', error);

    // Network error
    if (!error.response) {
      return Promise.reject({
        message:
          'Network error - check your connection and make sure the server is running',
      });
    }

    // Return error data if available
    return Promise.reject(
      error.response.data || {message: 'An error occurred with the request'},
    );
  },
);

// Authentication services
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {email, password});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  signup: async userData => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add auth token to requests
  setAuthToken: token => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },
};

// Admin services
export const adminService = {
  // Get all doctors
  getDoctors: async () => {
    try {
      const response = await api.get('/admin/doctors');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify a doctor
  verifyDoctor: async doctorId => {
    try {
      const response = await api.put(`/admin/doctors/${doctorId}/verify`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a doctor
  deleteDoctor: async doctorId => {
    try {
      const response = await api.delete(`/admin/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get doctor details
  getDoctorDetails: async doctorId => {
    try {
      const response = await api.get(`/admin/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get doctor documents
  getDoctorDocuments: async doctorId => {
    try {
      const response = await api.get(`/admin/doctors/${doctorId}/documents`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify a document
  verifyDocument: async (doctorId, documentId, notes = '') => {
    try {
      const response = await api.put(
        `/admin/doctors/${doctorId}/documents/${documentId}/verify`,
        {notes},
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reject a document
  rejectDocument: async (doctorId, documentId, notes = '') => {
    try {
      const response = await api.put(
        `/admin/doctors/${doctorId}/documents/${documentId}/reject`,
        {notes},
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Event services
export const eventService = {
  // Create a new event
  createEvent: async eventData => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get approved events or own events
  getEvents: async () => {
    try {
      const response = await api.get('/events');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get events created by current user
  getMyEvents: async () => {
    try {
      const response = await api.get('/events/my-events');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get pending events (admin only)
  getPendingEvents: async () => {
    try {
      const response = await api.get('/events/pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getRegisteredEvents: async () => {
    try {
      const response = await api.get('/events/registered');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Approve an event (admin only)
  approveEvent: async (eventId, notes = '') => {
    try {
      const response = await api.put(`/events/${eventId}/approve`, {notes});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reject an event (admin only)
  rejectEvent: async (eventId, notes = '') => {
    try {
      const response = await api.put(`/events/${eventId}/reject`, {notes});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete an event
  deleteEvent: async eventId => {
    try {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Register for an event
  registerForEvent: async eventId => {
    try {
      const response = await api.post(`/events/${eventId}/register`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get event details
  getEventDetails: async eventId => {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User services
export const userService = {
  // Get current user's documents
  getMyDocuments: async () => {
    try {
      const response = await api.get('/users/my-documents');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload new documents
  uploadDocuments: async documents => {
    try {
      const response = await api.post('/users/documents', {documents});
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
