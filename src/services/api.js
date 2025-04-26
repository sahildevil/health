// import axios from 'axios';

// // Base URL for API calls
// const API_URL = 'http://localhost:5000/api'; // Use 10.0.2.2 for Android emulator to connect to localhost
// // For iOS simulator, use 'http://localhost:5000/api'

// // Create axios instance
// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Authentication services
// export const authService = {
//   login: async (email, password) => {
//     try {
//       const response = await api.post('/auth/login', {email, password});
//       return response.data;
//     } catch (error) {
//       throw error.response?.data || {message: 'Network error occurred'};
//     }
//   },

//   signup: async userData => {
//     try {
//       const response = await api.post('/auth/signup', userData);
//       return response.data;
//     } catch (error) {
//       throw error.response?.data || {message: 'Network error occurred'};
//     }
//   },

//   // Add auth token to requests
//   setAuthToken: token => {
//     if (token) {
//       api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     } else {
//       delete api.defaults.headers.common['Authorization'];
//     }
//   },
// };

// export default api;
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
  (response) => response,
  (error) => {
    console.log('API Error:', error);
    
    // Network error
    if (!error.response) {
      return Promise.reject({
        message: 'Network error - check your connection and make sure the server is running',
      });
    }
    
    // Return error data if available
    return Promise.reject(
      error.response.data || { message: 'An error occurred with the request' }
    );
  }
);

// Authentication services
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add auth token to requests
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }
};

export default api;
