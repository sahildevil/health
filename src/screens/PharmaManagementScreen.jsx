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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PharmaManagementScreen = ({navigation}) => {
  const [pharmaReps, setPharmaReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPharmaReps, setFilteredPharmaReps] = useState([]);
  const [error, setError] = useState(null);

  // Load pharma representatives from API
  const fetchPharmaReps = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPharmaReps();

      // Ensure each pharma rep has a proper id property
      const formattedData = data.map(pharma => ({
        ...pharma,
        id: pharma.id || pharma._id, // Use either id or _id
        // Format date if needed
        joinedDate:
          pharma.joinedDate ||
          (pharma.createdAt
            ? new Date(pharma.createdAt).toLocaleDateString()
            : 'Unknown'),
      }));

      console.log('Formatted pharma data:', formattedData[0]); // Debug log

      setPharmaReps(formattedData);
      setFilteredPharmaReps(formattedData);
    } catch (err) {
      console.error('Pharma rep fetch error:', err);
      setError(err.message || 'Failed to fetch pharmaceutical representatives');
      Alert.alert(
        'Error',
        'Could not load pharmaceutical representatives: ' +
          (err.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmaReps();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = pharmaReps.filter(
        pharma =>
          pharma.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pharma.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pharma.company &&
            pharma.company.toLowerCase().includes(searchQuery.toLowerCase())),
      );
      setFilteredPharmaReps(filtered);
    } else {
      setFilteredPharmaReps(pharmaReps);
    }
  }, [searchQuery, pharmaReps]);

  const handleViewDetails = pharmaId => {
    navigation.navigate('PharmaDetails', {pharmaId});
  };

  const renderPharmaItem = ({item}) => (
    <View style={styles.pharmaCard}>
      <View style={styles.pharmaHeader}>
        <View style={styles.pharmaInitialContainer}>
          <Text style={styles.pharmaInitial}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.pharmaInfo}>
          <Text style={styles.pharmaName}>{item.name}</Text>
          <Text style={styles.pharmaCompany}>
            {item.company || 'No company listed'}
          </Text>
        </View>
        <View
          style={[
            styles.verificationBadge,
            {backgroundColor: item.verified ? '#e8f5e9' : '#fff3e0'},
          ]}>
          <Icon
            name={item.verified ? 'check-circle' : 'clock-outline'}
            size={16}
            color={item.verified ? '#2e7d32' : '#e65100'}
            style={{marginRight: 4}}
          />
          <Text
            style={[
              styles.verificationText,
              {color: item.verified ? '#2e7d32' : '#e65100'},
            ]}>
            {item.verified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      <Text style={styles.pharmaEmail}>{item.email}</Text>
      <Text style={styles.pharmaJoined}>Joined: {item.joinedDate}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleViewDetails(item.id)}>
          <Icon name="file-document-outline" size={18} color="#2e7af5" />
          <Text style={styles.detailsButtonText}>View Details & Documents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {paddingTop: useSafeAreaInsets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pharma Representatives</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or company"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pharmaReps.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {pharmaReps.filter(pharma => pharma.verified).length}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {pharmaReps.filter(pharma => !pharma.verified).length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>
            Loading pharmaceutical representatives...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#f44336" />
          <Text style={styles.errorText}>
            Error loading pharmaceutical representatives
          </Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPharmaReps}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPharmaReps.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="pill" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            No pharmaceutical representatives found
          </Text>
          {searchQuery ? (
            <Text style={styles.emptySubtext}>
              Try adjusting your search criteria
            </Text>
          ) : (
            <Text style={styles.emptySubtext}>
              No registered pharmaceutical representatives in the system
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPharmaReps}
          renderItem={renderPharmaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 48,
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
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2e7af5',
    borderRadius: 8,
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
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  pharmaCard: {
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
  pharmaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pharmaInitialContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4caf50', // Different color than doctor
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pharmaInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  pharmaInfo: {
    flex: 1,
  },
  pharmaName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pharmaCompany: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pharmaEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pharmaJoined: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#2e7af5',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default PharmaManagementScreen;
