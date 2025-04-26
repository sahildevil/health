import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {useAuth} from '../context/AuthContext';

// Import screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import BottomTabNavigator from './BottomTabNavigator';
import Profile from '../screens/Profile';
import CreateConferenceScreen from '../screens/CreateConferenceScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7af5" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'MainApp' : 'Landing'}
      screenOptions={{
        headerShown: false,
      }}>
      {isAuthenticated ? (
        // Authenticated routes
        <>
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen
            name="CreateConference"
            component={CreateConferenceScreen}
          />
        </>
      ) : (
        // Not authenticated routes
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
});

export default AppNavigator;
