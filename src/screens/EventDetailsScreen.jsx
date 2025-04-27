import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { eventService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EventDetailsScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const data = await eventService.getEventDetails(eventId);
        setEvent(data);
      } catch (error) {
        console.error('Failed to load event details:', error);
        Alert.alert(
          'Error',
          'Failed to load event details: ' + (error.message || 'Unknown error')
        );
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await eventService.deleteEvent(eventId);
              Alert.alert('Success', 'Event deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              setLoading(false);
              Alert.alert(
                'Error',
                'Failed to delete event: ' + (error.message || 'Unknown error')
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f9fc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading event details...</Text>
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
          <Icon name="arrow-left" size={24} color="#2e7af5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        {user && event && user.id === event.createdBy._id && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteEvent}>
            <Icon name="delete" size={24} color="#ff4c4c" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          event?.status === 'approved'
            ? styles.approvedBadge
            : event?.status === 'rejected'
              ? styles.rejectedBadge
              : styles.pendingBadge
        ]}>
          <Icon
            name={
              event?.status === 'approved'
                ? 'check-circle'
                : event?.status === 'rejected'
                  ? 'close-circle'
                  : 'clock-outline'
            }
            size={16}
            color={
              event?.status === 'approved'
                ? '#2e7d32'
                : event?.status === 'rejected'
                  ? '#c62828'
                  : '#e65100'
            }
            style={styles.statusIcon}
          />
          <Text style={[
            styles.statusText,
            {
              color:
                event?.status === 'approved'
                  ? '#2e7d32'
                  : event?.status === 'rejected'
                    ? '#c62828'
                    : '#e65100'
            }
          ]}>
            {event?.status === 'approved'
              ? 'Approved'
              : event?.status === 'rejected'
                ? 'Rejected'
                : 'Pending Approval'}
          </Text>
        </View>

        {/* Event Title and Type */}
        <View style={styles.titleContainer}>
          <Text style={styles.eventTitle}>{event?.title}</Text>
          <View style={styles.typeContainer}>
            <Text style={styles.eventType}>{event?.type} • {event?.mode}</Text>
          </View>
        </View>

        {/* Rejection Notes if applicable */}
        {event?.status === 'rejected' && event?.verificationNotes && (
          <View style={styles.rejectionContainer}>
            <Text style={styles.rejectionTitle}>Reason for Rejection:</Text>
            <Text style={styles.rejectionText}>{event.verificationNotes}</Text>
          </View>
        )}

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          <Text style={styles.eventDescription}>{event?.description}</Text>

          <View style={styles.detailItem}>
            <Icon name="calendar-range" size={18} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailText}>
                {formatDate(event?.startDate)} - {formatDate(event?.endDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon name="clock-outline" size={18} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailText}>
                {formatTime(event?.startDate)} - {formatTime(event?.endDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon
              name={event?.mode === 'Virtual' ? 'video' : 'map-marker'}
              size={18}
              color="#666"
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {event?.mode === 'Virtual' ? 'Platform' : 'Location'}
              </Text>
              <Text style={styles.detailText}>{event?.venue}</Text>
            </View>
          </View>

          {event?.capacity && (
            <View style={styles.detailItem}>
              <Icon name="account-group" size={18} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Capacity</Text>
                <Text style={styles.detailText}>{event.capacity} attendees</Text>
              </View>
            </View>
          )}
        </View>

        {/* Organizer Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Organizer</Text>
          <View style={styles.detailItem}>
            <Icon name="account" size={18} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailText}>{event?.organizerName}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon name="email" size={18} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailText}>{event?.organizerEmail}</Text>
            </View>
          </View>

          {event?.organizerPhone && (
            <View style={styles.detailItem}>
              <Icon name="phone" size={18} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailText}>{event.organizerPhone}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Speakers Section */}
        {event?.speakers && event.speakers.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Speakers</Text>
            {event.speakers.map((speaker, index) => (
              <View key={index} style={styles.speakerItem}>
                <View style={styles.speakerAvatar}>
                  <Text style={styles.speakerInitial}>
                    {speaker.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.speakerContent}>
                  <Text style={styles.speakerName}>{speaker.name}</Text>
                  {speaker.title && (
                    <Text style={styles.speakerTitle}>{speaker.title}</Text>
                  )}
                  {speaker.bio && (
                    <Text style={styles.speakerBio}>{speaker.bio}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sponsors Section */}
        {event?.sponsors && event.sponsors.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Sponsors</Text>
            {event.sponsors.map((sponsor, index) => (
              <View key={index} style={styles.sponsorItem}>
                <Text style={styles.sponsorName}>{sponsor.name}</Text>
                {sponsor.level && (
                  <Text style={styles.sponsorLevel}>{sponsor.level}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Registration Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Registration</Text>
          <Text style={styles.registrationInfo}>
            {event?.registrationFee === '0'
              ? 'This is a free event'
              : `Registration Fee: $${event?.registrationFee}`}
          </Text>
          
          {event?.status === 'approved' && (
            <TouchableOpacity style={styles.registerButton}>
              <Text style={styles.registerButtonText}>Register Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 16,
    marginLeft: 16,
  },
  approvedBadge: {
    backgroundColor: '#e8f5e9',
  },
  pendingBadge: {
    backgroundColor: '#fff3e0',
  },
  rejectedBadge: {
    backgroundColor: '#ffebee',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventType: {
    fontSize: 16,
    color: '#666',
  },
  rejectionContainer: {
    backgroundColor: '#ffebee',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  eventDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  speakerItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  speakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2e7af5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  speakerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  speakerContent: {
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  speakerTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  speakerBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sponsorItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sponsorLevel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  registrationInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#2e7af5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventDetailsScreen;