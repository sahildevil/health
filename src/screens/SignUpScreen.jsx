import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';

const SignUpScreen = ({navigation}) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Additional fields based on role
  const [degree, setDegree] = useState('');
  const [company, setCompany] = useState('');

  const {signup, login} = useAuth();

  const selectRole = selectedRole => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSignUp = async () => {
    // Simple validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create user data object based on role
      const userData = {
        name,
        email,
        password,
        role,
      };

      // Add role-specific fields
      if (role === 'doctor') {
        userData.degree = degree;
      } else if (role === 'pharma') {
        userData.company = company;
      }

      // Register the user
      await signup(userData);

      // Show success message
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [
          {
            text: 'Login Now',
            onPress: async () => {
              try {
                // Auto login after signup
                await login(email, password);
              } catch (error) {
                // If auto-login fails, navigate to login screen
                navigation.replace('Login');
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Signup Failed', error.message || 'Please try again later');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role Selection Screen
  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Join MedEvent</Text>
          <Text style={styles.subtitle}>What best describes you?</Text>
        </View>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => selectRole('doctor')}>
            <Icon name="doctor" size={60} color="#2e7af5" />
            <Text style={styles.roleTitle}>Doctor</Text>
            <Text style={styles.roleDescription}>
              Access medical conferences, CME courses, and connect with
              colleagues.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => selectRole('pharma')}>
            <Icon name="pill" size={60} color="#2e7af5" />
            <Text style={styles.roleTitle}>Pharmaceutical Rep</Text>
            <Text style={styles.roleDescription}>
              Connect with healthcare professionals and showcase your products.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Registration Form Screen
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
        <Icon name="arrow-left" size={24} color="#2e7af5" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Sign up as{' '}
          {role === 'doctor'
            ? 'Healthcare Professional'
            : 'Pharmaceutical Representative'}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {role === 'doctor' && (
          <>
            <Text style={styles.inputLabel}>Medical Specialty</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Cardiology, Pediatrics"
              value={degree}
              onChangeText={setDegree}
            />
          </>
        )}

        {role === 'pharma' && (
          <>
            <Text style={styles.inputLabel}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your company name"
              value={company}
              onChangeText={setCompany}
            />
          </>
        )}

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f7f9fc',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    marginTop: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  roleContainer: {
    marginVertical: 20,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    fontSize: 16,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2e7af5',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  loginText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7af5',
  },
});

export default SignUpScreen;
