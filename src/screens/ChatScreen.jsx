import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import io from 'socket.io-client';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import * as ImagePicker from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import the WebView document picker
import WebViewDocumentPicker from '../components/WebViewDocumentPicker';

// Update these URLs to match your server configuration
const SOCKET_URL = 'http://192.168.1.9:5000';
const API_URL = 'http://192.168.1.9:5000';

const ChatScreen = () => {
  const {user} = useAuth();
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const currentRoomIdRef = useRef(null);
  const flatListRef = useRef(null);

  // Document upload states
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [webViewPickerVisible, setWebViewPickerVisible] = useState(false);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);

  // Debug output for current user
  useEffect(() => {
    console.log('Current user:', user);
  }, [user]);

  // Fetch all doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        console.log('Fetching doctors from:', `${API_URL}/api/doctors`);
        const response = await axios.get(`${API_URL}/api/doctors`);
        console.log('Doctors response:', response.data);

        // Make sure to filter only if user exists and has an id
        const filteredDoctors =
          user && user.id
            ? response.data.filter(doc => doc.id !== user.id)
            : response.data;

        setDoctors(filteredDoctors);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        Alert.alert(
          'Error',
          'Failed to fetch doctors. Please check your connection.',
        );
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [user?.id]);

  // Update currentRoomIdRef when selectedDoctor changes
  useEffect(() => {
    if (selectedDoctor && user) {
      const roomId = [user.id, selectedDoctor.id].sort().join('-');
      currentRoomIdRef.current = roomId;
      console.log('Current room ID set to:', roomId);
    } else {
      currentRoomIdRef.current = null;
    }
  }, [selectedDoctor, user]);

  // Fetch message history when selecting a doctor
  useEffect(() => {
    if (selectedDoctor) {
      fetchMessageHistory();
    }
  }, [selectedDoctor]);

  const fetchMessageHistory = async () => {
    if (!selectedDoctor || !user) return;

    try {
      const roomId = [user.id, selectedDoctor.id].sort().join('-');
      console.log('Fetching messages for room:', roomId);

      // Check if we already have messages for this room in our chat history
      if (chatHistory[roomId] && chatHistory[roomId].length > 0) {
        console.log('Using cached messages for room:', roomId);
        setMessages(chatHistory[roomId]);
      }

      // Fetch messages from the server regardless (to ensure we have the latest)
      const response = await axios.get(`${API_URL}/api/messages/${roomId}`);
      console.log('Message history response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        // Transform data to match UI expectations
        const formattedMessages = response.data.map(msg => ({
          id: msg.id,
          text: msg.content || msg.text,
          senderId: msg.sender_id || msg.senderId,
          senderName: msg.sender_name || msg.senderName,
          receiverId: msg.receiver_id || msg.receiverId,
          timestamp: msg.created_at || msg.timestamp,
          roomId: msg.room_id || msg.roomId,
          documentUrl: msg.document_url || msg.documentUrl,
          documentName: msg.document_name || msg.documentName,
          documentType: msg.document_type || msg.documentType,
          messageType: msg.document_url ? 'document' : 'text',
        }));

        // Update both the current messages and the chat history
        setMessages(formattedMessages);
        setChatHistory(prev => ({
          ...prev,
          [roomId]: formattedMessages,
        }));
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
      Alert.alert(
        'Error',
        'Failed to load message history. Will try to continue with cached messages.',
      );

      // If we have cached messages, use those
      const roomId = [user.id, selectedDoctor.id].sort().join('-');
      if (chatHistory[roomId]) {
        setMessages(chatHistory[roomId]);
      }
    }
  };

  // Socket connection
  useEffect(() => {
    if (selectedDoctor && user) {
      // Clean up previous connection if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Clear any pending reconnect timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      console.log('Connecting to socket at:', SOCKET_URL);

      // Configure socket with proper options
      socketRef.current = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        forceNew: true,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        setSocketConnected(true);

        // Create a unique room for the chat
        const roomId = [user.id, selectedDoctor.id].sort().join('-');
        console.log('Joining room:', roomId);
        socketRef.current.emit('join_room', roomId);
      });

      socketRef.current.on('receive_message', message => {
        console.log('Received message:', message);

        // Handle received message
        const newMessage = {
          id: message.id,
          text: message.text || message.content,
          senderId: message.senderId || message.sender_id,
          senderName: message.senderName || message.sender_name,
          receiverId: message.receiverId || message.receiver_id,
          timestamp: message.timestamp || message.created_at,
          roomId: message.roomId || message.room_id,
          documentUrl: message.document_url || message.documentUrl,
          documentName: message.document_name || message.documentName,
          documentType: message.document_type || message.documentType,
          messageType: message.document_url ? 'document' : 'text',
        };

        // Immediately update messages without checking for duplicates
        setMessages(prevMessages => {
          // Only add if it's not already in the list (check by ID)
          if (!prevMessages.some(msg => msg.id === newMessage.id)) {
            const updatedMessages = [newMessage, ...prevMessages];

            // Also update chat history
            setChatHistory(prev => ({
              ...prev,
              [newMessage.roomId]: updatedMessages,
            }));

            return updatedMessages;
          }
          return prevMessages;
        });
      });

      // Listen for message confirmation
      socketRef.current.on('message_confirmed', confirmedMessage => {
        console.log('Message confirmed:', confirmedMessage);
        updateMessageStatus(confirmedMessage);
      });

      socketRef.current.on('connect_error', error => {
        console.error('Socket connection error:', error);
        setSocketConnected(false);

        // Implement retry logic with backoff
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            socketRef.current.connect();
            reconnectTimeoutRef.current = null;
          }, 3000); // Wait 3 seconds before trying to reconnect
        }
      });

      socketRef.current.on('disconnect', reason => {
        console.log('Socket disconnected:', reason);
        setSocketConnected(false);

        // If the server closed the connection, don't try to reconnect automatically
        if (reason === 'io server disconnect') {
          socketRef.current.connect();
        }
      });

      return () => {
        console.log('Disconnecting socket');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        socketRef.current.disconnect();
        setSocketConnected(false);
      };
    }
  }, [selectedDoctor, user]);

  // Document upload methods
  const pickDocument = () => {
    setAttachmentMenuVisible(false);
    setWebViewPickerVisible(true);
  };

  const takePhoto = () => {
    setAttachmentMenuVisible(false);
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
        handleSelectedDocument({
          name: `Photo_${new Date().toISOString()}.jpg`,
          type: asset.type,
          uri: asset.uri,
          size: asset.fileSize,
        });
      }
    });
  };

  const pickFromGallery = () => {
    setAttachmentMenuVisible(false);
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
        handleSelectedDocument({
          name: asset.fileName || `Image_${new Date().toISOString()}.jpg`,
          type: asset.type,
          uri: asset.uri,
          size: asset.fileSize,
        });
      }
    });
  };

  // Handle files selected from WebView
  const handleWebViewFilesSelected = files => {
    setWebViewPickerVisible(false);

    if (files && files.length > 0) {
      // For simplicity, just handle the first file in chat
      handleSelectedDocument(files[0]);
    }
  };

  const handleSelectedDocument = async (document) => {
    setUploading(true);
    
    try {
      const uploadedDoc = await uploadDocument(document);
      if (uploadedDoc) {
        await sendDocumentMessage(uploadedDoc);
      }
    } catch (error) {
      console.error('Error handling document:', error);
      Alert.alert('Error', 'Failed to process document: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const uploadDocument = async (document) => {
    console.log(`Uploading document: ${document.name}`);
    
    try {
      const token = await getAuthToken();
  
      // Create form data
      const formData = new FormData();
  
      // Add file to form data with the correct field name expected by the server
      formData.append('file', {
        uri: Platform.OS === 'ios' ? document.uri.replace('file://', '') : document.uri,
        type: document.type || 'application/octet-stream',
        name: document.name || `file-${Date.now()}.${document.uri.split('.').pop()}`,
      });
  
      // Upload to our server endpoint
      const response = await fetch(
        `${API_URL}/api/uploads/document`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for multipart/form-data
          },
          body: formData,
        },
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
  
      const result = await response.json();
      console.log('Upload result:', result);
  
      return {
        name: document.name,
        type: document.type,
        size: document.size,
        url: result.url,
        storage_path: result.storage_path,
      };
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  };

  // Helper function to get the auth token
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('@token');
      return token;
    } catch (error) {
      console.error('Failed to get auth token', error);
      return null;
    }
  };

  const sendDocumentMessage = async (document) => {
    if (!document || !selectedDoctor || !user) {
      return;
    }
  
    const roomId = [user.id, selectedDoctor.id].sort().join('-');
    const tempId = `temp-${Date.now()}`;
  
    // Enhanced message data with proper document fields
    const messageData = {
      text: `Shared a document: ${document.name}`,
      content: `Shared a document: ${document.name}`,
      senderId: user.id,
      sender_id: user.id,
      senderName: user.name,
      sender_name: user.name,
      receiverId: selectedDoctor.id,
      receiver_id: selectedDoctor.id,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      roomId: roomId,
      room_id: roomId,
      documentUrl: document.url,
      document_url: document.url,
      documentName: document.name,
      document_name: document.name,
      documentType: document.type,
      document_type: document.type,
      messageType: 'document',
      message_type: 'document',
      // Add the file path for reference if needed by server
      document_path: document.storage_path,
      // Add file size for display info
      document_size: document.size
    };
  
    console.log('Sending document message:', messageData);
  
    // Create temporary message with pending status to display immediately
    const tempMessage = {
      ...messageData,
      id: tempId,
      pending: true,
    };
  
    // Add message to UI immediately
    setMessages(prevMessages => [tempMessage, ...prevMessages]);
  
    // Also update chat history
    setChatHistory(prev => {
      const currentMessages = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: [tempMessage, ...currentMessages],
      };
    });
  
    // Try to send via socket first
    if (socketConnected) {
      try {
        socketRef.current.emit('send_message', {...messageData, tempId});
      } catch (socketError) {
        console.error('Error sending document message via socket:', socketError);
        sendMessageViaHttp(messageData, tempId);
      }
    } else {
      // Socket not connected, use HTTP
      sendMessageViaHttp(messageData, tempId);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim().length === 0 || !selectedDoctor || !user) {
      return;
    }

    const roomId = [user.id, selectedDoctor.id].sort().join('-');
    const tempId = `temp-${Date.now()}`;

    const messageData = {
      text: newMessage.trim(),
      content: newMessage.trim(),
      senderId: user.id,
      sender_id: user.id,
      senderName: user.name,
      sender_name: user.name,
      receiverId: selectedDoctor.id,
      receiver_id: selectedDoctor.id,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      roomId: roomId,
      room_id: roomId,
      messageType: 'text',
      message_type: 'text',
    };

    console.log('Sending message:', messageData);

    // Clear input field immediately
    setNewMessage('');

    // Create temporary message with pending status to display immediately
    const tempMessage = {
      ...messageData,
      id: tempId,
      pending: true,
    };

    // Add message to UI immediately - Force an update to the UI
    setMessages(prevMessages => [tempMessage, ...prevMessages]);

    // Also update chat history
    setChatHistory(prev => {
      const currentMessages = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: [tempMessage, ...currentMessages],
      };
    });

    // Try to send via socket first
    if (socketConnected) {
      try {
        // Add the temp ID to help with matching the response later
        socketRef.current.emit('send_message', {...messageData, tempId});
      } catch (socketError) {
        console.error('Error sending message via socket:', socketError);
        // Fall back to HTTP if socket fails
        sendMessageViaHttp(messageData, tempId);
      }
    } else {
      // Socket not connected, use HTTP
      sendMessageViaHttp(messageData, tempId);
    }
  };

  // Fallback HTTP method to send messages
  const sendMessageViaHttp = async (messageData, tempId) => {
    try {
      const response = await axios.post(`${API_URL}/api/messages`, messageData);
      console.log('Message sent via HTTP fallback:', response.data);

      if (response.data && response.data.success) {
        // Replace the pending message with the confirmed one
        const confirmedMessage = {
          ...messageData,
          id: response.data.id || messageData.id,
          tempId: tempId, // Include tempId to help with matching
          pending: false,
        };

        updateMessageStatus(confirmedMessage);
      }
    } catch (error) {
      console.error('Error sending message via HTTP:', error);
      Alert.alert(
        'Message Delivery Issue',
        'Your message may not have been saved. Please try again.',
      );
    }
  };

  // Improve the updateMessageStatus function
  const updateMessageStatus = confirmedMessage => {
    console.log('Updating message status:', confirmedMessage);
    const roomId = confirmedMessage.roomId || confirmedMessage.room_id;
    const tempId = confirmedMessage.tempId; // Look for tempId if available

    // Ensure we have a valid room ID
    if (!roomId) {
      console.error('No room ID in confirmed message:', confirmedMessage);
      return;
    }

    // Create the confirmed message object with consistent field names
    const updatedMessage = {
      id: confirmedMessage.id,
      text: confirmedMessage.text || confirmedMessage.content,
      senderId: confirmedMessage.senderId || confirmedMessage.sender_id,
      senderName: confirmedMessage.senderName || confirmedMessage.sender_name,
      receiverId: confirmedMessage.receiverId || confirmedMessage.receiver_id,
      timestamp: confirmedMessage.timestamp || confirmedMessage.created_at,
      roomId: confirmedMessage.roomId || confirmedMessage.room_id,
      documentUrl: confirmedMessage.documentUrl || confirmedMessage.document_url,
      documentName: confirmedMessage.documentName || confirmedMessage.document_name,
      documentType: confirmedMessage.documentType || confirmedMessage.document_type,
      messageType: confirmedMessage.messageType || confirmedMessage.message_type || 
                  (confirmedMessage.documentUrl || confirmedMessage.document_url ? 'document' : 'text'),
      pending: false,
    };

    // Update displayed messages if this is the current room
    if (currentRoomIdRef.current === roomId) {
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          // Match by tempId if available, otherwise by content and sender
          if (
            (tempId && msg.id === tempId) ||
            (msg.pending &&
              msg.text === updatedMessage.text &&
              msg.senderId === updatedMessage.senderId)
          ) {
            return updatedMessage;
          }
          return msg;
        });
      });
    }

    // Always update the chat history
    setChatHistory(prev => {
      const roomMessages = prev[roomId] || [];

      // Update pending messages in this room
      const updatedRoomMessages = roomMessages.map(msg => {
        // Match by tempId if available, otherwise by content and sender
        if (
          (tempId && msg.id === tempId) ||
          (msg.pending &&
            msg.text === updatedMessage.text &&
            msg.senderId === updatedMessage.senderId)
        ) {
          return updatedMessage;
        }
        return msg;
      });

      return {
        ...prev,
        [roomId]: updatedRoomMessages,
      };
    });
  };

  // Search functionality
  const getFilteredMessages = () => {
    if (!searchQuery.trim()) return messages;
    
    return messages.filter(message => 
      message.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
    }
  };

  const renderDoctor = ({item}) => (
    <TouchableOpacity
      style={[
        styles.doctorItem,
        selectedDoctor?.id === item.id && styles.selectedDoctor,
      ]}
      onPress={() => setSelectedDoctor(item)}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.name ? item.name.charAt(0) : '?'}</Text>
      </View>
      <View style={styles.doctorInfo}>
        <Text
          style={[
            styles.doctorName,
            selectedDoctor?.id === item.id && styles.selectedDoctorText,
          ]}>
          {item.name || 'Unknown'}
        </Text>
        <Text
          style={[
            styles.doctorSpecialization,
            selectedDoctor?.id === item.id && styles.selectedDoctorText,
          ]}>
          {item.degree || 'General'}
        </Text>
      </View>
    </TouchableOpacity>
  );

