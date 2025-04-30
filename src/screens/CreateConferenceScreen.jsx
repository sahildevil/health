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
  Switch,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { eventService } from '../services/api';
const CreateConferenceScreen = ({navigation}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1)),
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [conferenceType, setConferenceType] = useState('Conference'); // or Meeting
  const [conferenceMode, setConferenceMode] = useState('In-Person'); // or Virtual
  const [capacity, setCapacity] = useState('');
  const [website, setWebsite] = useState('');
  const [regFee, setRegFee] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [tags, setTags] = useState('');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(
    new Date(new Date().setHours(new Date().getHours() + 2)),
  );
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Sponsors state
  const [sponsors, setSponsors] = useState([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorLevel, setNewSponsorLevel] = useState('');

  // Speakers state
  const [speakers, setSpeakers] = useState([]);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [newSpeakerTitle, setNewSpeakerTitle] = useState('');
  const [newSpeakerBio, setNewSpeakerBio] = useState('');

  const formatDate = date => {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const formatTime = date => {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}:00`;
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

  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const validateEmail = email => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Add a new sponsor
  const addSponsor = () => {
    if (newSponsorName.trim() === '') {
      Alert.alert('Missing Information', 'Please enter sponsor name.');
      return;
    }

    const newSponsor = {
      id: Date.now().toString(),
      name: newSponsorName.trim(),
      level: newSponsorLevel.trim() || 'Standard',
    };

    setSponsors([...sponsors, newSponsor]);
    setNewSponsorName('');
    setNewSponsorLevel('');
  };

  // Remove a sponsor
  const removeSponsor = sponsorId => {
    setSponsors(sponsors.filter(sponsor => sponsor.id !== sponsorId));
  };

  // Add a new speaker
  const addSpeaker = () => {
    if (newSpeakerName.trim() === '') {
      Alert.alert('Missing Information', 'Please enter speaker name.');
      return;
    }

    const newSpeaker = {
      id: Date.now().toString(),
      name: newSpeakerName.trim(),
      title: newSpeakerTitle.trim(),
      bio: newSpeakerBio.trim(),
    };

    setSpeakers([...speakers, newSpeaker]);
    setNewSpeakerName('');
    setNewSpeakerTitle('');
    setNewSpeakerBio('');
  };

  // Remove a speaker
  const removeSpeaker = speakerId => {
    setSpeakers(speakers.filter(speaker => speaker.id !== speakerId));
  };

  const handleCreateConference = async () => {
    // Validate form
    if (!title || !description || !venue || !organizerName || !organizerEmail) {
      Alert.alert('Missing Information', 'Please fill all required fields.');
      return;
    }
  
    if (!validateEmail(organizerEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
  
    if (endDate < startDate) {
      Alert.alert('Invalid Dates', 'End date must be after start date.');
      return;
    }
  
    if (!agreeToTerms) {
      Alert.alert(
        'Terms and Conditions',
        'You must agree to the terms and conditions to create an event.',
      );
      return;
    }
  
    // Combine date and time for start and end dates
    const combinedStartDate = new Date(startDate);
    combinedStartDate.setHours(
      startTime.getHours(),
      startTime.getMinutes(),
      0,
      0
    );
    
    const combinedEndDate = new Date(endDate);
    combinedEndDate.setHours(
      endTime.getHours(),
      endTime.getMinutes(),
      0,
      0
    );
  
    // Create event object
    const newEvent = {
      title,
      description,
      venue,
      organizerName,
      organizerEmail,
      organizerPhone,
      startDate: combinedStartDate.toISOString(),
      endDate: combinedEndDate.toISOString(),
      start_time: formatTime(startTime),  // Must match backend field name
      end_time: formatTime(endTime),      // Must match backend field name
      type: conferenceType,
      mode: conferenceMode,
      capacity: capacity ? parseInt(capacity, 10) : null,
      website,
      registrationFee: isFree ? '0' : regFee,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      termsAndConditions,
      sponsors,
      speakers,
    };
  
    console.log("Submitting event:", newEvent);
  
    try {
      // Set loading state
      setIsSubmitting(true);
  
      // Submit to API
      const result = await eventService.createEvent(newEvent);
  
      // Show success message
      Alert.alert(
        'Success',
        result.requiresApproval
          ? 'Your event has been submitted for approval. You will be notified once it is reviewed.'
          : 'Your event has been created successfully!',
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (error) {
      console.log('Error creating event:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create event. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render sponsor item for FlatList
  const renderSponsorItem = ({item}) => (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        <Text style={styles.listItemSubtitle}>Level: {item.level}</Text>
      </View>
      <TouchableOpacity onPress={() => removeSponsor(item.id)}>
        <Icon name="delete" size={24} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

  // Render speaker item for FlatList
  const renderSpeakerItem = ({item}) => (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        {item.title ? (
          <Text style={styles.listItemSubtitle}>{item.title}</Text>
        ) : null}
        {item.bio ? (
          <Text style={styles.listItemDescription} numberOfLines={2}>
            {item.bio}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={() => removeSpeaker(item.id)}>
        <Icon name="delete" size={24} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

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
        <Text style={styles.headerTitle}>Create New Event</Text>
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
              placeholderTextColor={'#999'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description*</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe the purpose and topics of your event"
              placeholderTextColor={'#999'}
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., healthcare, technology, education"
              placeholderTextColor={'#999'}
              value={tags}
              onChangeText={setTags}
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

          <View style={styles.dateContainer}>
            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>Start Time</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartTimePicker(true)}>
                <Text>{formatTime(startTime)}</Text>
                <Icon name="clock-outline" size={18} color="#666" />
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="default"
                  onChange={handleStartTimeChange}
                />
              )}
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>End Time</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndTimePicker(true)}>
                <Text>{formatTime(endTime)}</Text>
                <Icon name="clock-outline" size={18} color="#666" />
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="default"
                  onChange={handleEndTimeChange}
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
              placeholderTextColor={'#999'}
              value={venue}
              onChangeText={setVenue}
            />
          </View>

          {conferenceMode === 'In-Person' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Capacity</Text>
              <TextInput
                style={styles.input}
                placeholder="Maximum number of attendees"
                placeholderTextColor={'#999'}
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="number-pad"
              />
            </View>
          )}

          {/* Speakers Section */}
          <Text style={styles.sectionTitle}>Speakers</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Speaker Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter speaker name"
              placeholderTextColor={'#999'}
              value={newSpeakerName}
              onChangeText={setNewSpeakerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Speaker Title/Role</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Professor of Computer Science, CEO"
              placeholderTextColor={'#999'}
              value={newSpeakerTitle}
              onChangeText={setNewSpeakerTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Speaker Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Brief background about the speaker"
              placeholderTextColor={'#999'}
              value={newSpeakerBio}
              onChangeText={setNewSpeakerBio}
              multiline={true}
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addSpeaker}>
            <Icon name="plus" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Speaker</Text>
          </TouchableOpacity>

          {speakers.length > 0 && (
            <View style={styles.listContainer}>
              <FlatList
                data={speakers}
                renderItem={renderSpeakerItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Sponsors Section */}
          <Text style={styles.sectionTitle}>Sponsors</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sponsor Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter sponsor name"
              placeholderTextColor={'#999'}
              value={newSponsorName}
              onChangeText={setNewSponsorName}
            />
          </View>

          {/* <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sponsorship Level</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Gold, Silver, Bronze, Platinum"
              placeholderTextColor={'#999'}
              value={newSponsorLevel}
              onChangeText={setNewSponsorLevel}
            />
          </View> */}

          <TouchableOpacity style={styles.addButton} onPress={addSponsor}>
            <Icon name="plus" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Sponsor</Text>
          </TouchableOpacity>

          {sponsors.length > 0 && (
            <View style={styles.listContainer}>
              <FlatList
                data={sponsors}
                renderItem={renderSponsorItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Registration */}
          <Text style={styles.sectionTitle}>Registration</Text>
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Free Event</Text>
              <Switch
                value={isFree}
                onValueChange={setIsFree}
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={isFree ? '#2e7af5' : '#f4f3f4'}
              />
            </View>
          </View>

          {!isFree && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Registration Fee</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount (e.g., 99.99)"
                placeholderTextColor={'#999'}
                value={regFee}
                onChangeText={setRegFee}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Organizer */}
          <Text style={styles.sectionTitle}>Organizer</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Organizer Name*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., American Medical Association"
              placeholderTextColor={'#999'}
              value={organizerName}
              onChangeText={setOrganizerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Organizer Email*</Text>
            <TextInput
              style={styles.input}
              placeholder="contact@example.com"
              placeholderTextColor={'#999'}
              value={organizerEmail}
              onChangeText={setOrganizerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Organizer Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., +1 (555) 123-4567"
              placeholderTextColor={'#999'}
              value={organizerPhone}
              onChangeText={setOrganizerPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Terms and Conditions */}
          <Text style={styles.sectionTitle}>Terms and Conditions</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Terms and Conditions</Text>
            <TextInput
              style={[styles.input, styles.termsTextarea]}
              placeholder="Enter the terms and conditions for your event"
              placeholderTextColor={'#999'}
              value={termsAndConditions}
              onChangeText={setTermsAndConditions}
              multiline={true}
              numberOfLines={6}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAgreeToTerms(!agreeToTerms)}>
                {agreeToTerms && (
                  <Icon name="check" size={16} color="#2e7af5" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                I agree to the terms and conditions for creating this event
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateConference}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Event</Text>
            )}
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
    backgroundColor: 'white',
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
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  termsTextarea: {
    height: 150,
    textAlignVertical: 'top',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2e7af5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#2e7af5',
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  listContainer: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
  },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateConferenceScreen;
