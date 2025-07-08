import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {eventService} from '../services/api';
import {useAuth} from '../context/AuthContext';

const EventDayRegistrationScreen = ({route, navigation}) => {
  const {eventId} = route.params;
  const {user} = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [eventDays, setEventDays] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [registrationType, setRegistrationType] = useState('all_days');

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const [event, days] = await Promise.all([
        eventService.getEventById(eventId),
        eventService.getEventDays(eventId),
      ]);

      setEventDetails(event);
      setEventDays(days);

      // Initialize with all days selected
      if (days.length > 0) {
        setSelectedDays(days.map(day => day.day_number));
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const toggleDaySelection = dayNumber => {
    if (registrationType === 'all_days') return;

    setSelectedDays(prev => {
      if (prev.includes(dayNumber)) {
        return prev.filter(day => day !== dayNumber);
      } else {
        return [...prev, dayNumber];
      }
    });
  };

  const handleRegistrationTypeChange = type => {
    setRegistrationType(type);
    if (type === 'all_days') {
      setSelectedDays(eventDays.map(day => day.day_number));
    } else {
      setSelectedDays([]);
    }
  };

  const handleRegistration = async () => {
    if (registrationType === 'specific_days' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day to register for');
      return;
    }

    try {
      setSubmitting(true);

      const registrationData = {
        registrationType,
        selectedDays: registrationType === 'all_days' ? null : selectedDays,
      };

      await eventService.registerForEventDays(eventId, registrationData);

      Alert.alert(
        'Registration Successful!',
        `You have been registered for ${
          registrationType === 'all_days'
            ? 'all days of this event'
            : `${selectedDays.length} day(s) of this event`
        }`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register for the event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7af5" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#2e7af5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register for Event</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{eventDetails?.title}</Text>
          <Text style={styles.eventDescription}>
            {eventDetails?.description}
          </Text>
        </View>

        <View style={styles.registrationTypeCard}>
          <Text style={styles.sectionTitle}>Registration Options</Text>

          <TouchableOpacity
            style={[
              styles.registrationOption,
              registrationType === 'all_days' &&
                styles.registrationOptionSelected,
            ]}
            onPress={() => handleRegistrationTypeChange('all_days')}>
            <View style={styles.radioButton}>
              {registrationType === 'all_days' && (
                <View style={styles.radioDot} />
              )}
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Register for All Days</Text>
              <Text style={styles.optionDescription}>
                Full access to all {eventDays.length} days of the event
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.registrationOption,
              registrationType === 'specific_days' &&
                styles.registrationOptionSelected,
            ]}
            onPress={() => handleRegistrationTypeChange('specific_days')}>
            <View style={styles.radioButton}>
              {registrationType === 'specific_days' && (
                <View style={styles.radioDot} />
              )}
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Select Specific Days</Text>
              <Text style={styles.optionDescription}>
                Choose which days you want to attend
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {registrationType === 'specific_days' && (
          <View style={styles.daysSelectionCard}>
            <Text style={styles.sectionTitle}>Select Days to Attend</Text>
            {eventDays.map(day => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayOption,
                  selectedDays.includes(day.day_number) &&
                    styles.dayOptionSelected,
                ]}
                onPress={() => toggleDaySelection(day.day_number)}>
                <View style={styles.dayOptionHeader}>
                  <Text style={styles.dayTitle}>Day {day.day_number}</Text>
                  <View style={styles.checkbox}>
                    {selectedDays.includes(day.day_number) && (
                      <Icon name="check" size={16} color="#fff" />
                    )}
                  </View>
                </View>
                <Text style={styles.dayDate}>
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.dayTime}>
                  {day.start_time} - {day.end_time}
                </Text>
                <Text style={styles.dayVenue}>{day.venue}</Text>
                {day.description && (
                  <Text style={styles.dayDescription}>{day.description}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Registration Summary</Text>
          <Text style={styles.summaryText}>Event: {eventDetails?.title}</Text>
          <Text style={styles.summaryText}>
            Days:{' '}
            {registrationType === 'all_days'
              ? `All ${eventDays.length} days`
              : `${selectedDays.length} selected day(s)`}
          </Text>
          <Text style={styles.summaryText}>
            Registration Fee:{' '}
            {eventDetails?.registrationFee === '0'
              ? 'Free'
              : `$${eventDetails?.registrationFee}`}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegistration}
          disabled={
            submitting ||
            (registrationType === 'specific_days' && selectedDays.length === 0)
          }>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Register Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  registrationTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  registrationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 8,
  },
  registrationOptionSelected: {
    borderColor: '#2e7af5',
    backgroundColor: '#f0f8ff',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2e7af5',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  daysSelectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dayOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 8,
  },
  dayOptionSelected: {
    borderColor: '#2e7af5',
    backgroundColor: '#f0f8ff',
  },
  dayOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#2e7af5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dayTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dayVenue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dayDescription: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  registerButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventDayRegistrationScreen;
