import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { adminService } from '../services/api';

const DoctorDetailsScreen = ({ route, navigation }) => {
  const { doctorId } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDoctorDetails(doctorId);
      setDoctor(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch doctor details');
      Alert.alert('Error', 'Could not load doctor details: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const handleVerifyDoctor = async () => {
    try {
      setLoading(true);
      await adminService.verifyDoctor(doctorId);
      setDoctor({ ...doctor, verified: true });
      Alert.alert('Success', 'Doctor has been verified');
    } catch (err) {
      Alert.alert('Error', 'Failed to verify doctor: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = () => {
    Alert.alert(
      'Delete Doctor',
      'Are you sure you want to delete this doctor? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.deleteDoctor(doctorId);
              Alert.alert('Success', 'Doctor has been removed', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete doctor: ' + (err.message || 'Unknown error'));
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading doctor details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#d32f2f" />
          <Text style={styles.errorText}>Error loading doctor details</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchDoctorDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileInitial}>{doctor?.name?.charAt(0) || 'D'}</Text>
          </View>
          <Text style={styles.profileName}>{doctor?.name}</Text>
          <Text style={styles.profileSpecialty}>{doctor?.specialty}</Text>
          <View style={[
            styles.verificationBadge,
            { backgroundColor: doctor?.verified ? '#e8f5e9' : '#fff3e0' }
          ]}>
            <Icon
              name={doctor?.verified ? "check-circle" : "clock-outline"}
              size={14}
              color={doctor?.verified ? '#2e7d32' : '#e65100'}
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.verificationText,
              { color: doctor?.verified ? '#2e7d32' : '#e65100' }
            ]}>
              {doctor?.verified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.detailItem}>
            <Icon name="email-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{doctor?.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="calendar" size={20} color="#666" />
            <Text style={styles.detailLabel}>Joined:</Text>
            <Text style={styles.detailValue}>{doctor?.joinedDate}</Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          <View style={styles.detailItem}>
            <Icon name="doctor" size={20} color="#666" />
            <Text style={styles.detailLabel}>Specialty:</Text>
            <Text style={styles.detailValue}>{doctor?.specialty}</Text>
          </View>
        </View>

        {doctor?.achievements && doctor.achievements.length > 0 ? (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {doctor.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Icon name="trophy-award" size={16} color="#2e7af5" />
                <Text style={styles.achievementText}>{achievement}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.emptyText}>No achievements listed</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {!doctor?.verified && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyDoctor}
            >
              <Icon name="check-circle" size={20} color="#fff" />
              <Text style={styles.verifyButtonText}>Verify Doctor</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteDoctor}
          >
            <Icon name="delete" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Doctor</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
    padding: 16,
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2e7af5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileSpecialty: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 8,
    width: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f0f7ff',
    borderRadius: 4,
  },
  achievementText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    marginBottom: 24,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default DoctorDetailsScreen;