import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebViewDocumentPicker from './WebViewDocumentPicker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import api from '../services/api';

const BrochureUploader = ({onBrochureUploaded, currentBrochure, eventId}) => {
  const [brochure, setBrochure] = useState(currentBrochure || null);
  const [uploading, setUploading] = useState(false);
  const [webViewPickerVisible, setWebViewPickerVisible] = useState(false);

  const handleDocumentPick = () => {
    setWebViewPickerVisible(true);
  };

  const handleWebViewFilesSelected = files => {
    setWebViewPickerVisible(false);

    if (files && files.length > 0) {
      // We only need one file as brochure
      const file = files[0];

      // Validate if it's a PDF
      if (!file.type.includes('pdf')) {
        Alert.alert(
          'Invalid File',
          'Please select a PDF file for the brochure',
        );
        return;
      }

      // Upload the brochure
      handleUploadBrochure(file);
    }
  };

  const handleUploadBrochure = async file => {
    if (!file) return;

    setUploading(true);

    try {
      const token = await AsyncStorage.getItem('@token');

      // Create form data
      const formData = new FormData();

      // Add file to form data
      formData.append('document', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: 'application/pdf',
        name: file.name || `brochure-${Date.now()}.pdf`,
      });

      // Add event_id to the form data
      formData.append('event_id', eventId);

      // Upload to server endpoint
      const response = await fetch(`${api.defaults.baseURL}/uploads/brochure`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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

      // Set the brochure data
      setBrochure(result);

      // Notify parent component
      if (onBrochureUploaded) {
        onBrochureUploaded(result);
      }
    } catch (error) {
      console.error('Error uploading brochure:', error);
      Alert.alert(
        'Upload Error',
        'Failed to upload brochure: ' + error.message,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBrochure = () => {
    Alert.alert(
      'Remove Brochure',
      'Are you sure you want to remove this brochure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setBrochure(null);
            if (onBrochureUploaded) {
              onBrochureUploaded(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Brochure (PDF)</Text>

      {brochure ? (
        <View style={styles.brochureContainer}>
          <View style={styles.brochureInfo}>
            <Icon name="file-pdf-box" size={36} color="#e53935" />
            <View style={styles.brochureDetails}>
              <Text style={styles.brochureName} numberOfLines={1}>
                {brochure.name}
              </Text>
              <Text style={styles.brochureSize}>
                {(brochure.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveBrochure}>
            <Icon name="delete" size={24} color="#ff4c4c" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleDocumentPick}
          disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#2e7af5" />
          ) : (
            <>
              <Icon name="file-pdf-upload" size={30} color="#2e7af5" />
              <Text style={styles.uploadButtonText}>Upload PDF Brochure</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Document Picker */}
      <WebViewDocumentPicker
        visible={webViewPickerVisible}
        onClose={() => setWebViewPickerVisible(false)}
        onFilesSelected={handleWebViewFilesSelected}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#2e7af5',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f7ff',
  },
  uploadButtonText: {
    color: '#2e7af5',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  brochureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  brochureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brochureDetails: {
    marginLeft: 12,
    flex: 1,
  },
  brochureName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  brochureSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
});

export default BrochureUploader;
