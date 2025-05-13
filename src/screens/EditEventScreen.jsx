import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {eventService} from '../services/api';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const EditEventScreen = ({route, navigation}) => {
  const {eventId} = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();
  // Form state
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    type: '',
    mode: '',
    venue: '',
    startDate: new Date(),
    endDate: new Date(),
    start_time: '',
    end_time: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    capacity: '',
    website: '',
    registrationFee: '0',
    isFree: true,
    tags: '',
    termsAndConditions: '',
    speakers: [],
    sponsors: [],
  });

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const data = await eventService.getEventById(eventId);
      setEventData({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isFree: data.registrationFee === '0',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
      });
    } catch (error) {
      console.error('Failed to fetch event details:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      const updatedEventData = {
        ...eventData,
        registrationFee: eventData.isFree ? '0' : eventData.registrationFee,
        tags: eventData.tags
          ? eventData.tags.split(',').map(tag => tag.trim())
          : [],
      };

      await eventService.updateEvent(eventId, updatedEventData);
      Alert.alert('Success', 'Event updated successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Failed to update event:', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (event.type === 'dismissed') {
      type === 'start'
        ? setShowStartDatePicker(false)
        : setShowEndDatePicker(false);
      return;
    }

    if (selectedDate) {
      if (type === 'start') {
        setEventData(prev => ({...prev, startDate: selectedDate}));
        setShowStartDatePicker(false);
      } else {
        setEventData(prev => ({...prev, endDate: selectedDate}));
        setShowEndDatePicker(false);
      }
    }
  };

  const handleTimeChange = (event, selectedTime, type) => {
    if (event.type === 'dismissed') {
      type === 'start'
        ? setShowStartTimePicker(false)
        : setShowEndTimePicker(false);
      return;
    }

    if (selectedTime) {
      const timeString = selectedTime.toTimeString().split(' ')[0];
      if (type === 'start') {
        setEventData(prev => ({...prev, start_time: timeString}));
        setShowStartTimePicker(false);
      } else {
        setEventData(prev => ({...prev, end_time: timeString}));
        setShowEndTimePicker(false);
      }
    }
  };

  const formatDate = date => {
    return date.toISOString().split('T')[0];
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
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#2e7af5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleSave}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color="#2e7af5" />
          ) : (
            <Text style={styles.doneButtonText}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* Event Type */}
          <Text style={styles.sectionTitle}>Event Type</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                eventData.type === 'Conference' && styles.radioButtonSelected,
              ]}
              onPress={() =>
                setEventData(prev => ({...prev, type: 'Conference'}))
              }>
              <View style={styles.radioCircle}>
                {eventData.type === 'Conference' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={styles.radioText}>Conference</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                eventData.type === 'Meeting' && styles.radioButtonSelected,
              ]}
              onPress={() =>
                setEventData(prev => ({...prev, type: 'Meeting'}))
              }>
              <View style={styles.radioCircle}>
                {eventData.type === 'Meeting' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={styles.radioText}>Meeting</Text>
            </TouchableOpacity>
          </View>

          {/* Event Mode */}
          <Text style={styles.sectionTitle}>Event Mode</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                eventData.mode === 'In-Person' && styles.radioButtonSelected,
              ]}
              onPress={() =>
                setEventData(prev => ({...prev, mode: 'In-Person'}))
              }>
              <View style={styles.radioCircle}>
                {eventData.mode === 'In-Person' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={styles.radioText}>In-Person</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                eventData.mode === 'Virtual' && styles.radioButtonSelected,
              ]}
              onPress={() =>
                setEventData(prev => ({...prev, mode: 'Virtual'}))
              }>
              <View style={styles.radioCircle}>
                {eventData.mode === 'Virtual' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={styles.radioText}>Virtual</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Title*</Text>
            <TextInput
              style={styles.input}
              value={eventData.title}
              onChangeText={text =>
                setEventData(prev => ({...prev, title: text}))
              }
              placeholder="Enter event title"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description*</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={eventData.description}
              onChangeText={text =>
                setEventData(prev => ({...prev, description: text}))
              }
              placeholder="Describe the event"
              multiline={true}
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={eventData.tags}
              onChangeText={text =>
                setEventData(prev => ({...prev, tags: text}))
              }
              placeholder="e.g., healthcare, technology, education"
            />
          </View>

          {/* Date and Time */}
          <Text style={styles.sectionTitle}>Date and Time</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>Start Date*</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}>
                <Text>{formatDate(eventData.startDate)}</Text>
                <Icon name="calendar" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>End Date*</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}>
                <Text>{formatDate(eventData.endDate)}</Text>
                <Icon name="calendar" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>Start Time*</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartTimePicker(true)}>
                <Text>{eventData.start_time}</Text>
                <Icon name="clock-outline" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>End Time*</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndTimePicker(true)}>
                <Text>{eventData.end_time}</Text>
                <Icon name="clock-outline" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {eventData.mode === 'Virtual'
                ? 'Platform/Link*'
                : 'Venue/Address*'}
            </Text>
            <TextInput
              style={styles.input}
              value={eventData.venue}
              onChangeText={text =>
                setEventData(prev => ({...prev, venue: text}))
              }
              placeholder={
                eventData.mode === 'Virtual'
                  ? 'e.g., Zoom, Google Meet, or platform link'
                  : 'Enter the full address of the venue'
              }
            />
          </View>

          {eventData.mode === 'In-Person' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Capacity</Text>
              <TextInput
                style={styles.input}
                value={eventData.capacity?.toString()}
                onChangeText={text =>
                  setEventData(prev => ({
                    ...prev,
                    capacity: text ? parseInt(text) : null,
                  }))
                }
                placeholder="Maximum number of attendees"
                keyboardType="number-pad"
              />
            </View>
          )}

          {/* Registration */}
          <Text style={styles.sectionTitle}>Registration</Text>
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Free Event</Text>
              <Switch
                value={eventData.isFree}
                onValueChange={value =>
                  setEventData(prev => ({
                    ...prev,
                    isFree: value,
                    registrationFee: value ? '0' : prev.registrationFee,
                  }))
                }
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={eventData.isFree ? '#2e7af5' : '#f4f3f4'}
              />
            </View>
          </View>

          {!eventData.isFree && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Registration Fee</Text>
              <TextInput
                style={styles.input}
                value={eventData.registrationFee}
                onChangeText={text =>
                  setEventData(prev => ({...prev, registrationFee: text}))
                }
                placeholder="Enter amount (e.g., 99.99)"
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Organizer Information */}
          <Text style={styles.sectionTitle}>Organizer</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Organizer Name*</Text>
            <TextInput
              style={styles.input}
              value={eventData.organizerName}
              onChangeText={text =>
                setEventData(prev => ({...prev, organizerName: text}))
              }
              placeholder="Enter organizer name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Organizer Email*</Text>
            <TextInput
              style={styles.input}
              value={eventData.organizerEmail}
              onChangeText={text =>
                setEventData(prev => ({...prev, organizerEmail: text}))
              }
              placeholder="Enter organizer email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Organizer Phone</Text>
            <TextInput
              style={styles.input}
              value={eventData.organizerPhone}
              onChangeText={text =>
                setEventData(prev => ({...prev, organizerPhone: text}))
              }
              placeholder="Enter organizer phone"
              keyboardType="phone-pad"
            />
          </View>

          {/* Terms and Conditions */}
          <Text style={styles.sectionTitle}>Terms and Conditions</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Terms and Conditions</Text>
            <TextInput
              style={[styles.input, styles.termsTextarea]}
              value={eventData.termsAndConditions}
              onChangeText={text =>
                setEventData(prev => ({...prev, termsAndConditions: text}))
              }
              placeholder="Enter terms and conditions"
              multiline={true}
              numberOfLines={6}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    color: '#2e7af5',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  termsTextarea: {
    height: 150,
    textAlignVertical: 'top',
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioButtonSelected: {
    backgroundColor: '#e6f0ff',
    borderRadius: 8,
    padding: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2e7af5',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateGroup: {
    flex: 1,
    marginRight: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});

export default EditEventScreen;
