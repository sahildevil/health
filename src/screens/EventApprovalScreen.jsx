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
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { eventService } from '../services/api';

const EventApprovalScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const showVerificationModal = (event, approving = true) => {
    setSelectedEvent(event);
    setIsApproving(approving);
    setVerificationNotes('');
    setModalVisible(true);
  };

  const handleVerificationSubmit = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      Alert.alert('Error', 'Event ID is missing or invalid.');
      return;
    }
  
    try {
      setActionLoading(true);
  
      if (isApproving) {
        await eventService.approveEvent(selectedEvent.id, verificationNotes); // Use `id`, not `_id`
        Alert.alert('Success', 'Event has been approved');
      } else {
        await eventService.rejectEvent(selectedEvent.id, verificationNotes); // Use `id`, not `_id`
        Alert.alert('Success', 'Event has been rejected');
      }
  
      // Remove the event from the list
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      setModalVisible(false);
    } catch (err) {
      Alert.alert(
        'Error',
        `Failed to ${isApproving ? 'approve' : 'reject'} event: ` +
          (err.message || 'Unknown error')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      console.log("Approving event with ID:", selectedEvent?.id); // Debug to check ID

      if (!selectedEvent || !selectedEvent.id) {
        Alert.alert("Error", "Event ID is missing.");
        setIsSubmitting(false);
        return;
      }

      await eventService.approveEvent(selectedEvent.id, verificationNotes);
      setModalVisible(false);
      setVerificationNotes('');
      
      // Update events list by filtering out the approved event
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      
      Alert.alert("Success", "Event has been approved successfully.");
    } catch (error) {
      console.error("Approval error:", error);
      Alert.alert("Error", `Failed to approve event: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (eventId) => {
    navigation.navigate('EventDetails', { eventId });
  };

  const handleEditEvent = (eventId) => {
    navigation.navigate('AdminEditEvent', { eventId, fromApproval: true });
  };

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventType}>{item.type}</Text>
        <Text style={styles.eventMode}>{item.mode}</Text>
      </View>
      
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>
      
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
        <View style={styles.detailItem}>
          <Icon name="clock-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Submitted: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewDetails(item.id)}
        >
          <Icon name="eye" size={16} color="#2e7af5" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>

             {/* Add Edit button */}
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => handleEditEvent(item.id)}
      >
        <Icon name="pencil" size={16} color="#fff" />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.approveButton}
          onPress={() => showVerificationModal(item, true)}
        >
          <Icon name="check-circle" size={16} color="#fff" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => showVerificationModal(item, false)}
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

      {/* Verification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {isApproving ? 'Approve Event' : 'Reject Event'}
            </Text>
            
            {selectedEvent && (
              <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>
            )}
            
            <Text style={styles.modalLabel}>Verification Notes (optional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={isApproving ? 
                "Add any notes about the approval" : 
                "Please provide a reason for rejection"
              }
              multiline={true}
              numberOfLines={4}
              value={verificationNotes}
              onChangeText={setVerificationNotes}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  isApproving ? styles.modalButtonApprove : styles.modalButtonReject
                ]}
                onPress={handleVerificationSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {isApproving ? 'Approve' : 'Reject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalView: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalEventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f2f2f2',
  },
  modalButtonApprove: {
    backgroundColor: '#4caf50',
  },
  modalButtonReject: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default EventApprovalScreen;