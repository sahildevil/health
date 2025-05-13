import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {adminService} from '../services/api';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const DoctorListScreen = ({navigation}) => {
    const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [error, setError] = useState(null);

  // Load doctors from API
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDoctors();
      setDoctors(data);
      setFilteredDoctors(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch doctors');
      Alert.alert(
        'Error',
        'Could not load doctors: ' + (err.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = doctors.filter(
        doctor =>
          doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [searchQuery, doctors]);

  const handleVerifyDoctor = doctorId => {
    Alert.alert(
      'Verify Doctor',
      'Are you sure you want to verify this doctor?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Verify',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.verifyDoctor(doctorId);

              // Update local state to reflect the change
              const updatedDoctors = doctors.map(doctor =>
                doctor.id === doctorId ? {...doctor, verified: true} : doctor,
              );
              setDoctors(updatedDoctors);
              setFilteredDoctors(
                filteredDoctors.map(doctor =>
                  doctor.id === doctorId ? {...doctor, verified: true} : doctor,
                ),
              );

              Alert.alert('Success', 'Doctor has been verified');
            } catch (err) {
              Alert.alert(
                'Error',
                'Failed to verify doctor: ' + (err.message || 'Unknown error'),
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteDoctor = doctorId => {
    Alert.alert(
      'Delete Doctor',
      'Are you sure you want to delete this doctor? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.deleteDoctor(doctorId);

              // Update local state to remove the doctor
              const updatedDoctors = doctors.filter(
                doctor => doctor.id !== doctorId,
              );
              setDoctors(updatedDoctors);
              setFilteredDoctors(
                filteredDoctors.filter(doctor => doctor.id !== doctorId),
              );

              Alert.alert('Success', 'Doctor has been removed');
            } catch (err) {
              Alert.alert(
                'Error',
                'Failed to delete doctor: ' + (err.message || 'Unknown error'),
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderDoctorItem = ({item}) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <View>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
        </View>
        <View
          style={[
            styles.verificationBadge,
            {backgroundColor: item.verified ? '#e8f5e9' : '#fff3e0'},
          ]}>
          <Text
            style={[
              styles.verificationText,
              {color: item.verified ? '#2e7d32' : '#e65100'},
            ]}>
            {item.verified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      <Text style={styles.doctorEmail}>{item.email}</Text>
      <Text style={styles.doctorJoined}>Joined: {item.joinedDate}</Text>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() =>
            navigation.navigate('DoctorDetails', {doctorId: item.id})
          }>
          <Icon name="eye" size={16} color="#2e7af5" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>

        {!item.verified && (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleVerifyDoctor(item.id)}>
            <Icon name="check-circle" size={16} color="#fff" />
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDoctor(item.id)}>
          <Icon name="delete" size={16} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Doctors Management</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or specialty"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{doctors.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {doctors.filter(doc => doc.verified).length}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {doctors.filter(doc => !doc.verified).length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle-outline" size={60} color="#d32f2f" />
          <Text style={styles.emptyText}>Error loading doctors</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDoctors}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="account-search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No doctors found</Text>
          {searchQuery && (
            <Text style={styles.emptySubtext}>
              Try a different search query
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          renderItem={renderDoctorItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchDoctors}
        />
      )}
    </SafeAreaView>
  );
};
export default DoctorListScreen;
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
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#e8f5e9',
  },
  inactiveBadge: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  doctorDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    color: '#2e7af5',
  },
  dangerButton: {
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  successButton: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
  dangerText: {
    color: '#ff4757',
  },
  successText: {
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
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
});
