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
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {eventService} from '../services/api';
import {SafeAreaInsetsContext, useSafeAreaInsets} from 'react-native-safe-area-context';

const EventRegistrationScreen = ({route, navigation}) => {
  const {eventId} = route.params;
  const {user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState(null);
  const [isCompanySponsor, setIsCompanySponsor] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    specialization: '',
    organization: '',
    additionalNotes: '',
    // New fields for company sponsors
    isCompanySponsor: false,
    companyName: '',
    sponsorshipLevel: 'Standard', // Default level
    contactPerson: '',
    companyWebsite: '',
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

  const toggleSponsorMode = value => {
    setIsCompanySponsor(value);
    setFormData({
      ...formData,
      isCompanySponsor: value,
      // Pre-fill contact person with user's name if switching to company mode
      contactPerson:
        value && !formData.contactPerson
          ? formData.name
          : formData.contactPerson,
    });
  };

  const handleSubmit = async () => {
    if (isCompanySponsor) {
      // Validation for company sponsors
      if (
        !formData.companyName ||
        !formData.contactPerson ||
        !formData.email ||
        !formData.phone
      ) {
        Alert.alert('Error', 'Please fill in all required company fields');
        return;
      }

      // Only include fields that are supported by the schema
      const registrationData = {
        isCompanySponsor: true, // Ensure this is a boolean true, not a string
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        companyWebsite: formData.companyWebsite,
        sponsorshipLevel: formData.sponsorshipLevel,
      };

      console.log('Submitting sponsor registration:', registrationData);

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
      // Validation for individual registrations
      if (!formData.name || !formData.email || !formData.phone) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Only include fields that are supported by the schema
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
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
    <SafeAreaView style={[styles.container, {paddingTop: useSafeAreaInsets.top}]}>
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

        {/* Registration Type Selector */}
        <View style={styles.registrationTypeContainer}>
          <Text style={styles.registrationTypeTitle}>Registration Type</Text>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              {isCompanySponsor
                ? 'Registering as Company Sponsor'
                : 'Registering as Individual'}
            </Text>
            <Switch
              value={isCompanySponsor}
              onValueChange={toggleSponsorMode}
              trackColor={{false: '#767577', true: '#81b0ff'}}
              thumbColor={isCompanySponsor ? '#2e7af5' : '#f4f3f4'}
            />
          </View>

          {isCompanySponsor && (
            <View style={styles.sponsorNotice}>
              <Icon name="information-outline" size={18} color="#e36135" />
              <Text style={styles.sponsorNoticeText}>
                Your company will be registered as a sponsor for this event
              </Text>
            </View>
          )}
        </View>

        {/* Registration Form */}
        <View style={styles.form}>
          {isCompanySponsor ? (
            // Company Sponsor Form
            <>
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

              {/* <View style={styles.inputGroup}>
                <Text style={styles.label}>Sponsorship Level</Text>
                <View style={styles.radioContainer}>
                  {['Gold', 'Silver', 'Bronze', 'Standard'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.radioButton,
                        formData.sponsorshipLevel === level && styles.radioButtonSelected
                      ]}
                      onPress={() => setFormData({ ...formData, sponsorshipLevel: level })}
                    >
                      <View style={styles.radioCircle}>
                        {formData.sponsorshipLevel === level && <View style={styles.radioDot} />}
                      </View>
                      <Text style={styles.radioText}>{level}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View> */}
            </>
          ) : (
            // Individual Registration Form
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={text => setFormData({...formData, name: text})}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialization</Text>
                <TextInput
                  style={styles.input}
                  value={formData.specialization}
                  onChangeText={text =>
                    setFormData({...formData, specialization: text})
                  }
                  placeholder="Enter your specialization"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Organization</Text>
                <TextInput
                  style={styles.input}
                  value={formData.organization}
                  onChangeText={text =>
                    setFormData({...formData, organization: text})
                  }
                  placeholder="Enter your organization"
                  placeholderTextColor="#999"
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.additionalNotes}
              onChangeText={text =>
                setFormData({...formData, additionalNotes: text})
              }
              placeholder={
                isCompanySponsor
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
              {isCompanySponsor ? 'Register as Sponsor' : 'Register'}
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
  registrationTypeContainer: {
    padding: 16,
    backgroundColor: '#f0f7ff',
    borderBottomWidth: 1,
    borderBottomColor: '#dce7f5',
  },
  registrationTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2e7af5',
    flex: 1,
  },
  sponsorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  sponsorNoticeText: {
    fontSize: 14,
    color: '#e36135',
    marginLeft: 8,
    flex: 1,
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
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 12,
  },
  radioButtonSelected: {
    opacity: 1,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2e7af5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#2e7af5',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
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
