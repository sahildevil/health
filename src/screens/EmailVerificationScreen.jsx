import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';

const EmailVerificationScreen = ({navigation, route}) => {
  const {email} = route.params || {};
  const [userEmail, setUserEmail] = useState(email || '');
  const [loading, setLoading] = useState(false);
  const {resendVerification} = useAuth();

  const handleResendVerification = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await resendVerification(userEmail);
      Alert.alert(
        'Verification Email Sent',
        'A new verification link has been sent to your email address.',
        [{text: 'OK'}],
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to resend verification email',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="email-check-outline" size={80} color="#2e7af5" />
      </View>

      <Text style={styles.title}>Email Verification</Text>
      <Text style={styles.subtitle}>
        We've sent a verification link to your email address. Please check your
        inbox and click the link to verify your account.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={userEmail}
          onChangeText={setUserEmail}
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendVerification}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.resendButtonText}>Resend Verification Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
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
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    fontSize: 16,
    width: '100%',
  },
  resendButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 12,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    padding: 16,
  },
  loginButtonText: {
    color: '#2e7af5',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmailVerificationScreen;
