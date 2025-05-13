import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';

const MessageAttachment = ({ message, navigation, onPress }) => {
  // Extract file information from the message
  const getFileInfo = () => {
    return {
      url: message.file_url,
      name: message.file_name || 'Unknown file',
      type: message.file_type || 'unknown',
      size: message.file_size || 0,
      attachmentType: message.attachment_type || 'file',
    };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) {
      return '🖼️';
    } else if (type === 'pdf') {
      return '📄';
    } else if (['doc', 'docx'].includes(type)) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(type)) {
      return '📊';
    } else if (['ppt', 'pptx'].includes(type)) {
      return '📑';
    } else if (['zip', 'rar', '7z'].includes(type)) {
      return '📦';
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(type)) {
      return '🎥';
    } else if (['mp3', 'wav', 'aac', 'm4a'].includes(type)) {
      return '🎵';
    }
    return '📎';
  };

  const handleAttachmentPress = () => {
    const fileInfo = getFileInfo();
    
    if (!fileInfo.url) {
      Alert.alert('Error', 'File URL is missing');
      return;
    }

    // Create document object compatible with your existing handleViewDocument function
    const document = {
      documentUrl: fileInfo.url,
      documentName: fileInfo.name,
      documentType: fileInfo.type,
    };

    // If onPress is provided (callback from parent), use it
    // Otherwise, use the navigation prop to call handleViewDocument
    if (onPress && typeof onPress === 'function') {
      onPress(document);
    } else {
      // You'll need to pass the handleViewDocument function from ChatScreen
      console.log('Navigation or handleViewDocument not provided');
    }
  };

  const renderPreview = () => {
    const fileInfo = getFileInfo();
    const fileType = fileInfo.type.toLowerCase();

    // For images, show a small thumbnail
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <View style={styles.imagePreview}>
          <Image
            source={{ uri: fileInfo.url }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        </View>
      );
    }

    return null;
  };

  if (!message.is_attachment || !message.file_url) {
    return null;
  }

  const fileInfo = getFileInfo();

  return (
    <TouchableOpacity
      style={styles.attachmentContainer}
      onPress={handleAttachmentPress}
      activeOpacity={0.7}
    >
      {renderPreview()}
      <View style={styles.attachmentInfo}>
        <View style={styles.fileHeader}>
          <Text style={styles.fileIcon}>{getFileIcon(fileInfo.type)}</Text>
          <Text style={styles.fileName} numberOfLines={2}>
            {fileInfo.name}
          </Text>
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileSize}>{formatFileSize(fileInfo.size)}</Text>
          <Text style={styles.fileType}>{fileInfo.type.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.downloadBadge}>
        <Text style={styles.downloadText}>TAP TO VIEW</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  attachmentContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    maxWidth: 280,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePreview: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    lineHeight: 18,
  },
  fileDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  fileType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  downloadBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  downloadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default MessageAttachment;