import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {eventService} from '../services/api';
import {useAuth} from '../context/AuthContext';

const EventStatusBadge = ({status}) => {
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
    <View style={[styles.badge, {backgroundColor: bgColor}]}>
      <Icon
        name={iconName}
        size={12}
        color={textColor}
        style={{marginRight: 4}}
      />
      <Text style={[styles.badgeText, {color: textColor}]}>{label}</Text>
    </View>
  );
};

const MyEventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const {user} = useAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getMyEvents();
      console.log('My events fetched:', data.length);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
      Alert.alert('Error', 'Failed to load your events.');
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
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleCreateEvent = () => {
    navigation.navigate('CreateConference');
  };

  const handleDeleteEvent = async eventId => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventService.deleteEvent(eventId);
              // Remove the event from the list
              setEvents(events.filter(event => event._id !== eventId));
              Alert.alert('Success', 'Event deleted successfully');
            } catch (error) {
              Alert.alert('Error', `Failed to delete event: ${error.message}`);
            }
          },
        },
      ],
    );
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderEventItem = ({item}) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetails', {eventId: item._id})}>
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

        {item.status === 'rejected' && item.verificationNotes && (
          <View style={styles.rejectionNote}>
            <Text style={styles.rejectionNoteTitle}>Rejection reason:</Text>
            <Text style={styles.rejectionNoteText}>
              {item.verificationNotes}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.eventActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('EventDetails', {eventId: item._id})
          }>
          <Icon name="eye" size={16} color="#2e7af5" />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteEvent(item._id)}>
          <Icon name="delete" size={16} color="#ff4757" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Events</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateEvent}>
            <Icon name="plus" size={24} color="#2e7af5" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fc" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateEvent}>
          <Icon name="plus" size={24} color="#2e7af5" />
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-blank" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Events Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first medical event and wait for admin approval
          </Text>
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={handleCreateEvent}>
            <Text style={styles.createEventButtonText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
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
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding at bottom for better scrolling
  },
  eventCard: {
    backgroundColor: '#fff',
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
  rejectionNote: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  rejectionNoteTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#c62828',
    marginBottom: 4,
  },
  rejectionNoteText: {
    fontSize: 14,
    color: '#333',
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#2e7af5',
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderRadius: 6,
  },
  deleteText: {
    color: '#ff4757',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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

export default MyEventsScreen;
