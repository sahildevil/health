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
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {adminService} from '../../services/api';

const EventRegistrationsScreen = ({route, navigation}) => {
  const {eventId} = route.params;
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchRegistrations();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const data = await adminService.getEventById(eventId);
      setEvent(data);
    } catch (error) {
      console.error('Failed to fetch event details:', error);
      Alert.alert('Error', 'Failed to load event details');
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEventRegistrations(eventId);
      setRegistrations(data);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      Alert.alert('Error', 'Failed to load registration data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegistrations();
  };

  const handleCancelRegistration = userId => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel this registration?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Yes, Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.cancelEventRegistration(eventId, userId);
              Alert.alert('Success', 'Registration has been cancelled');
              // Refresh the registrations list
              fetchRegistrations();
            } catch (error) {
              console.error('Failed to cancel registration:', error);
              Alert.alert('Error', 'Failed to cancel registration');
            }
          },
        },
      ],
    );
  };

  const handleExportRegistrations = async () => {
    try {
      const result = await adminService.exportEventRegistrations(eventId);
      Alert.alert(
        'Success',
        'Registration data has been exported and emailed to you',
      );
    } catch (error) {
      console.error('Failed to export registrations:', error);
      Alert.alert('Error', 'Failed to export registration data');
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRegistrationItem = ({item}) => (
    <View style={styles.registrationCard}>
      <View style={styles.userDetails}>
        <Text style={styles.userName}>{item.user.name}</Text>
        <Text style={styles.userEmail}>{item.user.email}</Text>
        {item.user.phone && (
          <Text style={styles.userPhone}>{item.user.phone}</Text>
        )}
      </View>

      <View style={styles.registrationDetails}>
        <View style={styles.detailRow}>
          <Icon name="clock-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Registered: {formatDate(item.registeredAt)}
          </Text>
        </View>

        {item.specialization && (
          <View style={styles.detailRow}>
            <Icon name="briefcase-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              Specialization: {item.specialization}
            </Text>
          </View>
        )}

        {item.organization && (
          <View style={styles.detailRow}>
            <Icon name="domain" size={16} color="#666" />
            <Text style={styles.detailText}>
              Organization: {item.organization}
            </Text>
          </View>
        )}
      </View>

      {item.additionalNotes && (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.additionalNotes}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => handleCancelRegistration(item.user.id)}>
        <Icon name="close-circle" size={16} color="#e53935" />
        <Text style={styles.cancelButtonText}>Cancel Registration</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7af5" />
        <Text style={styles.loadingText}>Loading registrations...</Text>
      </View>
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
        <Text style={styles.headerTitle}>Event Registrations</Text>
        <View style={{width: 24}} />
      </View>

      {event && (
        <View style={styles.eventInfoCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventDetail}>
            <Icon name="calendar" size={16} color="#666" />
            <Text style={styles.eventDetailText}>
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{registrations.length}</Text>
          <Text style={styles.statLabel}>Registered</Text>
        </View>

        {event && event.capacity && (
          <>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{event.capacity}</Text>
              <Text style={styles.statLabel}>Capacity</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Math.round((registrations.length / event.capacity) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Filled</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportRegistrations}>
          <Icon name="file-export" size={18} color="#2e7af5" />
          <Text style={styles.exportButtonText}>Export Data</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={registrations}
        renderItem={renderRegistrationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-off" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Registrations</Text>
            <Text style={styles.emptySubtitle}>
              This event doesn't have any registrations yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  eventInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f6ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e1ff',
  },
  exportButtonText: {
    fontSize: 14,
    color: '#2e7af5',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  registrationCard: {
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
  userDetails: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  registrationDetails: {
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
  notes: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#e53935',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
  },
});

export default EventRegistrationsScreen;
