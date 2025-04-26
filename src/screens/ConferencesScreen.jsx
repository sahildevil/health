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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Calendar} from 'react-native-calendars';

const ConferencesScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Sample data
  const eventTypes = [
    {name: 'All Events', count: 8},
    {name: 'Conferences', count: 5},
    {name: 'Meetings', count: 3},
  ];

  const events = [
    {
      type: 'Conference',
      status: 'Upcoming',
      title: 'Cardiology Summit 2025',
      description:
        'The latest advancements in cardiovascular care and research, featuring leading experts from around the world.',
      startDate: 'Jun 15, 2025',
      endDate: 'Jun 17, 2025',
      location: 'New York Medical Center',
      organizer: 'Organized by American Cardiology Foundation',
    },
    {
      type: 'Conference',
      status: 'Upcoming',
      title: 'Neurology Conference',
      description:
        'Exploring new frontiers in neurological disorders and treatments with interactive workshops and presentations.',
      startDate: 'Aug 10, 2025',
      endDate: 'Aug 12, 2025',
      location: 'Boston Convention Center',
      organizer: 'Organized by Neurology Research Foundation',
    },
    {
      type: 'Conference',
      status: 'Upcoming',
      title: 'Virtual Medical Education Symposium',
      description:
        'A fully virtual symposium focused on the future of medical education and digital learning platforms.',
      startDate: 'Apr 5, 2025',
      endDate: 'Apr 7, 2025',
      location: 'Virtual Event',
      organizer: 'Organized by Medical Education Institute',
    },
    {
      type: 'Meeting',
      status: 'Upcoming',
      title: 'Pediatrics Monthly Meeting',
      description:
        'Regular meeting for pediatricians to discuss recent cases, research findings, and departmental updates.',
      startDate: 'Apr 28, 2025',
      endDate: 'Apr 28, 2025',
      location: "Children's Hospital Conference Room",
      organizer: "Organized by Children's Hospital Pediatrics Department",
    },
    {
      type: 'Meeting',
      status: 'Ongoing',
      title: 'Pharmaceutical Research Collaboration',
      description:
        'Meeting between pharmaceutical researchers and practicing physicians to discuss current clinical trials and research needs.',
      startDate: 'Apr 25, 2025',
      endDate: 'Apr 27, 2025',
      location: 'Virtual Event',
      organizer: 'Organized by PharmaCompany',
    },
    {
      type: 'Conference',
      status: 'Upcoming',
      title: 'Medical Technology Expo',
      description:
        'Exhibition of the latest medical technologies, devices, and software solutions for healthcare professionals.',
      startDate: 'Sep 20, 2025',
      endDate: 'Sep 22, 2025',
      location: 'San Francisco Tech Center',
      organizer: 'Organized by MedTech Association',
    },
  ];

  const filteredEvents = events.filter(event => {
    // Filter based on active tab
    if (
      activeTab !== 'All Events' &&
      !event.type.includes(activeTab.slice(0, -4))
    ) {
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
    // This is simplified - in a real app you'd check if the event date range contains the selected date
    if (selectedDate && !event.startDate.includes(selectedDate)) {
      return false;
    }

    return true;
  });

  const renderEventCard = event => (
    <View style={styles.eventCard} key={event.title}>
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
            {event.startDate} - {event.endDate}
          </Text>
        </View>
        <View style={styles.eventDetailItem}>
          <Icon name="map-marker" size={16} color="#666" />
          <Text style={styles.eventDetailText}>{event.location}</Text>
        </View>
        <View style={styles.eventDetailItem}>
          <Icon name="account-group" size={16} color="#666" />
          <Text style={styles.eventDetailText}>{event.organizer}</Text>
        </View>
      </View>

      <View style={styles.eventButtonContainer}>
        <TouchableOpacity style={styles.eventButton} onPress={() => {}}>
          <Text style={styles.eventButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.eventButton, styles.registerButton]}
          onPress={() => {}}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Conferences</Text>
            <Text style={styles.headerSubtitle}>
              Browse and register for upcoming medical conferences
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
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={() => {}}>
          <Icon name="filter-variant" size={20} color="#2e7af5" />
          <Text style={styles.filterButtonText}>All Events</Text>
          <Icon name="chevron-down" size={16} color="#2e7af5" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(!showDatePicker)}>
          <Icon name="calendar" size={20} color="#666" />
          <Text style={styles.datePickerText}>
            {selectedDate || 'dd-mm-yyyy'}
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
        {eventTypes.map(type => (
          <TouchableOpacity
            key={type.name}
            style={[styles.tab, activeTab === type.name && styles.activeTab]}
            onPress={() => setActiveTab(type.name)}>
            <Text
              style={[
                styles.tabText,
                activeTab === type.name && styles.activeTabText,
              ]}>
              {`${type.name} (${type.count})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Event Cards */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.eventsContainer}>
          {filteredEvents.map(event => renderEventCard(event))}
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
    padding: 20,
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
});

export default ConferencesScreen;
