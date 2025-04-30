import React, {useState} from 'react';
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
import * as ImagePicker from 'react-native-image-picker';
import RNFS from 'react-native-fs';
// import {userService} from '../services/api';
import WebViewDocumentPicker from '../components/WebViewDocumentPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import api, { userService } from '../services/api';
const UploadDocumentsScreen = ({navigation}) => {
  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [webViewPickerVisible, setWebViewPickerVisible] = useState(false);

  const pickDocument = () => {
    setWebViewPickerVisible(true);
  };

  const handleWebViewFilesSelected = files => {
    setWebViewPickerVisible(false);

    if (files && files.length > 0) {
      const newDocs = files.map(file => ({
        name: file.name,
        type: file.type,
        uri: file.uri,
        size: file.size,
      }));

      setDocuments(prev => [...prev, ...newDocs]);
    }
  };

  const removeDocument = index => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    setDocuments(newDocs);
  };

  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    ImagePicker.launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Camera Error: ' + response.errorMessage);
      } else {
        const asset = response.assets[0];
        const newDoc = {
          name: `Photo_${new Date().toISOString()}.jpg`,
          type: asset.type,
          uri: asset.uri,
          size: asset.fileSize,
        };
        setDocuments([...documents, newDoc]);
      }
    });
  };

  const pickFromGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'ImagePicker Error: ' + response.errorMessage);
      } else {
        const asset = response.assets[0];
        const newDoc = {
          name: asset.fileName || `Image_${new Date().toISOString()}.jpg`,
          type: asset.type,
          uri: asset.uri,
          size: asset.fileSize,
        };
        setDocuments([...documents, newDoc]);
      }
    });
  };

// In handleUploadDocuments function

const handleUploadDocuments = async () => {
  if (documents.length === 0) {
    Alert.alert('Error', 'Please select at least one document to upload');
    return;
  }

  setIsSubmitting(true);

  try {
    const uploadedDocs = [];
    const token = await getAuthToken();

    for (const doc of documents) {
      console.log(`Uploading document: ${doc.name}`);
      
      // Create form data
      const formData = new FormData();
      
      // Add file to form data
      formData.append('document', {
        uri: Platform.OS === 'ios' ? doc.uri.replace('file://', '') : doc.uri,
        type: doc.type || 'application/octet-stream',
        name: doc.name || `file-${Date.now()}.${doc.uri.split('.').pop()}`
      });
      
      // Upload to our server endpoint
      const response = await fetch(`${api.defaults.baseURL}/uploads/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for multipart/form-data
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Upload result:', result);
      
      // Create document object with Supabase URL and storage path
      uploadedDocs.push({
        name: doc.name,
        type: doc.type,
        size: doc.size,
        url: result.url,
        storage_path: result.storage_path,
        upload_date: new Date().toISOString(),
        verified: false,
      });
    }

    // Upload the documents to user profile
    if (uploadedDocs.length > 0) {
      await userService.uploadDocuments(uploadedDocs);
      
      Alert.alert('Success', 'Documents uploaded successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    }
  } catch (error) {
    console.error('Error uploading documents:', error);
    Alert.alert(
      'Upload Failed', 
      `${error.message || 'Please try again later'}\n\nCheck your network connection and server status.`
    );
  } finally {
    setIsSubmitting(false);
  }
};

  // Add this helper function to get the auth token
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('@token');
      return token;
    } catch (error) {
      console.error('Failed to get auth token', error);
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Documents</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Medical Credentials</Text>
        <Text style={styles.sectionSubtitle}>
          Please upload your medical degree, certifications, or license
          documents for verification
        </Text>

        <View style={styles.uploadButtonsContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Icon name="file-document-outline" size={24} color="#2e7af5" />
            <Text style={styles.uploadButtonText}>Browse Files</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
            <Icon name="camera" size={24} color="#2e7af5" />
            <Text style={styles.uploadButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickFromGallery}>
            <Icon name="image" size={24} color="#2e7af5" />
            <Text style={styles.uploadButtonText}>From Gallery</Text>
          </TouchableOpacity>
        </View>

        {documents.length > 0 && (
          <View style={styles.documentListContainer}>
            <Text style={styles.documentListTitle}>
              Selected Documents ({documents.length})
            </Text>
            {documents.map((doc, index) => (
              <View key={index} style={styles.documentItem}>
                <View style={styles.documentInfo}>
                  <Icon
                    name={doc.type.includes('image') ? 'image' : 'file-pdf-box'}
                    size={24}
                    color="#2e7af5"
                  />
                  <View style={styles.documentDetails}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text style={styles.documentSize}>
                      {(doc.size / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => removeDocument(index)}
                  style={styles.documentRemove}>
                  <Icon name="close" size={20} color="#ff4c4c" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            {marginTop: 20, backgroundColor: '#2e7af5'},
          ]}
          onPress={handleUploadDocuments}
          disabled={isSubmitting || documents.length === 0}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="upload" size={24} color="#fff" />
              <Text style={[styles.uploadButtonText, {color: '#fff'}]}>
                Upload Documents
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Icon name="information-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Your documents will be reviewed by our team for verification. This
            process may take 1-2 business days.
          </Text>
        </View>
      </ScrollView>

      <WebViewDocumentPicker
        visible={webViewPickerVisible}
        onClose={() => setWebViewPickerVisible(false)}
        onFilesSelected={handleWebViewFilesSelected}
      />
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2e7af5',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#2e7af5',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  documentListContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  documentListTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 8,
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    color: '#333',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
  },
  documentRemove: {
    padding: 4,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
    flexDirection: 'row',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default UploadDocumentsScreen;
