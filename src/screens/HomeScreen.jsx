import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api';

// Event Status Badge Component (reused from MyEventsScreen)
const EventStatusBadge = ({ status }) => {
  let bgColor = '#FFF3E0'; // Default pending color
  let textColor = '#E65100';
  let iconName = 'clock-outline';
  let label = 'Pending';

  if (status === 'approved') {
    bgColor = '#E8F5E9';
    textColor = '#2E7D32';
    iconName = 'check-circle';
    label = 'Approved';
  } else if (status === 'rejected') {
    bgColor = '#FFEBEE';
    textColor = '#C62828';
    iconName = 'close-circle';
    label = 'Rejected';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Icon
        name={iconName}
        size={12}
        color={textColor}
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  // Get user from auth context
  const { user } = useAuth();
  
  // State for events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('my'); // 'my', 'ongoing', 'recommended'

  // Helper function to get proper greeting based on time of day
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format the name with title if user is a doctor
  const getFormattedName = () => {
    if (!user) return 'User';

    if (user.role === 'doctor') {
      // Get first name only for a more personal greeting
      const firstName = user.name.split(' ')[0];
      return `Dr. ${firstName}`;
    }

    // For non-doctors just use their first name
    return user.name.split(' ')[0];
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch events based on active tab
      let data;
      switch (activeTab) {
        case 'my':
          data = await eventService.getMyEvents();
          break;
        case 'ongoing':
          // Replace with your API call for ongoing events
          data = await eventService.getOngoingEvents();
          break;
        case 'recommended':
          // Replace with your API call for recommended events
          data = await eventService.getRecommendedEvents();
          break;
        default:
          data = await eventService.getMyEvents();
      }
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
      Alert.alert('Error', 'Failed to load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Refresh events when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEvents();
    });

    return unsubscribe;
  }, [navigation, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Format date function (reused from MyEventsScreen)
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render event item (similar to MyEventsScreen)
  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetails', { eventId: item._id })}>
      <View style={styles.eventHeader}>
        <View>
          <Text style={styles.eventType}>{item.type}</Text>
          <Text style={styles.eventTitle}>{item.title}</Text>
        </View>
        <EventStatusBadge status={item.status} />
      </View>

      <Text style={styles.eventDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.eventDetails}>
        <View style={styles.detailItem}>
          <Icon name="calendar-range" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon
            name={item.mode === 'Virtual' ? 'video' : 'map-marker'}
            size={16}
            color="#666"
          />
          <Text style={styles.detailText}>
            {item.mode}: {item.venue}
          </Text>
        </View>
      </View>

      <View style={styles.eventActions}>
        <TouchableOpacity
          style={styles.eventButton}
          onPress={() =>
            navigation.navigate('EventDetails', { eventId: item._id })
          }>
          <Text style={styles.eventButtonText}>View Details</Text>
        </TouchableOpacity>
        
        {/* Display Register button only for approved events */}
        {item.status === 'approved' && (
          <TouchableOpacity
            style={[styles.eventButton, styles.registerButton]}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            {getGreeting()}, {getFormattedName()}
          </Text>
          <Text style={styles.subtitleText}>
            {user?.role === 'doctor'
              ? "Here's your medical education today"
              : user?.role === 'pharma'
              ? 'Here are your upcoming connections'
              : "Here's your overview today"}
          </Text>
        </View>
        <View style={styles.profileIcon}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person" size={24} color={'#2e7af5'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <ScrollView style={styles.scrollView} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.statsContainer}>
          {/* Upcoming Conferences Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={24} color={'#ffffff'} />
              <Text style={styles.cardTitle}>Upcoming Events</Text>
            </View>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statSubtext}>+2 registered this week</Text>
          </View>

          {/* Meetings This Week Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={24} color={'#ffffff'} />
              <Text style={styles.cardTitle}>Meetings This Week</Text>
            </View>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statSubtext}>Next one in 2 days</Text>
          </View>

          {/* Available CME Courses Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="book-open-variant" size={24} color="#ffffff" />
              <Text style={styles.cardTitle}>Available Courses</Text>
            </View>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statSubtext}>5 new courses added</Text>
          </View>
        </View>

        {/* Events Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'my' && styles.activeTab]}
            onPress={() => setActiveTab('my')}>
            <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
              My Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
            onPress={() => setActiveTab('ongoing')}>
            <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
              Ongoing Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'recommended' && styles.activeTab]}
            onPress={() => setActiveTab('recommended')}>
            <Text style={[styles.tabText, activeTab === 'recommended' && styles.activeTabText]}>
              Recommended
            </Text>
          </TouchableOpacity>
        </View>

        {/* Event Cards */}
        <View style={styles.eventCardsContainer}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2e7af5" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="calendar-blank" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No Events Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'my' 
                  ? 'Create your first medical event or browse recommended events'
                  : activeTab === 'ongoing'
                  ? 'There are no ongoing events at the moment'
                  : 'We don\'t have any recommendations for you yet'}
              </Text>
              {activeTab === 'my' && (
                <TouchableOpacity
                  style={styles.createEventButton}
                  onPress={() => navigation.navigate('CreateConference')}>
                  <Text style={styles.createEventButtonText}>Create Event</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={events}
              renderItem={renderEventItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              nestedScrollEnabled={true}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileIcon: {
    backgroundColor: '#f8f8f8',
    borderRadius: 50,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  card: {
    width: '32%',
    backgroundColor: '#2e7af5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    marginRight: 16,
    paddingBottom: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2e7af5',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2e7af5',
    fontWeight: '500',
  },
  eventCardsContainer: {
    padding: 16,
    paddingBottom: 80,
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 13,
    color: '#2e7af5',
    fontWeight: '500',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
    maxWidth: '80%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  eventButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  eventButtonText: {
    color: '#2e7af5',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#2e7af5',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createEventButton: {
    backgroundColor: '#2e7af5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createEventButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;