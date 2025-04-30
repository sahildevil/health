import axios from 'axios';


// Base URL for API calls
const API_URL = 'http://192.168.1.15:5000/api';

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

    if (!error.response) {
      return Promise.reject({
        message: 'Network error - check your connection and make sure the server is running',
      });
    }

    return Promise.reject(error.response.data || { message: 'An error occurred with the request' });
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
      console.log('Attempting to create event with data:', eventData);
      
      // Use the API to send to backend, not directly to Supabase
      const response = await api.post('/events', eventData);
      console.log('Event created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  },

  // Get all events
  getAllEvents: async () => {
    try {
      const response = await api.get("/events"); // Call the backend API
      return response.data;
    } catch (error) {
      console.error("Get all events error:", error);
      throw error;
    }
  },

  // Get events for current user
  getMyEvents: async () => {
    try {
      const response = await api.get('/events/my-events');
      return response.data;
    } catch (error) {
      console.error('Get my events error:', error);
      throw error;
    }
  },

  // Get ongoing events
  getOngoingEvents: async () => {
    try {
      const response = await api.get('/events/ongoing');
      return response.data;
    } catch (error) {
      console.error('Get ongoing events error:', error);
      throw error;
    }
  },

  // Get recommended events (you may need to create a new endpoint for this)
  getRecommendedEvents: async () => {
    try {
      // This is a placeholder - You might want to create a dedicated endpoint
      const response = await api.get('/events?recommended=true');
      return response.data;
    } catch (error) {
      console.error('Get recommended events error:', error);
      throw error;
    }
  },

  // Get events the user is registered for
  getRegisteredEvents: async () => {
    try {
      const response = await api.get('/events/registered');
      return response.data;
    } catch (error) {
      console.error('Get registered events error:', error);
      throw error;
    }
  },

  // Get pending events (admin only)
  getPendingEvents: async () => {
    try {
      const response = await api.get('/events/pending');
      return response.data;
    } catch (error) {
      console.error('Get pending events error:', error);
      throw error;
    }
  },

  // Get event by ID
  getEventById: async eventId => {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Get event details error:', error);
      throw error;
    }
  },

  // Approve an event (admin only)
  approveEvent: async (eventId, notes = '') => {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    try {
      const response = await api.put(`/admin/events/${eventId}/approve`, { notes });
      return response.data;
    } catch (error) {
      console.error('Approve event error:', error);
      throw error;
    }
  },

  // Reject an event (admin only)
  rejectEvent: async (eventId, notes = '') => {
    try {
      const response = await api.put(`/events/${eventId}/reject`, {notes});
      return response.data;
    } catch (error) {
      console.error('Reject event error:', error);
      throw error;
    }
  },

  // Delete an event
  deleteEvent: async eventId => {
    try {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  },

  // Register for an event
  registerForEvent: async eventId => {
    try {
      const response = await api.post(`/events/${eventId}/register`);
      return response.data;
    } catch (error) {
      console.error('Event registration error:', error);
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
