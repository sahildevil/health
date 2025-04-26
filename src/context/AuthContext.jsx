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

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(email, password);

      // Store user info and token in AsyncStorage
      await AsyncStorage.setItem('@user', JSON.stringify(response.user));
      await AsyncStorage.setItem('@token', response.token);

      // Set auth header for future API calls
      authService.setAuthToken(response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
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
