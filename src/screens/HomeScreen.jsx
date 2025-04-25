import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const HomeScreen = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <View>
        <Text style={styles.welcomeText}>Welcome, Dr. Smith</Text>
        <Text style={styles.subtitleText}>Here's your medical education today</Text>
        </View>
        <View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Icon name="account-circle" size={40} color="#2e7af5" />
          </TouchableOpacity>
        </View>
 
      </View>

      {/* Stats Cards */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.statsContainer}>
          {/* Upcoming Conferences Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Upcoming Conferences</Text>
              <Icon name="account-group" size={20} color="#666" />
            </View>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statSubtext}>+2 registered this week</Text>
          </View>

          {/* Meetings This Week Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Meetings This Week</Text>
              <Icon name="calendar" size={20} color="#666" />
            </View>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statSubtext}>Next one in 2 days</Text>
          </View>

          {/* CME Hours Completed Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>CME Hours Completed</Text>
              <Icon name="clock-outline" size={20} color="#666" />
            </View>
            <Text style={styles.statNumber}>12.5</Text>
            <Text style={styles.statSubtext}>+2.5 from last month</Text>
          </View>

          {/* Available CME Courses Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Available CME Courses</Text>
              <Icon name="book-open-variant" size={20} color="#666" />
            </View>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statSubtext}>5 new courses added</Text>
          </View>
        </View>

        {/* Events Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Upcoming Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Ongoing Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Recommended</Text>
          </TouchableOpacity>
        </View>

        {/* Event Cards */}
        <View style={styles.eventCardsContainer}>
          {/* Cardiology Summit */}
          <View style={styles.eventCard}>
            <View style={styles.eventBadgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Conference</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Upcoming</Text>
              </View>
            </View>
            <Text style={styles.eventTitle}>Cardiology Summit 2025</Text>
            <Text style={styles.eventDescription}>
              The latest advancements in cardiovascular care and research, featuring leading experts from around the world.
            </Text>
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailItem}>
                <Icon name="calendar" size={16} color="#666" />
                <Text style={styles.eventDetailText}>Jun 15, 2025 - Jun 17, 2025</Text>
              </View>
              <View style={styles.eventDetailItem}>
                <Icon name="map-marker" size={16} color="#666" />
                <Text style={styles.eventDetailText}>New York Medical Center</Text>
              </View>
              <View style={styles.eventDetailItem}>
                <Icon name="account-group" size={16} color="#666" />
                <Text style={styles.eventDetailText}>Organized by American Cardiology Foundation</Text>
              </View>
            </View>
            <View style={styles.eventButtonContainer}>
              <TouchableOpacity style={styles.eventButton}>
                <Text style={styles.eventButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.eventButton, styles.registerButton]}>
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {/* <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="view-dashboard" size={24} color="#7B68EE" />
          <Text style={[styles.navText, styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="video-account" size={24} color="#666" />
          <Text style={styles.navText}>Conferences</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="calendar-clock" size={24} color="#666" />
          <Text style={styles.navText}>Meetings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="chat" size={24} color="#666" />
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="book-open-page-variant" size={24} color="#666" />
          <Text style={styles.navText}>CME Courses</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',  
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#888',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    marginRight: 16,
    paddingBottom: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2e7af5',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2e7af5',
    fontWeight: '500',
  },
  eventCardsContainer: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eventBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#EBE9FD',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeText: {
    color: '#2e7af5',
    fontSize: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  eventButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  eventButtonText: {
    color: '#2e7af5',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
    color: '#666',
    marginTop: 4,
  },
  activeNavText: {
    color: '#2e7af5',
    fontWeight: '500',
  },
});

export default HomeScreen;