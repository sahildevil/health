import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
// Import screens
import HomeScreen from '../screens/HomeScreen';
import ConferencesScreen from '../screens/ConferencesScreen';
import MeetingsScreen from '../screens/MeetingsScreen';
import ChatScreen from '../screens/ChatScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ScheduleScreen from '../screens/ScheduleScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2e7af5',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Conferences"
        component={ConferencesScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Ionicons name="people-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Meetings"
        component={MeetingsScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({color}) => <Ionicons name="chatbubbles-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Ionicons name="book-outline" size={24} color={color} />
          ),
        }}
      />
            {/* <Tab.Screen
        name="Cou"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Icon name="book-open-page-variant" size={24} color={color} />
          ),
        }}
      /> */}
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
