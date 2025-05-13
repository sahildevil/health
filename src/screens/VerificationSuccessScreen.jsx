import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const VerificationSuccessScreen = ({navigation}) => {
  return (
    <SafeAreaView style={[styles.container, {paddingTop: useSafeAreaInsets.top}]}>
      <View style={styles.iconContainer}>
        <Icon name="check-circle" size={100} color="#4caf50" />
      </View>

      <Text style={styles.title}>Email Verified!</Text>
      <Text style={styles.subtitle}>
        Your email has been successfully verified. You can now log in to your
        account.
      </Text>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginButtonText}>Proceed to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 12,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerificationSuccessScreen;
