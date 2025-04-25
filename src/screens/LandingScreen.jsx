import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';

const LandingScreen = ({navigation}) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>MedEvent Health</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Your health journey begins here</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('MainApp')}>
          <Text style={styles.buttonText}>Home test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.signUpButton]}
          onPress={() => navigation.navigate('SignUp')}>
          <Text style={[styles.buttonText, styles.signUpButtonText]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7af5',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    maxWidth: '80%',
  },
  buttonContainer: {
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#2e7af5',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2e7af5',
  },
  signUpButtonText: {
    color: '#2e7af5',
  },
});

export default LandingScreen;
