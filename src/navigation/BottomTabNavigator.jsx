import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ConferencesScreen from '../screens/ConferencesScreen';
import MeetingsScreen from '../screens/MeetingsScreen';
import ChatScreen from '../screens/ChatScreen';
import CoursesScreen from '../screens/CoursesScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7B68EE',
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
            <Icon name="view-dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Conferences"
        component={ConferencesScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Icon name="video-account" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Meetings"
        component={MeetingsScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Icon name="calendar-clock" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({color}) => <Icon name="chat" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Icon name="book-open-page-variant" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
