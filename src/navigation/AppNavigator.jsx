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
import ChatScreen from '../screens/ChatScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
// Import regular user flow
import BottomTabNavigator from './BottomTabNavigator';
import Profile from '../screens/Profile';
import CreateConferenceScreen from '../screens/CreateConferenceScreen';
import RegisteredEventsScreen from '../screens/RegisteredEventsScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import UploadDocumentsScreen from '../screens/UploadDocumentsScreen';
import EventRegistrationScreen from '../screens/EventRegistrationScreen';
import EditEventScreen from '../screens/EditEventScreen';
import UserVerificationScreen from '../screens/UserVerificationScreen';
import DoctorManagementScreen from '../screens/DoctorManagementScreen';
import PharmaManagementScreen from '../screens/PharmaManagementScreen';
import PharmaDetailsScreen from '../screens/PharmaDetailsScreen';
import AdminEditEventScreen from '../screens/admin/AdminEditEventScreen';
import AdminEventManagementScreen from '../screens/admin/AdminEventManagementScreen';
import EventRegistrationsScreen from '../screens/admin/EventRegistrationsScreen';
import AdminEventDetails from '../screens/admin/AdminEventDetails';
import CreatePrivateMeetingScreen from '../screens/CreatePrivateMeetingScreen';
import MyMeetingsScreen from '../screens/MyMeetingsScreen';
import MeetingDetailsScreen from '../screens/MeetingDetailsScreen';
import MeetingInvitationsScreen from '../screens/MeetingInvitationsScreen';
import AdminPrivateMeetingsScreen from '../screens/admin/AdminPrivateMeetingsScreen';
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
      <Stack.Screen
        name="DoctorManagement"
        component={DoctorManagementScreen}
      />
      <AdminStack.Screen name="DoctorList" component={DoctorListScreen} />
      <AdminStack.Screen name="DoctorDetails" component={DoctorDetailsScreen} />
      <Stack.Screen
        name="UserVerification"
        component={UserVerificationScreen}
      />
      <Stack.Screen
        name="PharmaManagement"
        component={PharmaManagementScreen}
      />
      <Stack.Screen name="PharmaDetails" component={PharmaDetailsScreen} />
      <Stack.Screen
        name="AdminEditEvent"
        component={AdminEditEventScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AdminEventManagement"
        component={AdminEventManagementScreen}
      />
      <Stack.Screen
        name="EventRegistrations"
        component={EventRegistrationsScreen}
      />
      <Stack.Screen name="AdminEventDetails" component={AdminEventDetails} />
      <Stack.Screen name="AdminPrivateMeetings" component={AdminPrivateMeetingsScreen} />
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
              name="UploadDocuments"
              component={UploadDocumentsScreen}
            />
            <Stack.Screen
              name="EventDetails"
              component={EventDetailsScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="EventRegistration"
              component={EventRegistrationScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="EditEvent"
              component={EditEventScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="CreatePrivateMeeting" component={CreatePrivateMeetingScreen} />
<Stack.Screen name="MyMeetings" component={MyMeetingsScreen} />
<Stack.Screen name="MeetingDetails" component={MeetingDetailsScreen} />
<Stack.Screen name="MeetingInvitations" component={MeetingInvitationsScreen} />
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
          <Stack.Screen
            name="EmailVerification"
            component={EmailVerificationScreen}
            options={{
              headerShown: false,
            }}
          />
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
