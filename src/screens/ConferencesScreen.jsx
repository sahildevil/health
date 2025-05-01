import React, {useState, useEffect} from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import {Calendar} from 'react-native-calendars';
import {eventService} from '../services/api'; // Import the API service
import {useAuth} from '../context/AuthContext';

const ConferencesScreen = ({navigation}) => {
  const {user} = useAuth(); // Get current user
  const [activeTab, setActiveTab] = useState('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState([]); // State for events
  const [loading, setLoading] = useState(true); // State for loading
  const [registeredEvents, setRegisteredEvents] = useState([]); // Add this state

  const formatDate = dateString => {
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Helper function to format time
  const formatTime = timeString => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Fetch events from the database
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getAllEvents(); // Fetch events from API
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      Alert.alert('Error', 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch registered events
  const fetchRegisteredEvents = async () => {
    try {
      const data = await eventService.getRegisteredEvents();
      setRegisteredEvents(data.map(event => event.id));
    } catch (error) {
      console.error('Failed to fetch registered events:', error);
    }
  };

  useEffect(() => {
    fetchEvents(); // Fetch events when the screen loads
    fetchRegisteredEvents();
  }, []);

  // Filter events based on active tab, search query, and selected date
  const filteredEvents = events.filter(event => {
    // Filter based on active tab
    if (activeTab === 'Conferences' && event.type !== 'Conference') {
      return false;
    }

    if (activeTab === 'Meetings' && event.type !== 'Meeting') {
      return false;
    }

    // Filter based on search query
    if (
      searchQuery &&
      !event.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filter based on date (if selected)
    if (selectedDate && !event.start_date.includes(selectedDate)) {
      return false;
    }

    return true;
  });

  const renderEventCard = event => (
    <View style={styles.eventCard} key={event.id}>
      <View style={styles.eventBadgeContainer}>
        <View
          style={[styles.badge, styles[event.type.toLowerCase() + 'Badge']]}>
          <Text style={styles.badgeText}>{event.type}</Text>
        </View>
        <View
          style={[styles.badge, styles[event.status.toLowerCase() + 'Badge']]}>
          <Text style={styles.badgeText}>{event.status}</Text>
        </View>
      </View>

      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventDescription}>{event.description}</Text>

      <View style={styles.eventDetails}>
        <View style={styles.eventDetailItem}>
          <Icon name="calendar" size={16} color="#666" />
          <Text style={styles.eventDetailText}>
            {formatDate(event.start_date)} - {formatDate(event.end_date)}
          </Text>
        </View>

        <View style={styles.eventDetailItem}>
          <Icon name="clock" size={16} color="#666" />
          <Text style={styles.eventDetailText}>
            {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </Text>
        </View>

        <View style={styles.eventDetailItem}>
          <Icon name="map-marker" size={16} color="#666" />
          <Text style={styles.eventDetailText}>{event.venue}</Text>
        </View>
        <View style={styles.eventDetailItem}>
          <Icon name="account-group" size={16} color="#666" />
          <Text style={styles.eventDetailText}>{event.organizer_name}</Text>
        </View>
      </View>

      <View style={styles.eventButtonContainer}>
        <TouchableOpacity
          style={styles.eventButton}
          onPress={() =>
            navigation.navigate('EventDetails', {eventId: event.id})
          }>
          <Text style={styles.eventButtonText}>View Details</Text>
        </TouchableOpacity>

        {/* Only show register button if user is not the organizer */}
        {user?.id !== event.organizer_id &&
          (registeredEvents.includes(event.id) ? (
            <TouchableOpacity
              style={[styles.eventButton, styles.registeredButton]}
              disabled={true}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <AntDesignIcon name="checkcircle" size={14} color="#fff" />
                <Text style={[styles.registeredButtonText, {marginLeft: 5}]}>
                   Registered
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.eventButton, styles.registerButton]}
              onPress={() =>
                navigation.navigate('EventRegistration', {eventId: event.id})
              }>
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>
              Browse and Register For Events.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateConference')}>
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon
            name="magnify"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(!showDatePicker)}>
          <Icon name="calendar" size={20} color="#666" />
          <Text style={styles.datePickerText}>
            {selectedDate || 'Search by date'}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <Calendar
          style={styles.calendar}
          onDayPress={day => {
            setSelectedDate(day.dateString);
            setShowDatePicker(false);
          }}
          markedDates={{
            [selectedDate]: {selected: true, selectedColor: '#2e7af5'},
          }}
        />
      )}

      {/* Event Type Tabs */}
      <View style={styles.tabsContainer}>
        {['All Events', 'Conferences', 'Meetings'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.tab, activeTab === type && styles.activeTab]}
            onPress={() => setActiveTab(type)}>
            <Text
              style={[
                styles.tabText,
                activeTab === type && styles.activeTabText,
              ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Event Cards */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2e7af5"
          style={{marginTop: 20}}
        />
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.eventsContainer}>
            {filteredEvents.map(event => renderEventCard(event))}
          </View>
        </ScrollView>
      )}
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
    padding: 20,
    paddingBottom: 0,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7af5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  filterButtonText: {
    color: '#2e7af5',
    marginHorizontal: 4,
    fontSize: 14,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  datePickerText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 14,
  },
  calendar: {
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    marginRight: 24,
    paddingBottom: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2e7af5',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2e7af5',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  eventsContainer: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eventBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  conferenceBadge: {
    backgroundColor: '#EBE9FD',
  },
  meetingBadge: {
    backgroundColor: '#D1F2EA',
  },
  upcomingBadge: {
    backgroundColor: '#EBE9FD',
  },
  ongoingBadge: {
    backgroundColor: '#E3F5DB',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7B68EE',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  eventButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  eventButtonText: {
    color: '#2e7af5',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  registeredButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  registeredButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ConferencesScreen;