// Replace the renderMessage function with this improved version:

const renderMessage = ({item}) => {
  const isOwnMessage = item.senderId === user?.id;
  const messageTime = new Date(item.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
        item.pending && styles.pendingMessage,
      ]}>
      {item.messageType === 'document' ? (
        // Document message with improved visual display
        <View style={styles.documentMessageContent}>
          <View style={styles.documentIconContainer}>
            <Icon 
              name={getDocumentIcon(item.documentType)} 
              size={28} 
              color="#2e7af5" 
            />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName} numberOfLines={2}>
              {item.documentName || 'Document'}
            </Text>
            {item.documentType && (
              <Text style={styles.documentType}>
                {item.documentType.split('/').pop().toUpperCase()}
              </Text>
            )}
            <TouchableOpacity 
              style={styles.viewDocButton}
              onPress={() => handleViewDocument(item)}>
              <Text style={styles.viewDocText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Text message
        <Text style={styles.messageText}>{item.text}</Text>
      )}
      
      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>{messageTime}</Text>
        {isOwnMessage && (
          <Text style={[styles.statusIcon, item.pending ? styles.pendingIcon : styles.deliveredIcon]}>
            {item.pending ? '⌛' : '✓✓'}
          </Text>
        )}
      </View>
    </View>
  );
};

  const getDocumentIcon = (documentType) => {
    if (!documentType) return 'file-document-outline';
    
    if (documentType.includes('pdf')) return 'file-pdf-box';
    if (documentType.includes('image')) return 'image';
    if (documentType.includes('word') || documentType.includes('doc')) return 'file-word';
    if (documentType.includes('excel') || documentType.includes('sheet')) return 'file-excel';
    
    return 'file-document-outline';
  };

  const handleViewDocument = (document) => {
    if (!document || !document.documentUrl) {
      Alert.alert('Error', 'Document unavailable or URL missing.');
      return;
    }
    
    // Open document in browser or in-app webview
    const documentUrl = document.documentUrl;
    
    // You can use Linking from react-native to open in browser
    const openDocument = async () => {
      try {
        // Check if the URL can be opened
        const canOpen = await Linking.canOpenURL(documentUrl);
        
        if (canOpen) {
          await Linking.openURL(documentUrl);
        } else {
          // If can't open directly, you could navigate to an in-app WebView
          // navigation.navigate('DocumentViewer', { uri: documentUrl });
          Alert.alert(
            'Cannot Open Document',
            'Unable to open this document with available apps.'
          );
        }
      } catch (error) {
        console.error('Error opening document:', error);
        Alert.alert('Error', 'Failed to open document.');
      }
    };
    
    Alert.alert(
      'Document',
      `Open ${document.documentName}?`,
      [
        { text: 'Cancel' },
        { text: 'Open', onPress: openDocument }
      ]
    );
  };

  // Function to retry connecting to the server
  const retryConnection = () => {
    if (socketRef.current) {
      console.log('Manually retrying connection...');
      socketRef.current.connect();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#128C7E" />
      </View>
    );
  }

  // WhatsApp-style header with doctor name and actions
  const renderChatHeader = () => {
    if (!selectedDoctor) return null;
    
    return (
      <View style={styles.chatHeader}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => setSelectedDoctor(null)}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{selectedDoctor.name ? selectedDoctor.name.charAt(0) : '?'}</Text>
        </View>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{selectedDoctor.name}</Text>
          <Text style={styles.headerSubtitle}>
            {socketConnected ? 'online' : 'offline'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleSearch}>
            <Text style={styles.headerIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {selectedDoctor ? (
        <View style={styles.container}>
          {renderChatHeader()}
          
          {searchVisible && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search messages..."
                autoFocus
              />
              <TouchableOpacity style={styles.searchCancelButton} onPress={toggleSearch}>
                <Text style={styles.searchCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <FlatList
            ref={flatListRef}
            data={getFilteredMessages()}
            renderItem={renderMessage}
            keyExtractor={(item, index) =>
              item.id?.toString() || `${item.timestamp}-${index}`
            }
            inverted
            style={styles.messagesList}
            contentContainerStyle={styles.messagesListContent}
            ListEmptyComponent={
              <Text style={styles.emptyMessagesText}>
                {searchQuery ? 'No messages match your search' : 'No messages yet'}
              </Text>
            }
          />

          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#2e7af5" />
              <Text style={styles.uploadingText}>Uploading document...</Text>
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TouchableOpacity 
                style={styles.attachButton}
                onPress={() => setAttachmentMenuVisible(true)}>
                <Icon name="paperclip" size={24} color="#2e7af5" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Message"
                multiline
              />
              
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={!newMessage.trim() || uploading}>
                <Text style={styles.sendButtonIcon}>{newMessage.trim() ? '➤' : '➤'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {/* Attachment Menu Modal */}
          <Modal
            visible={attachmentMenuVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setAttachmentMenuVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setAttachmentMenuVisible(false)}>
              <View style={styles.attachmentModalContent}>
                <View style={styles.attachmentOptionsContainer}>
                  <TouchableOpacity style={styles.attachmentOption} onPress={takePhoto}>
                    <View style={[styles.attachmentIconCircle, {backgroundColor: '#4CAF50'}]}>
                      <Icon name="camera" size={28} color="#fff" />
                    </View>
                    <Text style={styles.attachmentOptionText}>Camera</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.attachmentOption} onPress={pickFromGallery}>
                    <View style={[styles.attachmentIconCircle, {backgroundColor: '#9C27B0'}]}>
                      <Icon name="image" size={28} color="#fff" />
                    </View>
                    <Text style={styles.attachmentOptionText}>Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.attachmentOption} onPress={pickDocument}>
                    <View style={[styles.attachmentIconCircle, {backgroundColor: '#2196F3'}]}>
                      <Icon name="file-document" size={28} color="#fff" />
                    </View>
                    <Text style={styles.attachmentOptionText}>Document</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.closeAttachmentButton}
                  onPress={() => setAttachmentMenuVisible(false)}>
                  <Text style={styles.closeAttachmentText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* WebView Document Picker Modal */}
          <WebViewDocumentPicker
            visible={webViewPickerVisible}
            onClose={() => setWebViewPickerVisible(false)}
            onFilesSelected={handleWebViewFilesSelected}
          />
          
          {/* Connection status indicator */}
          {!socketConnected && (
            <TouchableOpacity 
              style={styles.connectionAlert}
              onPress={retryConnection}>
              <Text style={styles.connectionAlertText}>
                Reconnecting... Tap to retry
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Doctor list view
        <View style={styles.container}>
          <View style={styles.whatsappHeader}>
            <Text style={styles.whatsappTitle}>Doctors</Text>
          </View>

          <FlatList
            data={doctors}
            renderItem={renderDoctor}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.doctorsList}
            ListEmptyComponent={
              <Text style={styles.emptyDoctorsText}>
                No doctors available at the moment
              </Text>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};


//2e7af5
// Add these improved styles for document messages
const documentStyles = {
  documentMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#d4e4fc',
  },
  documentIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#e3efff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  documentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  viewDocButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  viewDocText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#075E54',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5DDD5',
  },
  whatsappHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff', 
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  whatsappTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: 'black',
  },
  doctorsList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  doctorsListContent: {
    paddingVertical: 8,
  },
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  selectedDoctor: {
    backgroundColor: '#EBEBEB',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 20,
    backgroundColor: '#2e7af5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000000',
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  selectedDoctorText: {
    color: '#075E54',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerBackButton: {
    padding: 8,
  },
  headerBackIcon: {
    fontSize: 24,
    color: 'black',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'grey',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 5,
  },
  headerIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchCancelButton: {
    paddingHorizontal: 10,
  },
  searchCancelText: {
    color: '#075E54',
    fontSize: 16,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#edf6f9', // Add this line
  },
  messagesListContent: {
    padding: 10,
  },
  messageContainer: {
    borderRadius: 8,
    marginVertical: 2,
    maxWidth: '80%',
    padding: 8,
    paddingBottom: 4,
  },
  ownMessage: {
    backgroundColor: '#d6e5fd',//'#DCF8C6',
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginLeft: '15%',
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    marginRight: '15%',
  },
  pendingMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#7C7C7C',
    marginRight: 4,
  },
  statusIcon: {
    fontSize: 12,
    marginLeft: 2,
  },
  pendingIcon: {
    color: '#7C7C7C',
  },
  deliveredIcon: {
    color: '#53BDEB',
  },
  inputContainer: {
    backgroundColor: '#F0F0F0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2e7af5', //'#128C7E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  emptyListText: {
    padding: 20,
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
  emptyMessagesText: {
    padding: 20,
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
});

export default ChatScreen;