import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {adminService} from '../../services/api';

const EventDaysManagementScreen = ({route, navigation}) => {
  const {eventId, eventTitle} = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventDays, setEventDays] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState({
    visible: false,
    dayIndex: 0,
    timeType: 'start', // 'start' or 'end'
  });

  useEffect(() => {
    fetchEventDays();
  }, []);

  const fetchEventDays = async () => {
    try {
      setLoading(true);
      const days = await adminService.getEventDays(eventId);
      setEventDays(days);
    } catch (error) {
      console.error('Error fetching event days:', error);
      Alert.alert('Error', 'Failed to load event days');
    } finally {
      setLoading(false);
    }
  };

  const updateDayField = (dayIndex, field, value) => {
    const updatedDays = [...eventDays];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      [field]: value,
    };
    setEventDays(updatedDays);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker({...showTimePicker, visible: false});

    if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5); // HH:MM format
      const field =
        showTimePicker.timeType === 'start' ? 'start_time' : 'end_time';
      updateDayField(showTimePicker.dayIndex, field, timeString);
    }
  };

  const showTimePickerForDay = (dayIndex, timeType) => {
    setShowTimePicker({
      visible: true,
      dayIndex,
      timeType,
    });
  };

  const saveEventDays = async () => {
    try {
      setSaving(true);
      await adminService.updateEventDays(eventId, eventDays);
      Alert.alert('Success', 'Event days updated successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Error saving event days:', error);
      Alert.alert('Error', 'Failed to save event days');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7af5" />
        <Text style={styles.loadingText}>Loading event days...</Text>
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Manage Event Days</Text>
          <Text style={styles.headerSubtitle}>{eventTitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {eventDays.map((day, index) => (
          <View key={day.id || index} style={styles.dayCard}>
            <Text style={styles.dayTitle}>Day {day.day_number}</Text>
            <Text style={styles.dayDate}>
              {new Date(day.date).toLocaleDateString()}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue/Location</Text>
              <TextInput
                style={styles.input}
                value={day.venue || ''}
                onChangeText={text => updateDayField(index, 'venue', text)}
                placeholder="Enter venue for this day"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue Address</Text>
              <TextInput
                style={styles.input}
                value={day.venue_address || ''}
                onChangeText={text =>
                  updateDayField(index, 'venue_address', text)
                }
                placeholder="Enter full address"
                multiline
              />
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => showTimePickerForDay(index, 'start')}>
                  <Text style={styles.timeText}>
                    {day.start_time || 'Select Time'}
                  </Text>
                  <Icon name="clock-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.timeGroup}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => showTimePickerForDay(index, 'end')}>
                  <Text style={styles.timeText}>
                    {day.end_time || 'Select Time'}
                  </Text>
                  <Icon name="clock-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Day Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={day.description || ''}
                onChangeText={text =>
                  updateDayField(index, 'description', text)
                }
                placeholder="Describe what happens on this day"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Capacity (Optional)</Text>
              <TextInput
                style={styles.input}
                value={day.capacity?.toString() || ''}
                onChangeText={text =>
                  updateDayField(
                    index,
                    'capacity',
                    text ? parseInt(text) : null,
                  )
                }
                placeholder="Max attendees for this day"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={day.special_notes || ''}
                onChangeText={text =>
                  updateDayField(index, 'special_notes', text)
                }
                placeholder="Any special instructions or notes"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveEventDays}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save All Days</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {showTimePicker.visible && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dayDate: {
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
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeGroup: {
    flex: 0.48,
  },
  timeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#2e7af5',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EventDaysManagementScreen;
