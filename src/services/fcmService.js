import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const API_URL = 'http://192.168.1.17:5000';

class FCMService {
  async registerAppWithFCM() {
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
      await messaging().setAutoInitEnabled(true);
    }
  }

  async requestUserPermission() {
    console.log('🔔 Requesting FCM permission...');
    const authStatus = await messaging().requestPermission();
    console.log('🔔 FCM Permission status:', authStatus);

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ FCM Permission granted');
      return this.getFcmToken();
    }
    console.log('❌ FCM permission rejected');
    return null;
  }

  async getFcmToken() {
    console.log('🎯 Getting FCM token...');
    const fcmToken = await AsyncStorage.getItem('fcmToken');

    if (!fcmToken) {
      try {
        console.log('🎯 No existing token, generating new one...');
        const newFcmToken = await messaging().getToken();
        if (newFcmToken) {
          console.log(
            '✅ FCM Token generated:',
            newFcmToken.substring(0, 30) + '...',
          );
          await AsyncStorage.setItem('fcmToken', newFcmToken);

          // Check if user is logged in before sending to server
          const authToken = await AsyncStorage.getItem('@token');
          const user = await AsyncStorage.getItem('@user');

          console.log('👤 Auth token exists:', !!authToken);
          console.log('👤 User exists:', !!user);

          if (authToken && user) {
            console.log('🚀 Sending token to server...');
            await this.sendTokenToServer(newFcmToken, authToken);
          } else {
            console.log('⏳ User not logged in, will send token after login');
          }
          return newFcmToken;
        }
      } catch (error) {
        console.error('❌ FCM token error:', error);
      }
    } else {
      console.log(
        '✅ Existing FCM token found:',
        fcmToken.substring(0, 30) + '...',
      );
    }
    return fcmToken;
  }

  async sendTokenToServer(fcmToken, authToken) {
    try {
      console.log('📡 Sending FCM token to server...');
      console.log('📡 API URL:', `${API_URL}/api/users/fcm-token`);
      console.log(
        '📡 Token (first 30 chars):',
        fcmToken.substring(0, 30) + '...',
      );

      const response = await fetch(`${API_URL}/api/users/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({token: fcmToken}),
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ FCM token registered with server:', result);
      } else {
        const errorText = await response.text();
        console.error(
          '❌ Failed to register FCM token:',
          response.status,
          errorText,
        );
      }
    } catch (error) {
      console.error('❌ Network error registering FCM token:', error);
    }
  }

  async registerTokenAfterLogin(authToken) {
    console.log('🔄 Registering token after login...');
    const fcmToken = await AsyncStorage.getItem('fcmToken');
    if (fcmToken) {
      console.log('📤 Found existing token, sending to server...');
      await this.sendTokenToServer(fcmToken, authToken);
    } else {
      console.log('❓ No FCM token found, requesting new one...');
      await this.getFcmToken();
    }
  }

  registerNotificationListeners(onNotification, onNotificationOpened) {
    // Foreground message handler
    this.messageListener = messaging().onMessage(async remoteMessage => {
      console.log('Notification received in foreground:', remoteMessage);
      if (onNotification) onNotification(remoteMessage);
    });

    // Background notification opened handler
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app from background:', remoteMessage);
      if (onNotificationOpened) onNotificationOpened(remoteMessage);
    });

    // App opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification opened app from quit state:',
            remoteMessage,
          );
          if (onNotificationOpened) onNotificationOpened(remoteMessage);
        }
      });

    // Token refresh handler
    messaging().onTokenRefresh(fcmToken => {
      console.log('FCM token refreshed:', fcmToken.substring(0, 20) + '...');
      AsyncStorage.setItem('fcmToken', fcmToken);
      AsyncStorage.getItem('@token').then(authToken => {
        if (authToken) {
          this.sendTokenToServer(fcmToken, authToken);
        }
      });
    });
  }

  unregister() {
    if (this.messageListener) {
      this.messageListener();
    }
  }

  // Add this method to your FCMService class
  async verifyTokenRegistration() {
    try {
      // Get the stored token
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      if (!fcmToken) {
        console.log('⚠️ No FCM token stored locally');
        return {success: false, error: 'No FCM token stored'};
      }

      console.log(
        '📱 Found local FCM token:',
        fcmToken.substring(0, 15) + '...',
      );

      // Check if user is logged in
      const authToken = await AsyncStorage.getItem('@token');
      if (!authToken) {
        console.log('⚠️ User not logged in, cannot verify token with server');
        return {success: false, error: 'User not logged in'};
      }

      // Verify token with server
      const API_URL = 'http://192.168.1.17:5000'; // Adjust as needed
      const response = await fetch(`${API_URL}/api/verify-fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({fcmToken}),
      });

      const result = await response.json();
      console.log('🔍 FCM token verification result:', result);

      return result;
    } catch (error) {
      console.error('❌ Error verifying FCM token:', error);
      return {success: false, error: error.message};
    }
  }
}

export const fcmService = new FCMService();
