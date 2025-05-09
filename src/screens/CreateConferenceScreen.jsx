import React, { useState, useEffect } from 'react'; // Import useEffect
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
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api'; // Assuming eventService exists and has a createEvent method

const CreateConferenceScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // --- Existing States ---
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
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Speakers & Sponsors States ---
  const [sponsors, setSponsors] = useState([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorLevel, setNewSponsorLevel] = useState(''); // Assuming you might add this back

  const [speakers, setSpeakers] = useState([]);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [newSpeakerTitle, setNewSpeakerTitle] = useState('');
  const [newSpeakerBio, setNewSpeakerBio] = useState('');

  // --- New State for Daily Schedules ---
  const [dailySchedules, setDailySchedules] = useState([]);
  // State to manage which time picker is open and for which day/time type
  const [showTimePicker, setShowTimePicker] = useState({
    visible: false,
    date: null, // The date object for the day being edited
    type: null, // 'start' or 'end'
  });

  // --- Helper Functions ---
  const formatDate = date => {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const formatTime = date => {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`; // Removed seconds for simplicity
  };

  const validateEmail = email => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Helper to generate dates between two dates
  const getDatesBetween = (start, end) => {
    const dates = [];
    let currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0); // Normalize date to start of day
    const endDateNormalized = new Date(end);
    endDateNormalized.setHours(0, 0, 0, 0); // Normalize end date

    while (currentDate <= endDateNormalized) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // Function to initialize/regenerate daily schedules based on start/end dates
  const generateDailySchedules = (start, end) => {
    const dates = getDatesBetween(start, end);
    // Default times (e.g., 9 AM to 5 PM)
    const defaultStartTime = new Date();
    defaultStartTime.setHours(9, 0, 0, 0);
    const defaultEndTime = new Date();
    defaultEndTime.setHours(17, 0, 0, 0);

    const schedules = dates.map(date => ({
      date: date,
      startTime: new Date(date.setHours(defaultStartTime.getHours(), defaultStartTime.getMinutes(), 0, 0)), // Combine date with default start time
      endTime: new Date(date.setHours(defaultEndTime.getHours(), defaultEndTime.getMinutes(), 0, 0)), // Combine date with default end time
    }));
    setDailySchedules(schedules);
  };

  // --- Effects ---
  useEffect(() => {
    // Generate initial daily schedules when the component mounts
    generateDailySchedules(startDate, endDate);
  }, []); // Empty dependency array means this runs once on mount

  // --- Date Picker Handlers ---
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newStartDate = new Date(selectedDate);
      setStartDate(newStartDate);
      // If end date is before new start date, update end date and regenerate schedules
      if (endDate < newStartDate) {
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + 1); // Default 1 day duration
        setEndDate(newEndDate);
        generateDailySchedules(newStartDate, newEndDate);
      } else {
        // Only start date changed, regenerate schedules based on the new range
        generateDailySchedules(newStartDate, endDate);
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const newEndDate = new Date(selectedDate);
      // Ensure end date is not before start date
      if (newEndDate < startDate) {
         Alert.alert('Invalid Dates', 'End date must be after or the same as the start date.');
         // Optionally reset to previous valid end date or start date
         // setEndDate(new Date(startDate)); // Option: reset to start date
         generateDailySchedules(startDate, startDate); // Option: generate schedule for a single day
      } else {
         setEndDate(newEndDate);
         // Regenerate schedules based on the new range
         generateDailySchedules(startDate, newEndDate);
      }
    }
  };

  // --- Daily Time Picker Handlers ---
  const handleOpenTimePicker = (date, type) => {
    setShowTimePicker({ visible: true, date: date, type: type });
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker({ ...showTimePicker, visible: false }); // Hide picker first
    const { date: currentDay, type } = showTimePicker;

    if (selectedTime && currentDay && type) {
      const updatedSchedules = dailySchedules.map(schedule => {
        // Find the schedule for the day being edited (compare by date part)
        if (schedule.date.toDateString() === currentDay.toDateString()) {
          const newTime = new Date(selectedTime);
          const updatedTime = new Date(schedule.date); // Start with the original date
          updatedTime.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0); // Set the new time

          // Basic validation: Ensure end time is not before start time for the same day
          if (type === 'start') {
             if (updatedTime > schedule.endTime) {
                Alert.alert('Invalid Time', 'Start time cannot be after end time for this day.');
                return schedule; // Return original schedule if invalid
             }
          } else if (type === 'end') {
             if (updatedTime < schedule.startTime) {
                 Alert.alert('Invalid Time', 'End time cannot be before start time for this day.');
                 return schedule; // Return original schedule if invalid
             }
          }

          return {
            ...schedule,
            [type === 'start' ? 'startTime' : 'endTime']: updatedTime,
          };
        }
        return schedule;
      });
      setDailySchedules(updatedSchedules);
    }
  };

  // --- Add/Remove Sponsors ---
  const addSponsor = () => {
    if (newSponsorName.trim() === '') {
      Alert.alert('Missing Information', 'Please enter sponsor name.');
      return;
    }

    const newSponsor = {
      id: Date.now().toString(),
      name: newSponsorName.trim(),
      // level: newSponsorLevel.trim() || 'Standard', // Uncomment if you add level input back
    };

    setSponsors([...sponsors, newSponsor]);
    setNewSponsorName('');
    // setNewSponsorLevel(''); // Uncomment if you add level input back
  };

  const removeSponsor = sponsorId => {
    setSponsors(sponsors.filter(sponsor => sponsor.id !== sponsorId));
  };

  // --- Add/Remove Speakers ---
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

  const removeSpeaker = speakerId => {
    setSpeakers(speakers.filter(speaker => speaker.id !== speakerId));
  };


  // --- Handle Create Conference ---
  const handleCreateConference = async () => {
    // Basic validation for required fields (adjust based on isAdmin)
    if (!title || (isAdmin && (!venue && conferenceMode === 'In-Person')) || (isAdmin && !organizerName) || (isAdmin && !organizerEmail) || (isAdmin && !agreeToTerms)) {
       Alert.alert('Missing Information', 'Please fill all required fields.');
       return;
    }

    if (isAdmin && !validateEmail(organizerEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (endDate < startDate) {
      Alert.alert('Invalid Dates', 'End date must be after or the same as the start date.');
      return;
    }

    // Per-day time validation
    for (const schedule of dailySchedules) {
       if (schedule.endTime < schedule.startTime) {
           Alert.alert('Invalid Daily Time', `End time for ${formatDate(schedule.date)} cannot be before start time.`);
           return;
       }
    }

    if (isAdmin && !agreeToTerms) {
      Alert.alert(
        'Terms and Conditions',
        'You must agree to the terms and conditions to create an event.',
      );
      return;
    }

    // Prepare daily schedule data for API
    const formattedDailySchedules = dailySchedules.map(schedule => ({
       date: formatDate(schedule.date),
       start_time: formatTime(schedule.startTime),
       end_time: formatTime(schedule.endTime),
    }));


    // Create event object for API
    const newEvent = {
      title,
      description,
      venue, // Venue is included regardless, backend might ignore if mode is Virtual
      organizerName,
      organizerEmail,
      organizerPhone,
      // Use the first day's start date and last day's end date for overall range
      // Or, if backend supports it, send the full dailySchedules array
      startDate: dailySchedules.length > 0 ? dailySchedules[0].date.toISOString() : new Date().toISOString(), // Fallback
      endDate: dailySchedules.length > 0 ? dailySchedules[dailySchedules.length - 1].date.toISOString() : new Date().toISOString(), // Fallback
      // Do NOT send single start_time/end_time fields if using daily schedules
      // start_time: formatTime(startTime), // REMOVE THIS
      // end_time: formatTime(endTime), // REMOVE THIS
      dailySchedules: formattedDailySchedules, // ADD THIS ARRAY

      type: conferenceType,
      mode: conferenceMode,
      capacity: capacity ? parseInt(capacity, 10) : null,
      website,
      registrationFee: isFree ? '0' : regFee,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      termsAndConditions,
      sponsors, // Assuming backend can handle array of { id, name, level }
      speakers, // Assuming backend can handle array of { id, name, title, bio }
    };

    console.log("Submitting event:", newEvent);

    try {
      setIsSubmitting(true);
      // Submit to API - **ensure eventService.createEvent can handle the dailySchedules array**
      const result = await eventService.createEvent(newEvent);

      Alert.alert(
        'Success',
        result.requiresApproval
          ? 'Your event has been submitted for approval. You will be notified once it is reviewed.'
          : 'Your event has been created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.log('Error creating event:', error.message || error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create event. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Items ---
  const renderSponsorItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        {/* {item.level ? ( // Uncomment if you add level input back
          <Text style={styles.listItemSubtitle}>Level: {item.level}</Text>
        ) : null} */}
      </View>
      <TouchableOpacity onPress={() => removeSponsor(item.id)}>
        <Icon name="delete" size={24} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

  const renderSpeakerItem = ({ item }) => (
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

  // Render item for daily schedules
  const renderDailyScheduleItem = ({ item }) => (
    <View style={styles.dailyScheduleItem}>
      <Text style={styles.dailyScheduleDate}>{formatDate(item.date)}</Text>
      <View style={styles.dailyScheduleTimes}>
        <TouchableOpacity
          style={styles.timeInput}
          onPress={() => handleOpenTimePicker(item.date, 'start')}>
          <Text>{formatTime(item.startTime)}</Text>
          <Icon name="clock-outline" size={18} color="#666" />
        </TouchableOpacity>
        <Text style={styles.timeSeparator}>-</Text>
        <TouchableOpacity
          style={styles.timeInput}
          onPress={() => handleOpenTimePicker(item.date, 'end')}>
          <Text>{formatTime(item.endTime)}</Text>
          <Icon name="clock-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>
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

          {isAdmin && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., healthcare, technology, education"
                placeholderTextColor={'#999'}
                value={tags}
                onChangeText={setTags}
              />
              <Text style={styles.adminOnlyLabel}>Admin only field</Text>
            </View>
          )}

          {/* Date Range */}
          <Text style={styles.sectionTitle}>Date Range</Text>
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
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndDateChange}
                  minimumDate={startDate} // Ensure end date is not before start date
                />
              )}
            </View>
          </View>

          {/* Daily Time Schedules */}
           {dailySchedules.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Daily Schedule</Text>
                <View style={styles.listContainer}>
                   <FlatList
                     data={dailySchedules}
                     renderItem={renderDailyScheduleItem}
                     keyExtractor={(item) => item.date.toISOString()} // Use date as key
                     scrollEnabled={false}
                   />
                </View>
              </>
           )}

           {/* Time Picker Modal (Single picker for all daily time selections) */}
           {showTimePicker.visible && (
             <DateTimePicker
               value={showTimePicker.date || new Date()} // Use the date of the schedule item, fallback to current date
               mode="time"
               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
               onChange={handleTimeChange}
             />
           )}


          {/* Location */}
          {isAdmin && (<>
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
            </>)}

          {/* Speakers Section */}
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>
                Speakers <Text style={styles.adminOnlyText}>(Admin Only)</Text>
              </Text>
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
            </>
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

          {/* Uncomment if you add the level input back
          <View style={styles.inputGroup}>
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
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>
                Registration <Text style={styles.adminOnlyText}>(Admin Only)</Text>
              </Text>
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Free Event</Text>
                  <Switch
                    value={isFree}
                    onValueChange={setIsFree}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
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
            </>
          )}

          {/* Organizer */}
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>
                Organizer <Text style={styles.adminOnlyText}>(Admin Only)</Text>
              </Text>
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
            </>
          )}

          {/* Website */}
          <View style={styles.inputGroup}>
             <Text style={styles.inputLabel}>Website (Optional)</Text>
             <TextInput
               style={styles.input}
               placeholder="e.g., https://www.yourevent.com"
               placeholderTextColor={'#999'}
               value={website}
               onChangeText={setWebsite}
               keyboardType="url"
               autoCapitalize="none"
             />
          </View>


          {/* Terms and Conditions */}
          {isAdmin &&(
            <>
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
                  I agree to the terms and conditions for creating this event*
                </Text>
              </View>
            </View>
            </>
          ) }

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
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
  adminOnlyText: {
     fontSize: 12,
     fontWeight: 'normal',
     color: '#666',
  },
  adminOnlyLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
    color: '#333', // Ensure text color is visible
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
  dailyScheduleItem: {
     backgroundColor: 'white',
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#ddd',
     padding: 12,
     marginBottom: 8,
  },
  dailyScheduleDate: {
     fontSize: 16,
     fontWeight: '500',
     color: '#333',
     marginBottom: 8,
  },
  dailyScheduleTimes: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
  },
  timeInput: {
     flexDirection: 'row',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#ddd',
     borderRadius: 8,
     paddingHorizontal: 10,
     paddingVertical: 8,
     flex: 1, // Take up equal space
     justifyContent: 'space-between',
  },
  timeSeparator: {
     marginHorizontal: 8,
     fontSize: 16,
     color: '#666',
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
    //backgroundColor: 'white', // Background applied to individual items
    //borderRadius: 8,
    //borderWidth: 1,
    //borderColor: '#ddd',
    //padding: 8, // Padding applied to items
  },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    backgroundColor: 'white', // Apply background here
    borderRadius: 8, // Apply border radius here
    marginBottom: 8, // Add margin between items
    borderWidth: 1,
    borderColor: '#ddd',
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
   createButtonDisabled: {
       backgroundColor: '#a0c3f9', // Lighter color when disabled
   },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateConferenceScreen;