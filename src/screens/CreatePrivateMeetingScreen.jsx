import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';
import api from '../services/api';
import {meetingService} from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CreatePrivateMeetingScreen = ({navigation}) => {
  const {user} = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);

  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    location: '',
    mode: 'online', // 'online' or 'in-person'
    meetingLink: '',
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 60 * 60 * 1000), // Default to 1 hour later
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Fetch doctors list
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [searchQuery, doctors]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await meetingService.getAllDoctors();
      setDoctors(response);
      setFilteredDoctors(response);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      // Keep the time from the existing startDate, but update the date
      const newDate = new Date(selectedDate);
      const currentStartTime = meetingData.startTime;

      newDate.setHours(
        currentStartTime.getHours(),
        currentStartTime.getMinutes(),
        0,
        0,
      );

      setMeetingData(prev => ({
        ...prev,
        startDate: newDate,
        startTime: newDate,
      }));
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Keep the time from the existing endDate, but update the date
      const newDate = new Date(selectedDate);
      const currentEndTime = meetingData.endTime;

      newDate.setHours(
        currentEndTime.getHours(),
        currentEndTime.getMinutes(),
        0,
        0,
      );

      setMeetingData(prev => ({
        ...prev,
        endDate: newDate,
        endTime: newDate,
      }));
    }
  };

  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      // Keep the date from startDate, but update the time
      const newDateTime = new Date(meetingData.startDate);
      newDateTime.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0,
      );

      setMeetingData(prev => ({
        ...prev,
        startTime: newDateTime,
      }));
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      // Keep the date from endDate, but update the time
      const newDateTime = new Date(meetingData.endDate);
      newDateTime.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0,
      );

      setMeetingData(prev => ({
        ...prev,
        endTime: newDateTime,
      }));
    }
  };

  const toggleDoctorSelection = doctor => {
    const isSelected = selectedDoctors.some(doc => doc.id === doctor.id);

    if (isSelected) {
      setSelectedDoctors(selectedDoctors.filter(doc => doc.id !== doctor.id));
    } else {
      setSelectedDoctors([...selectedDoctors, doctor]);
    }
  };

  const validateForm = () => {
    if (!meetingData.title) {
      Alert.alert('Missing Information', 'Please enter a meeting title');
      return false;
    }

    if (!meetingData.description) {
      Alert.alert('Missing Information', 'Please enter a meeting description');
      return false;
    }

    if (meetingData.mode === 'in-person' && !meetingData.location) {
      Alert.alert(
        'Missing Information',
        'Please enter a location for the in-person meeting',
      );
      return false;
    }

    if (meetingData.mode === 'online' && !meetingData.meetingLink) {
      Alert.alert(
        'Missing Information',
        'Please enter a meeting link for the online meeting',
      );
      return false;
    }

    if (selectedDoctors.length === 0) {
      Alert.alert(
        'Missing Information',
        'Please select at least one doctor for the meeting',
      );
      return false;
    }

    // Check if end date/time is after start date/time
    if (meetingData.endTime <= meetingData.startTime) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return false;
    }

    return true;
  };

  const handleCreateMeeting = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Format dates for consistency with backend expectations
      const formattedStartTime = `${meetingData.startTime
        .getHours()
        .toString()
        .padStart(2, '0')}:${meetingData.startTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      const formattedEndTime = `${meetingData.endTime
        .getHours()
        .toString()
        .padStart(2, '0')}:${meetingData.endTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const meetingPayload = {
        title: meetingData.title,
        description: meetingData.description,
        startDate: meetingData.startDate.toISOString(),
        endDate: meetingData.endDate.toISOString(),
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        venue:
          meetingData.mode === 'in-person'
            ? meetingData.location
            : 'Virtual Meeting',
        mode: meetingData.mode === 'online' ? 'Virtual' : 'In-Person', // Match the enum in the backend
        meetingLink:
          meetingData.mode === 'online' ? meetingData.meetingLink : null,
        invitedDoctors: selectedDoctors.map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
        })),
      };

      console.log('Sending meeting payload:', meetingPayload);
      const result = await meetingService.createPrivateMeeting(meetingPayload);

      Alert.alert(
        'Success',
        'Private meeting created successfully! Selected doctors will be notified.',
        [{text: 'OK', onPress: () => navigation.navigate('MyMeetings')}],
      );
    } catch (error) {
      console.error('Failed to create private meeting:', error);
      Alert.alert(
        'Error',
        `Failed to create meeting: ${error.message || 'Please try again.'}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!meetingData.title) {
      Alert.alert('Error', 'Meeting title is required');
      return;
    }

    if (!meetingData.venue) {
      Alert.alert('Error', 'Meeting venue is required');
      return;
    }

    if (meetingData.mode === 'Virtual' && !meetingData.meetingLink) {
      Alert.alert('Error', 'Meeting link is required for virtual meetings');
      return;
    }

    if (selectedDoctors.length === 0) {
      Alert.alert('Error', 'Please select at least one doctor to invite');
      return;
    }

    try {
      setSubmitting(true);

      // Format dates for API
      const formattedData = {
        title: meetingData.title,
        description: meetingData.description,
        startDate: meetingData.startDate.toISOString(),
        endDate: meetingData.endDate.toISOString(),
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        venue: meetingData.venue,
        mode: meetingData.mode,
        meetingLink: meetingData.meetingLink,
        // Add organizer name from user context
        organizerName: user?.name || 'Pharma Representative',
        invitedDoctors: selectedDoctors,
      };

      console.log('Sending meeting payload:', formattedData);
      const result = await meetingService.createPrivateMeeting(formattedData);

      Alert.alert('Success', 'Private meeting created and invitations sent', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MyMeetings'),
        },
      ]);
    } catch (error) {
      console.error('Failed to create meeting:', error);
      Alert.alert(
        'Error',
        'Failed to create private meeting. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };
  const formatDate = date => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = time => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDoctorItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.doctorItem,
        selectedDoctors.some(doc => doc.id === item.id) &&
          styles.selectedDoctorItem,
      ]}
      onPress={() => toggleDoctorSelection(item)}>
      <View style={styles.doctorInfo}>
        <View style={styles.doctorIcon}>
          <Text style={styles.doctorInitial}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.doctorDetails}>
          <Text style={styles.doctorName}>{item.name}</Text>
          {item.specialty && (
            <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
          )}
        </View>
      </View>
      <View style={styles.selectionIndicator}>
        {selectedDoctors.some(doc => doc.id === item.id) ? (
          <Icon name="check-circle" size={24} color="#4CAF50" />
        ) : (
          <Icon name="checkbox-blank-circle-outline" size={24} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {paddingTop: useSafeAreaInsets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Private Meeting</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Meeting Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title*</Text>
            <TextInput
              style={styles.input}
              value={meetingData.title}
              onChangeText={text =>
                setMeetingData({...meetingData, title: text})
              }
              placeholder="Enter meeting title"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description*</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={meetingData.description}
              onChangeText={text =>
                setMeetingData({...meetingData, description: text})
              }
              placeholder="Enter meeting description"
              multiline={true}
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Meeting Type</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  meetingData.mode === 'online' && styles.toggleButtonActive,
                ]}
                onPress={() =>
                  setMeetingData({...meetingData, mode: 'online'})
                }>
                <Icon
                  name="video"
                  size={18}
                  color={meetingData.mode === 'online' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    meetingData.mode === 'online' &&
                      styles.toggleButtonTextActive,
                  ]}>
                  Online
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  meetingData.mode === 'in-person' && styles.toggleButtonActive,
                ]}
                onPress={() =>
                  setMeetingData({...meetingData, mode: 'in-person'})
                }>
                <Icon
                  name="map-marker"
                  size={18}
                  color={meetingData.mode === 'in-person' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    meetingData.mode === 'in-person' &&
                      styles.toggleButtonTextActive,
                  ]}>
                  In Person
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {meetingData.mode === 'online' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Meeting Link*</Text>
              <TextInput
                style={styles.input}
                value={meetingData.meetingLink}
                onChangeText={text =>
                  setMeetingData({...meetingData, meetingLink: text})
                }
                placeholder="Enter video meeting link"
                keyboardType="url"
              />
            </View>
          )}

          {meetingData.mode === 'in-person' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location*</Text>
              <TextInput
                style={styles.input}
                value={meetingData.location}
                onChangeText={text =>
                  setMeetingData({...meetingData, location: text})
                }
                placeholder="Enter meeting location"
              />
            </View>
          )}

          <View style={styles.dateTimeSection}>
            <View style={styles.dateTimeColumn}>
              <Text style={styles.inputLabel}>Start Date*</Text>
              <TouchableOpacity
                style={styles.dateTimePicker}
                onPress={() => setShowStartDatePicker(true)}>
                <Icon name="calendar" size={20} color="#666" />
                <Text style={styles.dateTimeText}>
                  {formatDate(meetingData.startDate)}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={meetingData.startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartDateChange}
                />
              )}
            </View>

            <View style={styles.dateTimeColumn}>
              <Text style={styles.inputLabel}>End Date*</Text>
              <TouchableOpacity
                style={styles.dateTimePicker}
                onPress={() => setShowEndDatePicker(true)}>
                <Icon name="calendar" size={20} color="#666" />
                <Text style={styles.dateTimeText}>
                  {formatDate(meetingData.endDate)}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={meetingData.endDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndDateChange}
                />
              )}
            </View>
          </View>

          <View style={styles.dateTimeSection}>
            <View style={styles.dateTimeColumn}>
              <Text style={styles.inputLabel}>Start Time*</Text>
              <TouchableOpacity
                style={styles.dateTimePicker}
                onPress={() => setShowStartTimePicker(true)}>
                <Icon name="clock-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>
                  {formatTime(meetingData.startTime)}
                </Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={meetingData.startTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartTimeChange}
                />
              )}
            </View>

            <View style={styles.dateTimeColumn}>
              <Text style={styles.inputLabel}>End Time*</Text>
              <TouchableOpacity
                style={styles.dateTimePicker}
                onPress={() => setShowEndTimePicker(true)}>
                <Icon name="clock-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>
                  {formatTime(meetingData.endTime)}
                </Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={meetingData.endTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndTimeChange}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Select Doctors to Invite</Text>
          <Text style={styles.sectionSubtitle}>
            This meeting will only be visible to doctors you select
          </Text>

          <View style={styles.searchContainer}>
            <Icon
              name="magnify"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search doctors..."
            />
          </View>

          <View style={styles.selectedCount}>
            <Text style={styles.selectedCountText}>
              Selected: {selectedDoctors.length} doctor
              {selectedDoctors.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2e7af5" />
              <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
          ) : (
            <View style={styles.doctorsList}>
              <FlatList
                data={filteredDoctors}
                renderItem={renderDoctorItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Icon name="doctor" size={40} color="#ccc" />
                    <Text style={styles.emptyListText}>No doctors found</Text>
                  </View>
                }
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={submitting}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateMeeting}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Meeting</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  toggleButtonActive: {
    backgroundColor: '#2e7af5',
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  dateTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateTimeColumn: {
    flex: 1,
    marginRight: 8,
  },
  dateTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedCount: {
    marginBottom: 16,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2e7af5',
  },
  doctorsList: {
    maxHeight: 400,
  },
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDoctorItem: {
    backgroundColor: '#e8f4ff',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2e7af5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doctorInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectionIndicator: {
    padding: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#2e7af5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreatePrivateMeetingScreen;
