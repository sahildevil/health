import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ScheduleScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const insets = useSafeAreaInsets();
  const renderAppointment = (doctor, specialty, date, time, confirmed) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View>
          <Text style={styles.doctorName}>{doctor}</Text>
          <Text style={styles.specialty}>{specialty}</Text>
        </View>
        <View style={styles.avatarContainer}>
          <Icon name="account-circle" size={40} color="#7B68EE" />
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailItem}>
          <Icon name="calendar" size={16} color="#888" />
          <Text style={styles.detailText}>{date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="clock-outline" size={16} color="#888" />
          <Text style={styles.detailText}>{time}</Text>
        </View>

        {confirmed && (
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Confirmed</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rescheduleButton}>
          <Text style={styles.rescheduleButtonText}>Reschedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        {['Upcoming', 'Completed', 'Canceled'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.activeTabButtonText,
              ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Nearest Visit */}
        <Text style={styles.sectionTitle}>Nearest visit</Text>
        {renderAppointment(
          'Dr. Chris Frazier',
          'Pediatrician',
          '12/03/2021',
          '10:30 AM',
          true,
        )}

        {/* Future Visits */}
        <Text style={styles.sectionTitle}>Future visits</Text>
        {renderAppointment(
          'Dr. Charlie Black',
          'Cardiologist',
          '12/03/2021',
          '10:30 AM',
          true,
        )}

        {renderAppointment(
          'Dr. Viola Dune',
          'Neurologist',
          '15/03/2021',
          '9:00 AM',
          true,
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="home-outline" size={24} color="#888" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="message-outline" size={24} color="#888" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="calendar-check" size={24} color="#7B68EE" />
          <Text style={[styles.navText, styles.activeNavText]}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="cog-outline" size={24} color="#888" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#7B68EE',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#888',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    marginTop: 8,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  specialty: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  avatarContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDetails: {
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  rescheduleButton: {
    backgroundColor: '#7B68EE',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rescheduleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeNavText: {
    color: '#7B68EE',
  },
});

export default ScheduleScreen;
