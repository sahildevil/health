import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authService} from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in (token exists in AsyncStorage)
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@user');
        const storedToken = await AsyncStorage.getItem('@token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          authService.setAuthToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to load authentication data', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Modified login function to handle role-specific login
  const login = async (email, password, requiredRole = null) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.login(email, password);

      // Check if user has required role if specified
      if (requiredRole && response.user.role !== requiredRole) {
        throw {
          message: `Access denied. You don't have ${requiredRole} privileges.`,
        };
      }

      // Check if email is verified
      if (!response.user.email_verified && response.user.role !== 'admin') {
        throw {
          needsVerification: true,
          message: 'Please verify your email before logging in.',
          email: email,
        };
      }

      // Set auth header for future API calls
      authService.setAuthToken(response.token);
      setUser(response.user);
      return response; // Return the response for additional handling
    } catch (error) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Modified signup to handle admin signup
  const signup = async userData => {
    try {
      setError(null);
      setLoading(true);
      await authService.signup(userData);
    } catch (error) {
      setError(error.message || 'Signup failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      await AsyncStorage.removeItem('@token');
      authService.setAuthToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // Add this new function to your AuthProvider component
  const resendVerification = async email => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.resendVerificationEmail(email);
      return response;
    } catch (error) {
      setError(error.message || 'Failed to resend verification email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        resendVerification, // Add this line
        isAuthenticated: !!user,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for easy auth context consumption
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
