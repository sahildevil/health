import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {eventService} from '../services/api';
import {useAuth} from '../context/AuthContext';

// Event Status Badge Component (reused from HomeScreen)
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

const EventDetailsScreen = ({route, navigation}) => {
  const {eventId} = route.params;
  const {user} = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const eventData = await eventService.getEventById(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Failed to load event details:', error);
      Alert.alert('Error', 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  // Format date function
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time function
  const formatTime = dateString => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Add function to handle event deletion
  const handleDeleteEvent = async () => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await eventService.deleteEvent(eventId);
            Alert.alert('Success', 'Event deleted successfully');
            navigation.goBack();
          } catch (error) {
            console.error('Error deleting event:', error);
            Alert.alert('Error', 'Failed to delete event');
          }
        },
      },
    ]);
  };

  // Render speaker item
  const renderSpeakerItem = ({item}) => (
    <View style={styles.speakerCard}>
      <View style={styles.speakerIconContainer}>
        <Icon name="account" size={24} color="#2e7af5" />
      </View>
      <View style={styles.speakerInfo}>
        <Text style={styles.speakerName}>{item.name}</Text>
        {item.title && <Text style={styles.speakerTitle}>{item.title}</Text>}
        {item.bio && <Text style={styles.speakerBio}>{item.bio}</Text>}
      </View>
    </View>
  );

  // Render sponsor item
  const renderSponsorItem = ({item}) => (
    <View style={styles.sponsorCard}>
      <Text style={styles.sponsorName}>{item.name}</Text>
      {item.level && (
        <Text style={styles.sponsorLevel}>Level: {item.level}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <Text style={styles.errorMessage}>
            The event you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}>
          <Icon name="arrow-left" size={24} color="#2e7af5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity style={styles.headerActionButton}>
          <Icon name="share-variant" size={24} color="#2e7af5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Event Header Section */}
        <View style={styles.eventHeaderSection}>
          <View style={styles.eventTypeAndStatus}>
            <Text style={styles.eventType}>{event.type}</Text>
            <EventStatusBadge status={event.status} />
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventMode}>
            <Icon
              name={event.mode === 'Virtual' ? 'video' : 'map-marker'}
              size={16}
              color="#666"
            />
            <Text style={styles.eventModeText}>{event.mode}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {user?.id === event.organizer_id ? (
            // Show Edit and Delete buttons for event creator
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('EditEvent', {eventId})}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon name="pencil" size={18} color="#fff" />
                  <Text style={[styles.primaryButtonText, {marginLeft: 6}]}>
                    Edit Event
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, {backgroundColor: '#ffebee'}]}
                onPress={handleDeleteEvent}>
                <Icon name="delete" size={18} color="#d32f2f" />
                <Text style={[styles.secondaryButtonText, {color: '#d32f2f'}]}>
                  Delete Event
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Show Register and Calendar buttons for other users
            <>
              {event.status === 'approved' && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() =>
                    navigation.navigate('EventRegistration', {eventId})
                  }>
                  <Icon name="account-plus" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Register Now</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryButton}>
                <Icon name="calendar-plus" size={18} color="#2e7af5" />
                <Text style={styles.secondaryButtonText}>Add to Calendar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Date and Time Section */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <View style={styles.detailRow}>
            <Icon name="calendar-range" size={20} color="#2e7af5" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailText}>
                {formatDate(event.startDate)} at {formatTime(event.startDate)}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar-range" size={20} color="#2e7af5" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>End Date</Text>
              <Text style={styles.detailText}>
                {formatDate(event.endDate)} at {formatTime(event.endDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Venue Section */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.detailRow}>
            <Icon
              name={event.mode === 'Virtual' ? 'video' : 'map-marker'}
              size={20}
              color="#2e7af5"
            />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>
                {event.mode === 'Virtual' ? 'Platform' : 'Venue'}
              </Text>
              <Text style={styles.detailText}>{event.venue}</Text>
            </View>
          </View>

          {event.capacity && (
            <View style={styles.detailRow}>
              <Icon name="account-group" size={20} color="#2e7af5" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Capacity</Text>
                <Text style={styles.detailText}>
                  {event.capacity} attendees
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Registration Information */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Registration</Text>
          <View style={styles.detailRow}>
            <Icon name="currency-usd" size={20} color="#2e7af5" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Registration Fee</Text>
              <Text style={styles.detailText}>
                {event.registrationFee === '0' || event.registrationFee === 0
                  ? 'Free Event'
                  : `$${event.registrationFee}`}
              </Text>
            </View>
          </View>

          {event.website && (
            <View style={styles.detailRow}>
              <Icon name="web" size={20} color="#2e7af5" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Website</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(event.website)}>
                  <Text style={styles.linkText}>{event.website}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Speakers Section */}
        {event.speakers && event.speakers.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Speakers</Text>
            <FlatList
              data={event.speakers}
              renderItem={renderSpeakerItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Sponsors Section */}
        {event.sponsors && event.sponsors.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Sponsors</Text>
            <FlatList
              data={event.sponsors}
              renderItem={renderSponsorItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              horizontal={true}
              contentContainerStyle={styles.sponsorsContainer}
            />
          </View>
        )}

        {/* Tags Section */}
        {/* {event.tags && event.tags.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {event.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )} */}

        {/* Organizer Information */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Event Organizer</Text>
          <View style={styles.detailRow}>
            <Icon name="account" size={20} color="#2e7af5" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailText}>{event.organizerName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Icon name="email" size={20} color="#2e7af5" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Email</Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(`mailto:${event.organizerEmail}`)
                }>
                <Text style={styles.linkText}>{event.organizerEmail}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {event.organizerPhone && (
            <View style={styles.detailRow}>
              <Icon name="phone" size={20} color="#2e7af5" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Phone</Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(`tel:${event.organizerPhone}`)
                  }>
                  <Text style={styles.linkText}>{event.organizerPhone}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Terms and Conditions */}
        {event.termsAndConditions && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Terms and Conditions</Text>
            <Text style={styles.description}>{event.termsAndConditions}</Text>
          </View>
        )}
      </ScrollView>

    
      {/* {event.status === 'approved' && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => navigation.navigate('EditEvent', {eventId})}>
            <Text style={styles.bottomButtonText}>Register for this Event</Text>
          </TouchableOpacity>
        </View>
      )} */}
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActionButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2e7af5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  eventHeaderSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventTypeAndStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 14,
    color: '#2e7af5',
    fontWeight: '500',
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
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventMode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventModeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  primaryButton: {
    backgroundColor: '#e36135',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#2e7af5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  linkText: {
    fontSize: 16,
    color: '#2e7af5',
    textDecorationLine: 'underline',
  },
  speakerCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  speakerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  speakerInfo: {
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
  sponsorsContainer: {
    paddingVertical: 8,
  },
  sponsorCard: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginRight: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  sponsorLevel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#2e7af5',
    fontSize: 14,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomButton: {
    backgroundColor: '#2e7af5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventDetailsScreen;
