import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateConferenceScreen = ({navigation}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1)),
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [conferenceType, setConferenceType] = useState('Conference'); // or Meeting
  const [conferenceMode, setConferenceMode] = useState('In-Person'); // or Virtual

  const formatDate = date => {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      // If end date is before new start date, update end date
      if (endDate < selectedDate) {
        setEndDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleCreateConference = () => {
    // Validate form
    if (!title || !description || !venue || !organizerName) {
      Alert.alert('Missing Information', 'Please fill all required fields.');
      return;
    }

    if (endDate < startDate) {
      Alert.alert('Invalid Dates', 'End date must be after start date.');
      return;
    }

    // Create conference object
    const newConference = {
      title,
      description,
      venue,
      organizerName,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      type: conferenceType,
      mode: conferenceMode,
      // You might also want to add an ID, created date, etc.
    };

    // In a real app, you would send this to your API
    console.log('New Conference:', newConference);

    // Show success message
    Alert.alert('Success', 'Your conference has been created successfully!', [
      {text: 'OK', onPress: () => navigation.goBack()},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#2e7af5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Conference</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* Conference Type Selection */}
          <Text style={styles.sectionTitle}>Event Type</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                conferenceType === 'Conference' && styles.radioButtonSelected,
              ]}
              onPress={() => setConferenceType('Conference')}>
              <View style={styles.radioCircle}>
                {conferenceType === 'Conference' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={styles.radioText}>Conference</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                conferenceType === 'Meeting' && styles.radioButtonSelected,
              ]}
              onPress={() => setConferenceType('Meeting')}>
              <View style={styles.radioCircle}>
                {conferenceType === 'Meeting' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={styles.radioText}>Meeting</Text>
            </TouchableOpacity>
          </View>

          {/* Conference Mode Selection */}
          <Text style={styles.sectionTitle}>Event Mode</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                conferenceMode === 'In-Person' && styles.radioButtonSelected,
              ]}
              onPress={() => setConferenceMode('In-Person')}>
              <View style={styles.radioCircle}>
                {conferenceMode === 'In-Person' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={styles.radioText}>In-Person</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                conferenceMode === 'Virtual' && styles.radioButtonSelected,
              ]}
              onPress={() => setConferenceMode('Virtual')}>
              <View style={styles.radioCircle}>
                {conferenceMode === 'Virtual' && (
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
              placeholder="Enter a descriptive title"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description*</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe the purpose and topics of your event"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={4}
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
                <Text>{formatDate(startDate)}</Text>
                <Icon name="calendar" size={18} color="#666" />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>End Date*</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}>
                <Text>{formatDate(endDate)}</Text>
                <Icon name="calendar" size={18} color="#666" />
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                  minimumDate={startDate}
                />
              )}
            </View>
          </View>

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {conferenceMode === 'Virtual'
                ? 'Platform/Link*'
                : 'Venue/Address*'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                conferenceMode === 'Virtual'
                  ? 'e.g., Zoom, Google Meet, or platform link'
                  : 'Enter the full address of the venue'
              }
              value={venue}
              onChangeText={setVenue}
            />
          </View>

          {/* Organizer */}
          <Text style={styles.sectionTitle}>Organizer</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Organizer Name*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., American Medical Association"
              value={organizerName}
              onChangeText={setOrganizerName}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateConference}>
            <Text style={styles.createButtonText}>Create Conference</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radioButtonSelected: {},
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
    fontSize: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateGroup: {
    width: '48%',
  },
  dateInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 32,
    marginBottom: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateConferenceScreen;
