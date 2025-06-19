import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

const NotificationBadge = () => {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Load notification count from storage
    const loadCount = async () => {
      try {
        const count = await AsyncStorage.getItem('@notificationCount');
        if (count) {
          setNotificationCount(parseInt(count, 10));
        }
      } catch (error) {
        console.error('Failed to load notification count:', error);
      }
    };

    loadCount();

    // Listen for new notifications
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      // Increment count when a new notification arrives
      const newCount = notificationCount + 1;
      setNotificationCount(newCount);
      
      try {
        await AsyncStorage.setItem('@notificationCount', newCount.toString());
      } catch (error) {
        console.error('Failed to save notification count:', error);
      }
    });

    return unsubscribe;
  }, [notificationCount]);

  // Reset badge function (call this when notifications are viewed)
  const resetBadge = async () => {
    setNotificationCount(0);
    try {
      await AsyncStorage.setItem('@notificationCount', '0');
    } catch (error) {
      console.error('Failed to reset notification count:', error);
    }
  };

  if (notificationCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {notificationCount > 99 ? '99+' : notificationCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NotificationBadge;
export { NotificationBadge, resetBadge };