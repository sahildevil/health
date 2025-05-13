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
import {useAuth} from '../context/AuthContext';
import {meetingService} from '../services/api';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const MyMeetingsScreen = ({navigation}) => {
  const {user} = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    fetchMeetings();

    // Add listener for when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMeetings();
    });

    return unsubscribe;
  }, [navigation]);

  // const fetchMeetings = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await meetingService.getMyMeetings();
  //     setMeetings(response);
  //   } catch (error) {
  //     console.error('Failed to fetch meetings:', error);
  //     Alert.alert('Error', 'Failed to load meetings. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      let response;

      // Use the proper method based on user role
      if (user?.role === 'pharma') {
        response = await meetingService.getOrganizedMeetings();
      } else if (user?.role === 'doctor') {
        response = await meetingService.getInvitedMeetings();
      } else {
        response = await meetingService.getAllMeetings();
      }

      setMeetings(response);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      Alert.alert('Error', 'Failed to load meetings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const handleViewMeeting = meetingId => {
    navigation.navigate('MeetingDetails', {meetingId});
  };

  const handleCreateMeeting = () => {
    navigation.navigate('CreatePrivateMeeting');
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
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMeetingItem = ({item}) => (
    <TouchableOpacity
      style={styles.meetingCard}
      onPress={() => handleViewMeeting(item.id)}>
      <View style={styles.meetingHeader}>
        <Icon
          name={item.mode === 'online' ? 'video' : 'map-marker'}
          size={20}
          color="#2e7af5"
        />
        <Text style={styles.meetingType}>
          {item.mode === 'online' ? 'Online Meeting' : 'In-Person Meeting'}
        </Text>
        {item.is_private && (
          <View style={styles.privateBadge}>
            <Icon name="lock" size={12} color="#fff" />
            <Text style={styles.privateText}>Private</Text>
          </View>
        )}
      </View>

      <Text style={styles.meetingTitle}>{item.title}</Text>
      <Text style={styles.meetingDescription} numberOfLines={2}>
        {item.description}
      </Text>

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

        <View style={styles.detailRow}>
          <Icon name="account-group" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.invited_doctors ? item.invited_doctors.length : 0} invited
            doctors
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Meetings</Text>
        <View style={{width: 24}} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading meetings...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={meetings}
            renderItem={renderMeetingItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="calendar-blank" size={60} color="#ccc" />
                <Text style={styles.emptyTitle}>No Meetings</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't created any meetings yet.
                </Text>
              </View>
            }
          />

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateMeeting}>
            <Icon name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </>
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
    paddingBottom: 80, // To ensure last item is above the floating button
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
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  privateText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  meetingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  meetingDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
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
  createButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2e7af5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default MyMeetingsScreen;
