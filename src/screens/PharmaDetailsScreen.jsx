import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {adminService} from '../services/api';

const PharmaDetailsScreen = ({route, navigation}) => {
  const {pharmaId} = route.params;
  const [pharma, setPharma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPharmaDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPharmaDetails(pharmaId);
      setPharma(data);
    } catch (err) {
      setError(
        err.message || 'Failed to fetch pharmaceutical representative details',
      );
      Alert.alert(
        'Error',
        'Could not load details: ' + (err.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmaDetails();
  }, [pharmaId]);

  const handleVerifyPharma = async () => {
    try {
      setLoading(true);
      await adminService.verifyPharma(pharmaId);
      setPharma({...pharma, verified: true});
      Alert.alert('Success', 'Pharmaceutical representative has been verified');
    } catch (err) {
      Alert.alert(
        'Error',
        'Failed to verify: ' + (err.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePharma = () => {
    Alert.alert(
      'Delete Representative',
      'Are you sure you want to delete this pharmaceutical representative? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.deletePharma(pharmaId);
              Alert.alert(
                'Success',
                'Pharmaceutical representative has been removed',
                [{text: 'OK', onPress: () => navigation.goBack()}],
              );
            } catch (err) {
              Alert.alert(
                'Error',
                'Failed to delete: ' + (err.message || 'Unknown error'),
              );
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Representative Details</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading details...</Text>
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
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Representative Details</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#d32f2f" />
          <Text style={styles.errorText}>Error loading details</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPharmaDetails}>
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
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Representative Details</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileInitial}>
              {pharma?.name?.charAt(0) || 'P'}
            </Text>
          </View>
          <Text style={styles.profileName}>{pharma?.name}</Text>
          <Text style={styles.profileCompany}>{pharma?.company}</Text>
          <View
            style={[
              styles.verificationBadge,
              {backgroundColor: pharma?.verified ? '#e8f5e9' : '#fff3e0'},
            ]}>
            <Icon
              name={pharma?.verified ? 'check-circle' : 'clock-outline'}
              size={14}
              color={pharma?.verified ? '#2e7d32' : '#e65100'}
              style={{marginRight: 4}}
            />
            <Text
              style={[
                styles.verificationText,
                {color: pharma?.verified ? '#2e7d32' : '#e65100'},
              ]}>
              {pharma?.verified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.detailItem}>
            <Icon name="email-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{pharma?.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="calendar" size={20} color="#666" />
            <Text style={styles.detailLabel}>Joined:</Text>
            <Text style={styles.detailValue}>{pharma?.joinedDate}</Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.detailItem}>
            <Icon name="office-building" size={20} color="#666" />
            <Text style={styles.detailLabel}>Company:</Text>
            <Text style={styles.detailValue}>
              {pharma?.company || 'Not specified'}
            </Text>
          </View>
          {pharma?.position && (
            <View style={styles.detailItem}>
              <Icon name="briefcase" size={20} color="#666" />
              <Text style={styles.detailLabel}>Position:</Text>
              <Text style={styles.detailValue}>{pharma?.position}</Text>
            </View>
          )}
        </View>

        {pharma?.documents && pharma.documents.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Company Documents</Text>

            {pharma.documents.map((doc, index) => (
              <View key={index} style={styles.documentItem}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentIcon}>
                    <Icon
                      name={
                        doc.type.includes('image') ? 'image' : 'file-pdf-box'
                      }
                      size={24}
                      color="#2e7af5"
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text style={styles.documentDate}>
                      Uploaded on{' '}
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {doc.preview && (
                  <View style={styles.documentPreview}>
                    {doc.type.includes('image') ? (
                      <Image
                        source={{uri: `data:${doc.type};base64,${doc.preview}`}}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.pdfPreview}>
                        <Icon name="file-pdf-box" size={40} color="#e53935" />
                        <Text style={styles.pdfText}>PDF Document</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {(!pharma?.documents || pharma.documents.length === 0) && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Company Documents</Text>
            <View style={styles.noDocumentsContainer}>
              <Icon name="file-document-outline" size={40} color="#ccc" />
              <Text style={styles.noDocumentsText}>No documents uploaded</Text>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          {!pharma?.verified && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyPharma}>
              <Icon name="check-circle" size={20} color="#fff" />
              <Text style={styles.verifyButtonText}>Verify Representative</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeletePharma}>
            <Icon name="delete" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Representative</Text>
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
    backgroundColor: '#4caf50', // Different color for pharma
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
  profileCompany: {
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
  noDocumentsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noDocumentsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  documentItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  documentPreview: {
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pdfPreview: {
    alignItems: 'center',
  },
  pdfText: {
    marginTop: 8,
    color: '#666',
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

export default PharmaDetailsScreen;
