import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { eventService } from '../services/api';

const EventApprovalScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getPendingEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending events');
      Alert.alert('Error', 'Could not load events: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const handleApproveEvent = (eventId) => {
    Alert.alert(
      'Approve Event',
      'Are you sure you want to approve this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setLoading(true);
              await eventService.approveEvent(eventId);
              // Remove the approved event from the list
              setEvents(events.filter(event => event._id !== eventId));
              Alert.alert('Success', 'Event has been approved');
            } catch (err) {
              Alert.alert('Error', 'Failed to approve event: ' + (err.message || 'Unknown error'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectEvent = (eventId) => {
    Alert.alert(
      'Reject Event',
      'Are you sure you want to reject this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await eventService.deleteEvent(eventId);
              // Remove the rejected event from the list
              setEvents(events.filter(event => event._id !== eventId));
              Alert.alert('Success', 'Event has been rejected');
            } catch (err) {
              Alert.alert('Error', 'Failed to reject event: ' + (err.message || 'Unknown error'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventType}>{item.type}</Text>
        <Text style={styles.eventMode}>{item.mode}</Text>
      </View>
      
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
      
      <View style={styles.eventDetails}>
        <View style={styles.detailItem}>
          <Icon name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="map-marker" size={16} color="#666" />
          <Text style={styles.detailText}>{item.venue}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="account" size={16} color="#666" />
          <Text style={styles.detailText}>By: {item.createdBy?.name || 'Unknown'}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => navigation.navigate('EventDetails', { eventId: item._id })}
        >
          <Icon name="eye" size={16} color="#2e7af5" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.approveButton}
          onPress={() => handleApproveEvent(item._id)}
        >
          <Icon name="check-circle" size={16} color="#fff" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => handleRejectEvent(item._id)}
        >
          <Icon name="close-circle" size={16} color="#fff" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Approval</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#d32f2f" />
          <Text style={styles.errorText}>Error loading events</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPendingEvents}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-check" size={60} color="#4caf50" />
          <Text style={styles.emptyText}>No pending events</Text>
          <Text style={styles.emptySubtext}>All events have been reviewed</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchPendingEvents}
        />
      )}
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
    borderBottomColor: '#e1e1e1',
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
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2e7af5',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4caf50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 12,
    color: '#7B68EE',
    backgroundColor: '#EBE9FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    fontWeight: '500',
  },
  eventMode: {
    fontSize: 12,
    color: '#2e7af5',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  viewButtonText: {
    color: '#2e7af5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default EventApprovalScreen;