import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../context/AuthContext';
import {meetingService} from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AdminPrivateMeetingsScreen = ({navigation}) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    fetchAllMeetings();

    // Add listener for when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllMeetings();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchAllMeetings = async () => {
    try {
      setLoading(true);
      const response = await meetingService.getAllMeetings();
      setMeetings(response);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      Alert.alert('Error', 'Failed to load meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMeeting = meetingId => {
    navigation.navigate('MeetingDetails', {meetingId});
  };

  const handleCancelMeeting = async meetingId => {
    try {
      await meetingService.cancelMeeting(meetingId);
      Alert.alert('Success', 'Meeting has been cancelled.');
      fetchAllMeetings(); // Refresh the list
    } catch (error) {
      console.error('Failed to cancel meeting:', error);
      Alert.alert('Error', 'Failed to cancel meeting. Please try again.');
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = timeString => {
    // Handle timeString in format "HH:MM:SS"
    if (!timeString) return 'N/A';

    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMeetingItem = ({item}) => (
    <View style={styles.meetingCard}>
      <View style={styles.meetingHeader}>
        <Icon
          name={item.mode === 'online' ? 'video' : 'map-marker'}
          size={20}
          color="#2e7af5"
        />
        <Text style={styles.meetingType}>
          {item.mode === 'online' ? 'Online Meeting' : 'In-Person Meeting'}
        </Text>

        <View
          style={[
            styles.statusBadge,
            item.status === 'active'
              ? styles.activeBadge
              : item.status === 'cancelled'
              ? styles.cancelledBadge
              : styles.completedBadge,
          ]}>
          <Text style={styles.statusText}>
            {item.status === 'active'
              ? 'Active'
              : item.status === 'cancelled'
              ? 'Cancelled'
              : 'Completed'}
          </Text>
        </View>
      </View>

      <Text style={styles.meetingTitle}>{item.title}</Text>

      <View style={styles.organizerRow}>
        <Icon name="account" size={16} color="#666" />
        <Text style={styles.organizerText}>By {item.organizer_name}</Text>
      </View>

      <View style={styles.meetingDetails}>
        <View style={styles.detailRow}>
          <Icon name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDate(item.start_date)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="clock-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatTime(item.start_time)} - {formatTime(item.end_time)}
          </Text>
        </View>

        {item.mode === 'in-person' && item.venue && (
          <View style={styles.detailRow}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.detailText}>{item.venue}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleViewMeeting(item.id)}>
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>

        {item.status === 'active' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelMeeting(item.id)}>
            <Text style={styles.cancelButtonText}>Cancel Meeting</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Private Meetings</Text>
        <View style={{width: 24}} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading meetings...</Text>
        </View>
      ) : (
        <FlatList
          data={meetings}
          renderItem={renderMeetingItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar-blank" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>No Private Meetings</Text>
              <Text style={styles.emptySubtitle}>
                There are no private meetings in the system.
              </Text>
            </View>
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
    color: '#666',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  meetingCard: {
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
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingType: {
    fontSize: 14,
    color: '#2e7af5',
    fontWeight: '500',
    marginLeft: 8,
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  cancelledBadge: {
    backgroundColor: '#FFEBEE',
  },
  completedBadge: {
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  organizerText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  meetingDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
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
    flexDirection: 'column',
  },
  detailsButton: {
    backgroundColor: '#f0f6ff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2e7af5',
  },
  cancelButton: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f44336',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default AdminPrivateMeetingsScreen;
