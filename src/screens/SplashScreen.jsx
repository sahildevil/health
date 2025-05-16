import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Auto navigate to Landing screen after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('Landing');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Replace with your actual logo image */}
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {/* <Text style={styles.title}>HealthCare Insights</Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 400,
    height: 400,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#2e7af5',
    marginTop: 20,
  },
});

export default SplashScreen;