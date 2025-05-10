import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {meetingService} from '../services/api';

const MeetingDetailsScreen = ({route, navigation}) => {
  const {meetingId} = route.params;
  const {user} = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      const response = await meetingService.getMeetingById(meetingId);
      setMeeting(response);
    } catch (error) {
      console.error('Failed to fetch meeting details:', error);
      Alert.alert('Error', 'Failed to load meeting details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const handleJoinMeeting = () => {
    if (meeting.mode === 'online' && meeting.meeting_link) {
      Linking.openURL(meeting.meeting_link);
    } else {
      Alert.alert(
        'In-Person Meeting',
        `This meeting will be held at: ${meeting.venue}`,
      );
    }
  };

  const handleEditMeeting = () => {
    navigation.navigate('EditPrivateMeeting', {meeting});
  };

  const handleCancelMeeting = () => {
    Alert.alert(
      'Cancel Meeting',
      'Are you sure you want to cancel this meeting? This action cannot be undone.',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await meetingService.cancelMeeting(meetingId);
              Alert.alert('Success', 'Meeting cancelled successfully', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              console.error('Failed to cancel meeting:', error);
              Alert.alert(
                'Error',
                'Failed to cancel meeting. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const isOrganizer = meeting && user && meeting.organizer_id === user.id;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meeting Details</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading meeting details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meeting Details</Text>
        {isOrganizer && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditMeeting}>
            <Icon name="pencil" size={20} color="#2e7af5" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.meetingHeader}>
          <View style={styles.meetingBadgesRow}>
            <View style={styles.meetingTypeBadge}>
              <Icon
                name={meeting.mode === 'online' ? 'video' : 'map-marker'}
                size={16}
                color="#2e7af5"
              />
              <Text style={styles.meetingTypeText}>
                {meeting.mode === 'online'
                  ? 'Online Meeting'
                  : 'In-Person Meeting'}
              </Text>
            </View>

            {meeting.is_private && (
              <View style={styles.privateBadge}>
                <Icon name="lock" size={14} color="#fff" />
                <Text style={styles.privateText}>Private Meeting</Text>
              </View>
            )}
          </View>

          <Text style={styles.meetingTitle}>{meeting.title}</Text>

          <View style={styles.organizerInfo}>
            <Icon name="account" size={16} color="#666" />
            <Text style={styles.organizerText}>
              Organized by {meeting.organizer_name}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Date & Time</Text>

          <View style={styles.detailRow}>
            <Icon name="calendar" size={20} color="#2e7af5" />
            <Text style={styles.detailText}>
              {formatDate(meeting.start_date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="clock-outline" size={20} color="#2e7af5" />
            <Text style={styles.detailText}>
              {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>
            {meeting.mode === 'online' ? 'Meeting Link' : 'Location'}
          </Text>

          {meeting.mode === 'online' ? (
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL(meeting.meeting_link)}>
              <Icon name="link" size={20} color="#2e7af5" />
              <Text style={styles.linkText}>{meeting.meeting_link}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.detailRow}>
              <Icon name="map-marker" size={20} color="#2e7af5" />
              <Text style={styles.detailText}>{meeting.venue}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>About this Meeting</Text>
          <Text style={styles.descriptionText}>{meeting.description}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.participantsHeader}>
            <Text style={styles.sectionTitle}>Invited Doctors</Text>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setShowParticipantsModal(true)}>
              <Text style={styles.viewAllText}>View All</Text>
              <Icon name="chevron-right" size={16} color="#2e7af5" />
            </TouchableOpacity>
          </View>

          <Text style={styles.participantCount}>
            {meeting.invited_doctors ? meeting.invited_doctors.length : 0}{' '}
            doctors invited
          </Text>

          {meeting.invited_doctors && meeting.invited_doctors.length > 0 ? (
            <View style={styles.participantPreview}>
              {meeting.invited_doctors.slice(0, 3).map((doctor, index) => (
                <View key={doctor.id || index} style={styles.participantItem}>
                  <View style={styles.participantIcon}>
                    <Text style={styles.participantInitial}>
                      {doctor.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.participantName}>{doctor.name}</Text>
                </View>
              ))}

              {meeting.invited_doctors.length > 3 && (
                <TouchableOpacity
                  style={styles.moreParticipants}
                  onPress={() => setShowParticipantsModal(true)}>
                  <Text style={styles.moreParticipantsText}>
                    +{meeting.invited_doctors.length - 3} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noParticipantsText}>
              No doctors have been invited
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          {meeting.mode === 'online' && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoinMeeting}>
              <Icon name="video" size={20} color="#fff" />
              <Text style={styles.joinButtonText}>Join Meeting</Text>
            </TouchableOpacity>
          )}

          {isOrganizer && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelMeeting}>
              <Icon name="calendar-remove" size={20} color="#e53935" />
              <Text style={styles.cancelButtonText}>Cancel Meeting</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Participants Modal */}
      <Modal
        visible={showParticipantsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowParticipantsModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invited Doctors</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowParticipantsModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {meeting.invited_doctors && meeting.invited_doctors.length > 0 ? (
                meeting.invited_doctors.map((doctor, index) => (
                  <View
                    key={doctor.id || index}
                    style={styles.modalParticipantItem}>
                    <View style={styles.participantIcon}>
                      <Text style={styles.participantInitial}>
                        {doctor.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.participantDetails}>
                      <Text style={styles.participantName}>{doctor.name}</Text>
                      {doctor.email && (
                        <Text style={styles.participantEmail}>
                          {doctor.email}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyParticipants}>
                  <Icon name="account-off" size={40} color="#ccc" />
                  <Text style={styles.emptyParticipantsText}>
                    No doctors have been invited
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
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
  content: {
    flex: 1,
    padding: 16,
  },
  meetingHeader: {
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
  meetingBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  meetingTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  meetingTypeText: {
    fontSize: 12,
    color: '#2e7af5',
    fontWeight: '500',
    marginLeft: 4,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  privateText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  meetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  detailsCard: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    color: '#2e7af5',
    textDecorationLine: 'underline',
    marginLeft: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2e7af5',
    marginRight: 4,
  },
  participantCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  participantPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  participantIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e7af5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  participantInitial: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantName: {
    fontSize: 14,
    color: '#333',
  },
  moreParticipants: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  moreParticipantsText: {
    fontSize: 14,
    color: '#2e7af5',
    fontWeight: '500',
  },
  noParticipantsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButtons: {
    marginVertical: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7af5',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 12,
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e53935',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  modalParticipantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantDetails: {
    flex: 1,
  },
  participantEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyParticipants: {
    padding: 24,
    alignItems: 'center',
  },
  emptyParticipantsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default MeetingDetailsScreen;
