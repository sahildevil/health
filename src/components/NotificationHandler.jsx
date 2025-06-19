// filepath: d:\medevent\Health\src\components\NotificationHandler.jsx

import React, {useEffect} from 'react';
import {fcmService} from '../services/fcmService';
import {useNavigation} from '@react-navigation/native';
import {Alert, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';

const NotificationHandler = () => {
  const navigation = useNavigation();

  const handleNotificationNavigation = data => {
    if (!data) return;

    const {type, id, action} = data;

    console.log('Handling notification navigation:', {type, id, action});

    switch (type) {
      case 'pending_event':
        if (action === 'approval') {
          navigation.navigate('AdminEventManagement');
        }
        break;

      case 'event_approval':
        if (action === 'view' && id) {
          navigation.navigate('MyEvents');
        }
        break;

      case 'event_rejection':
        if (action === 'view' && id) {
          navigation.navigate('MyEvents');
        }
        break;

      case 'new_event':
        if (action === 'view' && id) {
          navigation.navigate('EventDetails', {eventId: id});
        }
        break;

      case 'chat_message':
        if (action === 'open_chat' && id) {
          navigation.navigate('ChatScreen', {userId: id});
        }
        break;

      case 'meeting_invitation':
        if (action === 'view_invitation') {
          navigation.navigate('MeetingInvitations');
        }
        break;

      case 'invitation_response':
        if (action === 'view_meeting' && id) {
          navigation.navigate('MeetingDetails', {meetingId: id});
        }
        break;

      case 'account_verification':
        if (action === 'dashboard') {
          navigation.navigate('HomeScreen');
        }
        break;

      case 'account_rejection':
        if (action === 'verification') {
          navigation.navigate('UserVerification');
        }
        break;
    }
  };

  // Function to display foreground notifications
  const showForegroundNotification = (title, body, data) => {
    if (Platform.OS === 'ios') {
      // For iOS, we'll use a simple Alert
      Alert.alert(
        title,
        body,
        [
          {
            text: 'Dismiss',
            style: 'cancel',
          },
          {
            text: 'View',
            onPress: () => handleNotificationNavigation(data),
          },
        ],
        {cancelable: true},
      );
    } else {
      // For Android, we can use the messaging API directly
      // Note: This will only work if you have set up the notification channel
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          // Show a toast or custom notification UI
          // For simplicity, we'll use Alert here too
          Alert.alert(
            title,
            body,
            [
              {
                text: 'Dismiss',
                style: 'cancel',
              },
              {
                text: 'View',
                onPress: () => handleNotificationNavigation(data),
              },
            ],
            {cancelable: true},
          );
        });
    }
  };

  useEffect(() => {
    // Handle foreground notifications - We need to manually display them
    const onNotification = remoteMessage => {
      console.log('Notification received in foreground:', remoteMessage);

      // Extract notification details
      const title = remoteMessage.notification?.title || 'New Notification';
      const body = remoteMessage.notification?.body || '';
      const data = remoteMessage.data || {};

      // Display the notification to the user
      showForegroundNotification(title, body, data);
    };

    // Handle notifications that open the app
    const onNotificationOpened = remoteMessage => {
      console.log('Notification opened app', remoteMessage);

      if (remoteMessage.data) {
        handleNotificationNavigation(remoteMessage.data);
      }
    };

    // Register notification handlers
    fcmService.registerNotificationListeners(
      onNotification,
      onNotificationOpened,
    );

    // Clean up
    return () => {
      fcmService.unregister();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default NotificationHandler;
