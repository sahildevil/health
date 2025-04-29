import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {useAuth} from '../context/AuthContext';

// Import screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminSignUpScreen from '../screens/AdminSignUpScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminProfileScreen from '../screens/AdminProfileScreen';
import EventApprovalScreen from '../screens/EventApprovalScreen';
import DoctorListScreen from '../screens/DoctorListScreen';
import DoctorDetailsScreen from '../screens/DoctorDetailsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';

// Import regular user flow
import BottomTabNavigator from './BottomTabNavigator';
import Profile from '../screens/Profile';
import CreateConferenceScreen from '../screens/CreateConferenceScreen';
import RegisteredEventsScreen from '../screens/RegisteredEventsScreen';
import MyEventsScreen from '../screens/MyEventsScreen';

const Stack = createStackNavigator();
const AdminStack = createStackNavigator();

// Admin Navigation Stack
const AdminNavigator = () => {
  return (
    <AdminStack.Navigator screenOptions={{headerShown: false}}>
      <AdminStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
      />
      <AdminStack.Screen name="AdminProfile" component={AdminProfileScreen} />
      <AdminStack.Screen name="EventApproval" component={EventApprovalScreen} />
      <AdminStack.Screen name="EventDetails" component={EventDetailsScreen} />
      <AdminStack.Screen name="DoctorList" component={DoctorListScreen} />
      <AdminStack.Screen name="DoctorDetails" component={DoctorDetailsScreen} />
    </AdminStack.Navigator>
  );
};

const AppNavigator = () => {
  const {isAuthenticated, loading, user} = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7af5" />
      </View>
    );
  }

  // Check if the authenticated user is an admin
  const isAdmin = user?.role === 'admin';

  return (
    <Stack.Navigator
      initialRouteName={
        isAuthenticated ? (isAdmin ? 'AdminFlow' : 'MainApp') : 'Landing'
      }
      screenOptions={{
        headerShown: false,
      }}>
      {isAuthenticated ? (
        isAdmin ? (
          <Stack.Screen name="AdminFlow" component={AdminNavigator} />
        ) : (
          <>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen
              name="CreateConference"
              component={CreateConferenceScreen}
            />
            <Stack.Screen
              name="RegisteredEvents"
              component={RegisteredEventsScreen}
            />
            <Stack.Screen
              name="MyEvents"
              component={MyEventsScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="EventDetails"
              component={EventDetailsScreen}
              options={{headerShown: false}}
            />
          </>
        )
      ) : (
        // Not authenticated routes
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="AdminSignUp" component={AdminSignUpScreen} />
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
