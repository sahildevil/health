import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { adminService } from '../services/api';

const UserVerificationScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorDocuments, setDoctorDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  
  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingDoctors();
      setDoctors(response);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending doctors: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDoctorDocuments = async (doctorId) => {
    try {
      setDocumentsLoading(true);
      const documents = await adminService.getDoctorDocuments(doctorId);
      setDoctorDocuments(documents);
    } catch (error) {
      Alert.alert('Error', 'Failed to load documents: ' + error.message);
    } finally {
      setDocumentsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPendingDoctors();
  }, []);
  
  const handleDoctorSelect = async (doctor) => {
    setSelectedDoctor(doctor);
    await fetchDoctorDocuments(doctor.id);
  };
  
  const handleViewDocument = (document) => {
    setViewingDocument(document);
    setModalVisible(true);
  };
  
  const showActionModal = (verify = true) => {
    setIsVerifying(verify);
    setVerificationNotes('');
    setActionModalVisible(true);
  };
  
  const handleVerifyDoctor = async () => {
    try {
      setActionLoading(true);
      await adminService.verifyDoctor(selectedDoctor.id, verificationNotes);
      
      // Update local state
      setDoctors(doctors.filter(doc => doc.id !== selectedDoctor.id));
      setSelectedDoctor(null);
      setDoctorDocuments([]);
      
      Alert.alert('Success', 'Doctor has been verified successfully');
      setActionModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to verify doctor: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleRejectDoctor = async () => {
    if (!verificationNotes) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }
    
    try {
      setActionLoading(true);
      await adminService.rejectDoctor(selectedDoctor.id, verificationNotes);
      
      // Update local state
      setDoctors(doctors.filter(doc => doc.id !== selectedDoctor.id));
      setSelectedDoctor(null);
      setDoctorDocuments([]);
      
      Alert.alert('Success', 'Doctor has been rejected');
      setActionModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject doctor: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.doctorCard, 
        selectedDoctor?.id === item.id && styles.selectedDoctorCard
      ]}
      onPress={() => handleDoctorSelect(item)}
    >
      <View style={styles.doctorInitialContainer}>
        <Text style={styles.doctorInitial}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.doctorSpecialty}>{item.specialty || 'General Medicine'}</Text>
        <Text style={styles.doctorEmail}>{item.email}</Text>
        <Text style={styles.doctorJoined}>Joined: {new Date(item.joinedDate).toLocaleDateString()}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  const renderDocumentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.documentCard}
      onPress={() => handleViewDocument(item)}
    >
      <View style={styles.documentIconContainer}>
        <Icon 
          name={item.type.includes('image') ? 'image' : 'file-pdf-box'} 
          size={28} 
          color="#2e7af5"
        />
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.documentDate}>
          Uploaded on {item.upload_date ? new Date(item.upload_date).toLocaleDateString() : 'Unknown date'}
        </Text>
      </View>
      <Icon name="eye" size={24} color="#666" />
    </TouchableOpacity>
  );
  
  const renderDocumentViewer = () => {
    if (!viewingDocument) return null;
    
    const isImage = viewingDocument.type.includes('image');
    
    return (
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.documentViewerContainer}>
          <View style={styles.documentViewerHeader}>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.documentViewerTitle} numberOfLines={1}>
              {viewingDocument.name}
            </Text>
            <View style={{width: 24}} />
          </View>
          
          <View style={styles.documentContent}>
            {isImage ? (
              <Image
                source={{ uri: viewingDocument.url }}
                style={styles.documentImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.pdfContainer}>
                <Icon name="file-pdf-box" size={60} color="#e53935" />
                <Text style={styles.pdfTitle}>{viewingDocument.name}</Text>
                <Text style={styles.pdfHint}>
                  This is a PDF document.{" "}
                  <TouchableOpacity onPress={() => Linking.openURL(viewingDocument.url)}>
                    <Text style={styles.pdfLink}>Open PDF</Text>
                  </TouchableOpacity>
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderActionModal = () => {
    return (
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {isVerifying ? 'Verify Doctor' : 'Reject Doctor'}
            </Text>
            
            {selectedDoctor && (
              <Text style={styles.modalDoctorName}>{selectedDoctor.name}</Text>
            )}
            
            <Text style={styles.modalLabel}>Notes {isVerifying ? '(optional)' : '(required)'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={isVerifying ? 
                "Add any notes about verification" : 
                "Please provide a reason for rejection"}
              multiline={true}
              numberOfLines={4}
              value={verificationNotes}
              onChangeText={setVerificationNotes}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setActionModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  isVerifying ? styles.modalButtonVerify : styles.modalButtonReject
                ]}
                onPress={isVerifying ? handleVerifyDoctor : handleRejectDoctor}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {isVerifying ? 'Verify' : 'Reject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Verification</Text>
        <View style={{width: 24}} />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Pending Verification</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2e7af5" />
              <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
          ) : doctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="check-circle-outline" size={60} color="#4caf50" />
              <Text style={styles.emptyText}>No pending verifications</Text>
              <Text style={styles.emptySubtext}>All doctors have been verified</Text>
            </View>
          ) : (
            <FlatList
              data={doctors}
              renderItem={renderDoctorItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
        
        {selectedDoctor && (
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Verification Details</Text>
            </View>
            
            <View style={styles.doctorDetailCard}>
              <View style={styles.doctorDetailHeader}>
                <View style={styles.doctorDetailInitialContainer}>
                  <Text style={styles.doctorDetailInitial}>{selectedDoctor.name.charAt(0)}</Text>
                </View>
                <View style={styles.doctorDetailInfo}>
                  <Text style={styles.doctorDetailName}>{selectedDoctor.name}</Text>
                  <Text style={styles.doctorDetailSpecialty}>
                    {selectedDoctor.specialty || 'General Medicine'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.doctorInfoItem}>
                <Icon name="email-outline" size={20} color="#666" />
                <Text style={styles.doctorInfoText}>{selectedDoctor.email}</Text>
              </View>
              
              <View style={styles.doctorInfoItem}>
                <Icon name="calendar" size={20} color="#666" />
                <Text style={styles.doctorInfoText}>
                  Joined: {new Date(selectedDoctor.joinedDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.documentsHeader}>
              <Text style={styles.documentsTitle}>Submitted Documents</Text>
            </View>
            
            {documentsLoading ? (
              <View style={styles.documentsLoadingContainer}>
                <ActivityIndicator size="small" color="#2e7af5" />
                <Text style={styles.documentsLoadingText}>Loading documents...</Text>
              </View>
            ) : doctorDocuments.length === 0 ? (
              <View style={styles.noDocumentsContainer}>
                <Icon name="file-document-outline" size={48} color="#ccc" />
                <Text style={styles.noDocumentsText}>No documents submitted</Text>
              </View>
            ) : (
              <FlatList
                data={doctorDocuments}
                renderItem={renderDocumentItem}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.documentsContainer}
              />
            )}
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={() => showActionModal(false)}
              >
                <Icon name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={() => showActionModal(true)}
              >
                <Icon name="check-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {!selectedDoctor && !loading && doctors.length > 0 && (
          <View style={styles.detailSection}>
            <View style={styles.selectDoctorContainer}>
              <Icon name="arrow-left" size={48} color="#ccc" />
              <Text style={styles.selectDoctorText}>Select a doctor to view details</Text>
            </View>
          </View>
        )}
      </View>
      
      {renderDocumentViewer()}
      {renderActionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  listSection: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  detailSection: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  listContainer: {
    paddingVertical: 8,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDoctorCard: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2e7af5',
  },
  doctorInitialContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2e7af5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doctorInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
  },
  doctorEmail: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  doctorJoined: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  detailHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectDoctorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  selectDoctorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  doctorDetailCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  doctorDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorDetailInitialContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2e7af5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorDetailInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  doctorDetailInfo: {
    marginLeft: 16,
  },
  doctorDetailName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  doctorDetailSpecialty: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  doctorInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  doctorInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  documentsHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  documentsLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  documentsLoadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  noDocumentsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
  },
  noDocumentsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  documentsContainer: {
    padding: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  documentDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    marginLeft: 16,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  documentViewerContainer: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  documentViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  documentViewerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  documentContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  pdfContainer: {
    alignItems: 'center',
    padding: 20,
  },
  pdfTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  pdfHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  pdfLink: {
    color: '#2e7af5',
    textDecorationLine: 'underline',
  },
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
    shadowOffset: { width: 0, height: 2 },
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
  modalDoctorName: {
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
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonVerify: {
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
});

export default UserVerificationScreen;