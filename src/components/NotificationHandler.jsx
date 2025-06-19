// filepath: d:\medevent\Health\src\components\NotificationHandler.jsx

import React, {useEffect} from 'react';
import {fcmService} from '../services/fcmService';
import {useNavigation} from '@react-navigation/native';

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
          // Navigate to My Events to see the approved event
          navigation.navigate('MyEvents');
          // Or navigate directly to event details
          // navigation.navigate('EventDetails', { eventId: id });
        }
        break;

      case 'event_rejection':
        if (action === 'view' && id) {
          // Navigate to My Events to see the rejected event
          navigation.navigate('MyEvents');
          // Or navigate to edit screen
          // navigation.navigate('EditEvent', { eventId: id });
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

  useEffect(() => {
    // Handle foreground notifications - Firebase displays them automatically
    const onNotification = remoteMessage => {
      console.log('Notification received in foreground:', remoteMessage);
      // Firebase handles the notification display automatically on both platforms
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
