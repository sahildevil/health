import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {eventService} from '../services/api';
import {useAuth} from '../context/AuthContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const SponsorshipRequestsScreen = ({navigation}) => {
  const {user} = useAuth();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await eventService.getSponsorshipRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch sponsorship requests:', error);
      Alert.alert('Error', 'Failed to load sponsorship requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, status) => {
    try {
      setRespondingTo(requestId);
      await eventService.respondToSponsorshipRequest(requestId, status);
      Alert.alert('Success', `You have ${status} the sponsorship request.`);

      // Update the local state to reflect the change
      setRequests(
        requests.map(req => (req.id === requestId ? {...req, status} : req)),
      );
    } catch (error) {
      console.error('Failed to respond to request:', error);
      Alert.alert('Error', 'Failed to respond to the sponsorship request');
    } finally {
      setRespondingTo(null);
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

  const renderRequestItem = ({item}) => {
    // For pharma users viewing requests for their approval
    if (user.role === 'pharma') {
      const isPending = item.status === 'pending';
      return (
        <View style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.eventTitle}>{item.events.title}</Text>
            <View
              style={[
                styles.statusBadge,
                item.status === 'pending'
                  ? styles.pendingBadge
                  : item.status === 'accepted'
                  ? styles.acceptedBadge
                  : styles.declinedBadge,
              ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Icon name="calendar" size={16} color="#666" />
              <Text style={styles.detailText}>
                {formatDate(item.events.start_date)} -{' '}
                {formatDate(item.events.end_date)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon
                name={item.events.mode === 'Virtual' ? 'video' : 'map-marker'}
                size={16}
                color="#666"
              />
              <Text style={styles.detailText}>
                {item.events.mode === 'Virtual'
                  ? 'Virtual Event'
                  : item.events.venue}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="account" size={16} color="#666" />
              <Text style={styles.detailText}>
                Organized by: {item.events.organizer_name}
              </Text>
            </View>
          </View>

          <Text style={styles.eventDescription}>
            {item.events.description.length > 150
              ? item.events.description.substring(0, 150) + '...'
              : item.events.description}
          </Text>

          {isPending && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() =>
                  navigation.navigate('EventDetails', {eventId: item.event_id})
                }>
                <Text style={styles.viewButtonText}>View Event</Text>
              </TouchableOpacity>

              <View style={{flexDirection: 'row'}}>
                <TouchableOpacity
                  style={[styles.responseButton, styles.acceptButton]}
                  onPress={() => handleResponse(item.id, 'accepted')}
                  disabled={respondingTo === item.id}>
                  {respondingTo === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.responseButtonText}>Accept</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.responseButton, styles.declineButton]}
                  onPress={() => handleResponse(item.id, 'declined')}
                  disabled={respondingTo === item.id}>
                  <Text style={styles.responseButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      );
    }
    // For doctors viewing status of their sent requests
    else {
      return (
        <View style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.eventTitle}>{item.events.title}</Text>
            <View
              style={[
                styles.statusBadge,
                item.status === 'pending'
                  ? styles.pendingBadge
                  : item.status === 'accepted'
                  ? styles.acceptedBadge
                  : styles.declinedBadge,
              ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.pharmaInfo}>
            <Icon name="domain" size={18} color="#2e7af5" />
            <Text style={styles.pharmaName}>
              {item.pharma.company || item.pharma.name}
            </Text>
          </View>

          <View style={styles.requestDetails}>
            <Text style={styles.requestDate}>
              Request sent: {formatDate(item.created_at)}
            </Text>
            {item.status !== 'pending' && (
              <Text style={styles.responseDate}>
                Response received: {formatDate(item.updated_at)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() =>
              navigation.navigate('EventDetails', {eventId: item.event_id})
            }>
            <Text style={styles.viewButtonText}>View Event</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fc" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#2e7af5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sponsorship Requests</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="clipboard-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No Sponsorship Requests</Text>
              <Text style={styles.emptyDescription}>
                {user.role === 'pharma'
                  ? "You don't have any sponsorship requests yet."
                  : "You haven't sent any sponsorship requests yet."}
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  listContainer: {
    padding: 16,
  },
  requestCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pendingBadge: {
    backgroundColor: '#FFF8E1',
  },
  acceptedBadge: {
    backgroundColor: '#E8F5E9',
  },
  declinedBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewButtonText: {
    color: '#2e7af5',
    fontSize: 14,
    fontWeight: '500',
  },
  responseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  responseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pharmaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pharmaName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  requestDetails: {
    marginBottom: 16,
  },
  requestDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SponsorshipRequestsScreen;
