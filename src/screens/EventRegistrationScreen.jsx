import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {eventService} from '../services/api';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const EventRegistrationScreen = ({route, navigation}) => {
  const insets = useSafeAreaInsets();
  const {eventId} = route.params;
  const {user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState(null);
  
  // Initialize form based on user role
  const isPharma = user?.role === 'pharma';
  
  // Form data with defaults
  const [formData, setFormData] = useState({
    // Common fields
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    additionalNotes: '',
    
    // For pharma users
    isCompanySponsor: isPharma,
    companyName: user?.company || '',
    contactPerson: user?.name || '',
    companyWebsite: '',
    sponsorshipLevel: 'Standard',
  });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const eventData = await eventService.getEventById(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form based on user role
    if (isPharma) {
      // Validation for company/pharma registration
      if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone) {
        Alert.alert('Error', 'Please fill in all required company fields');
        return;
      }
      
      // Prepare pharma registration data
      const registrationData = {
        isCompanySponsor: true,
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        companyWebsite: formData.companyWebsite,
        additionalNotes: formData.additionalNotes,
      };

      try {
        setSubmitting(true);
        await eventService.registerForEvent(eventId, registrationData);
        Alert.alert(
          'Success',
          'Your company has been registered as a sponsor! You will receive a confirmation email shortly.',
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      } catch (error) {
        console.error('Registration error:', error);
        Alert.alert('Error', 'Failed to register for the event');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Doctor registration - simple validation
      if (!formData.name || !formData.email) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Prepare doctor registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        additionalNotes: formData.additionalNotes,
        isCompanySponsor: false,
      };

      try {
        setSubmitting(true);
        await eventService.registerForEvent(eventId, registrationData);
        Alert.alert(
          'Success',
          'Registration successful! You will receive a confirmation email shortly.',
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      } catch (error) {
        console.error('Registration error:', error);
        Alert.alert('Error', 'Failed to register for the event');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7af5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#2e7af5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Registration</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event?.title}</Text>
          <Text style={styles.eventType}>{event?.type}</Text>
        </View>

        {/* Registration Form - Different for doctor vs pharma */}
        <View style={styles.form}>
          {isPharma ? (
            // Pharma/Company Registration Form
            <>
              <View style={styles.registrationTypeHeader}>
                <Icon name="domain" size={24} color="#2e7af5" style={styles.registrationTypeIcon} />
                <Text style={styles.registrationTypeText}>
                  Company Registration
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Name*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.companyName}
                  onChangeText={text =>
                    setFormData({...formData, companyName: text})
                  }
                  placeholder="Enter your company name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Person*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contactPerson}
                  onChangeText={text =>
                    setFormData({...formData, contactPerson: text})
                  }
                  placeholder="Name of company representative"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={text => setFormData({...formData, email: text})}
                  placeholder="Contact email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={text => setFormData({...formData, phone: text})}
                  placeholder="Contact phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Website</Text>
                <TextInput
                  style={styles.input}
                  value={formData.companyWebsite}
                  onChangeText={text =>
                    setFormData({...formData, companyWebsite: text})
                  }
                  placeholder="https://www.example.com"
                  placeholderTextColor="#999"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </>
          ) : (
            // Doctor's Simple Registration Form
            <>
              <View style={styles.registrationTypeHeader}>
                <Icon name="doctor" size={24} color="#2e7af5" style={styles.registrationTypeIcon} />
                <Text style={styles.registrationTypeText}>
                  Doctor Registration
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={text => setFormData({...formData, name: text})}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  editable={!user?.name} // Make it read-only if pre-filled
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={text => setFormData({...formData, email: text})}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!user?.email} // Make it read-only if pre-filled
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={text => setFormData({...formData, phone: text})}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          {/* Common fields for both types */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.additionalNotes}
              onChangeText={text =>
                setFormData({...formData, additionalNotes: text})
              }
              placeholder={
                isPharma
                  ? 'Additional requirements or information about your sponsorship'
                  : "Any additional information you'd like to share"
              }
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isPharma ? 'Register as Sponsor' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  eventInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 14,
    color: '#666',
  },
  registrationTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  registrationTypeIcon: {
    marginRight: 12,
  },
  registrationTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7af5',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EventRegistrationScreen;