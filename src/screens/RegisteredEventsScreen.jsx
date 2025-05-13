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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {eventService} from '../services/api';
import {useAuth} from '../context/AuthContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const RegisteredEventsScreen = ({navigation}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const fetchRegisteredEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getRegisteredEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load registered events:', error);
      Alert.alert('Error', 'Failed to load events you are attending.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRegisteredEvents();

    // Refresh events when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRegisteredEvents();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegisteredEvents();
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
        <Text style={styles.eventType}>{item.type}</Text>
        <Text style={styles.eventTitle}>{item.title}</Text>
      </View>

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

        <View style={styles.detailItem}>
          <Icon name="account" size={16} color="#666" />
          <Text style={styles.detailText}>Organizer: {item.organizerName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Events I'm Attending</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fc" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events I'm Attending</Text>
        <View style={{width: 24}} />
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-blank" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Registered Events</Text>
          <Text style={styles.emptySubtitle}>
            You haven't registered for any events yet
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Conferences')}>
            <Text style={styles.browseButtonText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
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
  browseButton: {
    backgroundColor: '#2e7af5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
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
    marginBottom: 12,
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
  },
  eventDetails: {
    marginBottom: 16,
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
});

export default RegisteredEventsScreen;
