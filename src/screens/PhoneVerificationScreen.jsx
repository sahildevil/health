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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PhoneVerificationScreen = ({navigation, route}) => {
  const {phone} = route.params || {};
  const [userPhone, setUserPhone] = useState(phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [loading, setLoading] = useState(false);
  const {startPhoneVerification, verifyPhoneOTP} = useAuth();

  const handleSendOTP = async () => {
    if (!userPhone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    try {
      setLoading(true);
      await startPhoneVerification(userPhone);
      setStep('verify');
      Alert.alert(
        'OTP Sent',
        'We have sent a verification code to your phone number.',
        [{text: 'OK'}],
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      await verifyPhoneOTP(userPhone, otpCode);
      Alert.alert('Success', 'Phone number verified successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: useSafeAreaInsets.top}]}>
      <View style={styles.iconContainer}>
        <Icon name="cellphone-message" size={80} color="#2e7af5" />
      </View>

      <Text style={styles.title}>Phone Verification</Text>

      {step === 'request' ? (
        <>
          <Text style={styles.subtitle}>
            Enter your phone number to receive a verification code.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={userPhone}
              onChangeText={setUserPhone}
              placeholder="+1 (234) 567-8901"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendOTP}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>
                Send Verification Code
              </Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Enter the verification code sent to {userPhone}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Enter code"
              keyboardType="number-pad"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleVerifyOTP}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep('request')}
            disabled={loading}>
            <Text style={styles.secondaryButtonText}>Change Phone Number</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backButtonText}>Back to Login</Text>
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
  actionButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 12,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginBottom: 16,
    padding: 8,
  },
  secondaryButtonText: {
    color: '#2e7af5',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    color: '#2e7af5',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhoneVerificationScreen;
