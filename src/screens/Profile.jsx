import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';

const Profile = ({navigation}) => {
  const {user, logout} = useAuth();

  const handleLogout = async () => {
    await logout();
    // Navigation will be handled by AppNavigator
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileInitial}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileRole}>
            {user?.role === 'doctor'
              ? 'Healthcare Professional'
              : user?.role === 'pharma'
              ? 'Pharmaceutical Representative'
              : 'User'}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.email || 'email@example.com'}
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="account-edit" size={24} color="#2e7af5" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="bell-outline" size={24} color="#2e7af5" />
            <Text style={styles.menuText}>Notifications</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="shield-account" size={24} color="#2e7af5" />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="help-circle-outline" size={24} color="#2e7af5" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="information-outline" size={24} color="#2e7af5" />
            <Text style={styles.menuText}>About</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

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
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2e7af5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: '#999',
  },
  sectionContainer: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ff4757',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
