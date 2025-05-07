import axios from 'axios';

// Base URL for API calls
// const API_URL = 'https://health-server-fawn.vercel.app/api';
const API_URL = 'http://192.168.1.9:5000/api';
// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 50000, // 10 seconds timeout
});

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error:', error);

    if (!error.response) {
      return Promise.reject({
        message:
          'Network error - check your connection and make sure the server is running',
      });
    }

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
      // Make sure all fields from the form are included
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
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },

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
  // verifyDoctor: async doctorId => {
  //   try {
  //     const response = await api.put(`/admin/doctors/${doctorId}/verify`);
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

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
  // getDoctorDetails: async doctorId => {
  //   try {
  //     const response = await api.get(`/admin/doctors/${doctorId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

  // Get doctor documents
  // getDoctorDocuments: async doctorId => {
  //   try {
  //     const response = await api.get(`/admin/doctors/${doctorId}/documents`);
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

  // Verify a document
  // verifyDocument: async (doctorId, documentId, notes = '') => {
  //   try {
  //     const response = await api.put(
  //       `/admin/doctors/${doctorId}/documents/${documentId}/verify`,
  //       {notes},
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

  // Reject a document
  // rejectDocument: async (doctorId, documentId, notes = '') => {
  //   try {
  //     const response = await api.put(
  //       `/admin/doctors/${doctorId}/documents/${documentId}/reject`,
  //       {notes},
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },
  // Get pending doctors that need verification
  getPendingDoctors: async () => {
    try {
      const response = await api.get('/admin/doctors/pending');
      return response.data;
    } catch (error) {
      console.error('Get pending doctors error:', error);
      throw error;
    }
  },

  // Get doctor details by ID
  getDoctorDetails: async doctorId => {
    try {
      const response = await api.get(`/admin/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Get doctor details error:', error);
      throw error;
    }
  },

  // Get doctor documents by doctor ID
  getDoctorDocuments: async doctorId => {
    try {
      const response = await api.get(`/admin/doctors/${doctorId}/documents`);
      return response.data;
    } catch (error) {
      console.error('Get doctor documents error:', error);
      throw error;
    }
  },

  // Verify a doctor
  verifyDoctor: async (doctorId, notes = '') => {
    try {
      const response = await api.put(`/admin/doctors/${doctorId}/verify`, {
        notes,
      });
      return response.data;
    } catch (error) {
      console.error('Verify doctor error:', error);
      throw error;
    }
  },

  // Reject a doctor
  rejectDoctor: async (doctorId, notes) => {
    try {
      const response = await api.put(`/admin/doctors/${doctorId}/reject`, {
        notes,
      });
      return response.data;
    } catch (error) {
      console.error('Reject doctor error:', error);
      throw error;
    }
  },

  // Verify a specific document
  verifyDocument: async (doctorId, documentId, notes = '') => {
    try {
      const response = await api.put(
        `/admin/doctors/${doctorId}/documents/${documentId}/verify`,
        {notes},
      );
      return response.data;
    } catch (error) {
      console.error('Verify document error:', error);
      throw error;
    }
  },

  // Reject a specific document
  rejectDocument: async (doctorId, documentId, notes) => {
    try {
      const response = await api.put(
        `/admin/doctors/${doctorId}/documents/${documentId}/reject`,
        {notes},
      );
      return response.data;
    } catch (error) {
      console.error('Reject document error:', error);
      throw error;
    }
  },
  // Get all pharma representatives
  getPharmaReps: async () => {
    try {
      const response = await api.get('/admin/pharma');
      return response.data;
    } catch (error) {
      console.error('Get pharma representatives error:', error);
      throw error;
    }
  },

  // Get pharma details by ID
  getPharmaDetails: async pharmaId => {
    try {
      console.log('Fetching pharma details for ID:', pharmaId);
      const response = await api.get(`/admin/pharma/${pharmaId}`);
      return response.data;
    } catch (error) {
      console.error(`Get pharma details error for ID ${pharmaId}:`, error);
      throw error;
    }
  },

  // Delete a pharma representative
  deletePharma: async pharmaId => {
    try {
      const response = await api.delete(`/admin/pharma/${pharmaId}`);
      return response.data;
    } catch (error) {
      console.error('Delete pharma representative error:', error);
      throw error;
    }
  },

  // Verify a pharma representative
  verifyPharma: async (pharmaId, notes = '') => {
    try {
      const response = await api.put(`/admin/pharma/${pharmaId}/verify`, {
        notes,
      });
      return response.data;
    } catch (error) {
      console.error('Verify pharma representative error:', error);
      throw error;
    }
  },

  // Add these methods to adminService for event management
  getAllEvents: async () => {
    try {
      const response = await api.get('/admin/events');
      return response.data;
    } catch (error) {
      console.error('Get all events error:', error);
      throw error;
    }
  },

  getEventRegistrations: async eventId => {
    try {
      const response = await api.get(`/admin/events/${eventId}/registrations`);
      return response.data;
    } catch (error) {
      console.error('Get event registrations error:', error);
      throw error;
    }
  },

  updateEventAfterApproval: async (eventId, eventData) => {
    try {
      const response = await api.put(
        `/admin/events/${eventId}/update`,
        eventData,
      );
      return response.data;
    } catch (error) {
      console.error('Admin update event error:', error);
      throw error;
    }
  },

  cancelEventRegistration: async (eventId, userId) => {
    try {
      const response = await api.delete(
        `/admin/events/${eventId}/registrations/${userId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Cancel registration error:', error);
      throw error;
    }
  },

  exportEventRegistrations: async eventId => {
    try {
      const response = await api.get(
        `/admin/events/${eventId}/registrations/export`,
      );
      return response.data;
    } catch (error) {
      console.error('Export registrations error:', error);
      throw error;
    }
  },

  getEventById: async eventId => {
    try {
      const response = await api.get(`/admin/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Get event details error:', error);
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

  registerForEvent: async (eventId, registrationData) => {
    try {
      const response = await axios.post(
        `/events/${eventId}/register`,
        registrationData,
      );
      return response.data;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  // Get all events
  getAllEvents: async () => {
    try {
      const response = await api.get('/events'); // Call the backend API
      return response.data;
    } catch (error) {
      console.error('Get all events error:', error);
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
      const response = await api.put(`/admin/events/${eventId}/approve`, {
        notes,
      });
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

  // updateEvent: async (eventId, eventData) => {
  //   try {
  //     const response = await api.put(`/events/${eventId}`, eventData);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Update event error:', error);
  //     throw error;
  //   }
  // },

  updateEvent: async (eventId, eventData) => {
    try {
      console.log(
        'Updating event with data:',
        JSON.stringify({
          ...eventData,
          brochure: eventData.brochure,
        }),
      );

      const response = await api.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  },

  // Approve event with additional data
  approveEventWithChanges: async (eventId, eventData) => {
    try {
      // First update the event
      await api.put(`/events/${eventId}`, eventData);

      // Then approve it
      const response = await api.put(`/admin/events/${eventId}/approve`, {
        notes: 'Event edited and approved by admin',
      });

      return response.data;
    } catch (error) {
      console.error('Approve event with changes error:', error);
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

  // Get event brochure
  getEventBrochure: async eventId => {
    try {
      const response = await api.get(`/events/${eventId}/brochure`);
      return response.data;
    } catch (error) {
      // If 404, it means no brochure found, which is not an error
      if (error.response && error.response.status === 404) {
        return null;
      }
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
