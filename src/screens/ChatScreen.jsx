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
  Image,
  StatusBar,
  SafeAreaView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
import WebViewDocumentPicker from '../components/WebViewDocumentPicker';
import io from 'socket.io-client';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Linking} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import RNFS from 'react-native-fs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
const SOCKET_URL = 'http://192.168.1.9:5000';
const API_URL = 'http://192.168.1.9:5000';
const ChatScreen = () => {
  const {user, getToken} = useAuth();
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
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [webViewPickerVisible, setWebViewPickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cachedImages, setCachedImages] = useState({});
  // Add these new state variables near your other state variables
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const insets = useSafeAreaInsets();
  // Debug output for current user
  useEffect(() => {
    console.log('Current user:', user);
  }, [user]);

  // Move downloadAndCacheImage function inside component
  const downloadAndCacheImage = async imageUrl => {
    try {
      if (!imageUrl) return null;

      // Check if we already have this URL cached
      if (cachedImages[imageUrl]) {
        return cachedImages[imageUrl];
      }

      // Generate a unique filename based on the URL
      const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
      const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;

      // Check if file exists locally
      const exists = await RNFS.exists(localPath);
      if (exists) {
        console.log('Image already cached:', localPath);
        setCachedImages(prev => ({
          ...prev,
          [imageUrl]: `file://${localPath}`,
        }));
        return `file://${localPath}`;
      }

      // Download the file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: localPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        console.log('Image cached successfully:', localPath);
        setCachedImages(prev => ({
          ...prev,
          [imageUrl]: `file://${localPath}`,
        }));
        return `file://${localPath}`;
      }
      return null;
    } catch (error) {
      console.error('Error caching image:', error);
      return null;
    }
  };

  const openPreview = item => {
    // Unify field names
    const fileData = {
      ...item,
      fileUrl: item.fileUrl || item.file_url,
      fileName: item.fileName || item.file_name,
      fileType: item.fileType || item.file_type,
      fileSize: item.fileSize || item.file_size,
    };

    setPreviewItem(fileData);
    setPreviewVisible(true);
  };

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

  useEffect(() => {
    const loadImages = async () => {
      const imagesToLoad = messages.filter(
        msg =>
          (msg.isAttachment === true && msg.attachmentType === 'image') ||
          (msg.fileType && msg.fileType.includes('image')) ||
          (msg.fileUrl && msg.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i)),
      );

      for (const msg of imagesToLoad) {
        if (msg.fileUrl && !cachedImages[msg.fileUrl]) {
          console.log('Caching image:', msg.fileUrl);
          try {
            // Create a unique key based on the URL
            const cacheKey = msg.fileUrl.split('/').pop();
            const localUri = await downloadAndCacheImage(msg.fileUrl, cacheKey);

            if (localUri) {
              setCachedImages(prev => ({
                ...prev,
                [msg.fileUrl]: localUri,
              }));
            }
          } catch (error) {
            console.error('Error caching image:', error);
          }
        }
      }
    };

    loadImages();
  }, [messages]);
  // Add this function to handle document picking
  const pickDocument = () => {
    setShowAttachmentOptions(false);
    setWebViewPickerVisible(true);
  };

  // Add this function to handle files selected from WebView
  const handleWebViewFilesSelected = async files => {
    setWebViewPickerVisible(false);

    if (files && files.length > 0) {
      const file = files[0]; // Just use the first file for simplicity
      await sendFileMessage(file);
    }
  };

  // Add this function to handle camera photos
  const takePhoto = () => {
    setShowAttachmentOptions(false);

    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    ImagePicker.launchCamera(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Camera Error: ' + response.errorMessage);
      } else {
        const asset = response.assets[0];
        const file = {
          name: `Photo_${new Date().toISOString()}.jpg`,
          type: asset.type,
          uri: asset.uri,
          size: asset.fileSize,
        };
        await sendFileMessage(file);
      }
    });
  };

  // Add this function to handle gallery photos
  const pickFromGallery = () => {
    setShowAttachmentOptions(false);

    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'ImagePicker Error: ' + response.errorMessage);
      } else {
        const asset = response.assets[0];
        const file = {
          name: asset.fileName || `Image_${new Date().toISOString()}.jpg`,
          type: asset.type,
          uri: asset.uri,
          size: asset.fileSize,
        };
        await sendFileMessage(file);
      }
    });
  };

  // Get auth token for file uploads
  const getAuthToken = async () => {
    try {
      // Try to get from AsyncStorage first
      const token = await AsyncStorage.getItem('@token');
      if (token) {
        return token;
      }

      // If not in AsyncStorage, try to get from context
      if (user && user.token) {
        console.log('Using token from user context');
        return user.token;
      }

      // Try to get via the auth service
      const {authService} = require('../services/api');
      if (authService && authService.getAuthToken) {
        const serviceToken = authService.getAuthToken();
        if (serviceToken) {
          return serviceToken;
        }
      }
      console.log('Token available?', !!token);
      console.log('User object available?', !!user);
      console.log('User has token?', !!(user && user.token));
      console.error('No valid auth token found');
      return null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  };

  const sendFileMessage = async file => {
    if (!selectedDoctor || !user) return;

    try {
      setUploading(true);

      // Upload the file first
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const formData = new FormData();
      formData.append('document', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name || `file-${Date.now()}.${file.uri.split('.').pop()}`,
      });

      // Upload to server
      const response = await fetch(`${API_URL}/api/uploads/document`, {
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
      console.log('File upload result:', result);

      // Now send a message with the file info
      const roomId = [user.id, selectedDoctor.id].sort().join('-');
      const tempId = `temp-${Date.now()}`;

      const isImage = file.type && file.type.includes('image');
      console.log('File type check:', {
        fileName: file.name,
        fileType: file.type,
        isImage: isImage,
      });

      const messageData = {
        text: isImage ? '📷 Image' : '📎 Document: ' + file.name,
        content: isImage ? '📷 Image' : '📎 Document: ' + file.name,
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
        // Add file metadata
        fileType: file.type,
        fileName: file.name,
        fileUrl: result.url,
        fileSize: file.size,
        isAttachment: true,
        attachmentType: isImage ? 'image' : 'document',
      };
      console.log(
        'Created message data:',
        JSON.stringify(
          {
            isImage,
            attachmentType: messageData.attachmentType,
            fileType: messageData.fileType,
            fileUrl: messageData.fileUrl,
          },
          null,
          2,
        ),
      );
      // Create temporary message
      const tempMessage = {
        ...messageData,
        id: tempId,
        pending: true,
      };

      // Update UI immediately
      setMessages(prevMessages => [tempMessage, ...prevMessages]);

      // Update chat history
      setChatHistory(prev => {
        const currentMessages = prev[roomId] || [];
        return {
          ...prev,
          [roomId]: [tempMessage, ...currentMessages],
        };
      });

      // Send via socket or HTTP
      if (socketConnected) {
        try {
          socketRef.current.emit('send_message', {...messageData, tempId});
        } catch (socketError) {
          console.error('Error sending file message via socket:', socketError);
          sendMessageViaHttp(messageData, tempId);
        }
      } else {
        sendMessageViaHttp(messageData, tempId);
      }
    } catch (error) {
      console.error('Error sending file message:', error);
      Alert.alert('Error', 'Failed to send file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  const sendMessage = () => {
    if (newMessage.trim().length === 0 || !selectedDoctor || !user) {
      return;
    }

    const roomId = [user.id, selectedDoctor.id].sort().join('-');
    const tempId = `temp-${Date.now()}`;

    const messageData = {
      // Use both fields for compatibility
      text: newMessage.trim(),
      content: newMessage.trim(), // Add content for backend
      senderId: user.id,
      sender_id: user.id, // Add sender_id for backend
      senderName: user.name,
      sender_name: user.name, // Add sender_name for backend
      receiverId: selectedDoctor.id,
      receiver_id: selectedDoctor.id, // Add receiver_id for backend
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(), // Add created_at for backend
      roomId: roomId,
      room_id: roomId, // Add room_id for backend
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
      message.text.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <Text style={styles.avatarText}>
          {item.name ? item.name.charAt(0) : '?'}
        </Text>
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

  const renderMessage = ({item}) => {
    const isOwnMessage = item.senderId === user?.id;
    const messageTime = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Check if message is a file attachment
    const isAttachment =
      item.isAttachment === true || item.file_url || item.fileUrl;

    const isImageAttachment =
      (isAttachment && item.attachmentType === 'image') ||
      (isAttachment && item.fileType && item.fileType.includes('image')) ||
      (isAttachment &&
        (item.fileUrl || item.file_url) &&
        (item.fileUrl || item.file_url).match(/\.(jpeg|jpg|gif|png)$/i));

    const fileUrl = item.fileUrl || item.file_url;
    const fileName = item.fileName || item.file_name;
    const fileSize = item.fileSize || item.file_size;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          item.pending && styles.pendingMessage,
        ]}>
        {isImageAttachment ? (
          <TouchableOpacity
            onPress={() => openPreview(item)}
            style={styles.imageContainer}>
            {cachedImages[fileUrl] ? (
              <Image
                source={{uri: cachedImages[fileUrl]}}
                style={styles.attachedImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={{uri: fileUrl}}
                style={styles.attachedImage}
                resizeMode="cover"
                onLoadStart={() => console.log('Loading image:', fileUrl)}
                onLoad={() => downloadAndCacheImage(fileUrl)}
                onError={e =>
                  console.error('Error loading image:', e.nativeEvent.error)
                }
              />
            )}
          </TouchableOpacity>
        ) : isAttachment ? (
          <TouchableOpacity
            onPress={() => openPreview(item)}
            style={styles.documentContainer}>
            <View style={styles.documentIconContainer}>
              <Icon name="file-document-outline" size={24} color="#2e7af5" />
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName} numberOfLines={1}>
                {fileName || 'Document'}
              </Text>
              <Text style={styles.documentSize}>
                {fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.messageText}>{item.text || item.content}</Text>
        )}

        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>{messageTime}</Text>
          {isOwnMessage && (
            <Text
              style={[
                styles.statusIcon,
                item.pending ? styles.pendingIcon : styles.deliveredIcon,
              ]}>
              {item.pending ? '⌛' : '✓✓'}
            </Text>
          )}
        </View>
      </View>
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
          <Text style={styles.avatarText}>
            {selectedDoctor.name ? selectedDoctor.name.charAt(0) : '?'}
          </Text>
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
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
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
              <TouchableOpacity
                style={styles.searchCancelButton}
                onPress={toggleSearch}>
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
                {searchQuery
                  ? 'No messages match your search'
                  : 'No messages yet'}
              </Text>
            }
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {/* Add this attachment button */}
              <TouchableOpacity
                style={styles.attachButton}
                onPress={() => setShowAttachmentOptions(true)}>
                <Icon name="attachment" size={24} color="#757575" />
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
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonIcon}>
                    {newMessage.trim() ? '➤' : '➤'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          <Modal
            transparent={true}
            visible={showAttachmentOptions}
            animationType="slide"
            onRequestClose={() => setShowAttachmentOptions(false)}>
            <TouchableOpacity
              style={styles.attachmentModalOverlay}
              activeOpacity={1}
              onPress={() => setShowAttachmentOptions(false)}>
              <View style={styles.attachmentModalContainer}>
                <TouchableOpacity
                  style={styles.attachmentOption}
                  onPress={pickDocument}>
                  <Icon
                    name="file-document-outline"
                    size={28}
                    color="#2e7af5"
                  />
                  <Text style={styles.attachmentOptionText}>Document</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachmentOption}
                  onPress={takePhoto}>
                  <Icon name="camera" size={28} color="#2e7af5" />
                  <Text style={styles.attachmentOptionText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachmentOption}
                  onPress={pickFromGallery}>
                  <Icon name="image" size={28} color="#2e7af5" />
                  <Text style={styles.attachmentOptionText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* WebView Document Picker */}
          <WebViewDocumentPicker
            visible={webViewPickerVisible}
            onClose={() => setWebViewPickerVisible(false)}
            onFilesSelected={handleWebViewFilesSelected}
          />
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.whatsappHeader}>
            <Text style={styles.whatsappTitle}>Health Insights</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Text style={styles.headerIcon}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Text style={styles.headerIcon}>⋮</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={doctors}
            renderItem={renderDoctor}
            keyExtractor={item => item.id?.toString()}
            style={styles.doctorsList}
            contentContainerStyle={styles.doctorsListContent}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No doctors available</Text>
            }
          />
        </View>
      )}
      <Modal
        visible={previewVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}>
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={() => setPreviewVisible(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {previewItem?.fileName || 'Preview'}
            </Text>
            <TouchableOpacity
              style={styles.previewShareButton}
              onPress={() =>
                previewItem?.fileUrl && Linking.openURL(previewItem.fileUrl)
              }>
              <Icon name="open-in-new" size={24} color="#2e7af5" />
            </TouchableOpacity>
          </View>
          <View style={styles.previewContent}>
            {previewItem &&
              (previewItem.fileType &&
              previewItem.fileType.includes('image') ? (
                // Image preview
                <Image
                  source={{
                    uri:
                      cachedImages[previewItem.fileUrl] || previewItem.fileUrl,
                  }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : previewItem.fileType &&
                previewItem.fileType.includes('pdf') ? (
                // PDF preview using WebView
                <WebView
                  source={{uri: previewItem.fileUrl}}
                  style={styles.webView}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.webViewLoading}>
                      <ActivityIndicator size="large" color="#2e7af5" />
                      <Text style={styles.webViewLoadingText}>
                        Loading document...
                      </Text>
                    </View>
                  )}
                />
              ) : (
                // For other document types, show basic info with open option
                <View style={styles.documentPreview}>
                  <Icon
                    name="file-document-outline"
                    size={80}
                    color="#2e7af5"
                  />
                  <Text style={styles.documentPreviewName}>
                    {previewItem?.fileName || 'Document'}
                  </Text>
                  <Text style={styles.documentPreviewSize}>
                    {previewItem?.fileSize
                      ? `${(previewItem.fileSize / 1024).toFixed(1)} KB`
                      : ''}
                  </Text>
                  <TouchableOpacity
                    style={styles.openExternalButton}
                    onPress={() =>
                      previewItem?.fileUrl &&
                      Linking.openURL(previewItem.fileUrl)
                    }>
                    <Text style={styles.openExternalButtonText}>
                      Open in Browser
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
//2e7af5
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#075E54',
  },
  container: {
    flex: 1,
    backgroundColor: '#E5DDD5',
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
  previewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  previewCloseButton: {
    padding: 8,
  },
  previewShareButton: {
    padding: 8,
  },
  previewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f7f9fc',
  },
  documentPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  documentPreviewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  documentPreviewSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  openExternalButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2e7af5',
    borderRadius: 8,
  },
  openExternalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#d6e5fd', //'#DCF8C6',
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
  attachButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  attachmentModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachmentOption: {
    alignItems: 'center',
    padding: 16,
  },
  attachmentOptionText: {
    marginTop: 8,
    color: '#333',
    fontSize: 14,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  attachedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
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
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  imageLoadingContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  imageLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  // imageContainer: {
  //   width: '100%',
  //   borderRadius: 8,
  //   overflow: 'hidden',
  //   backgroundColor: '#f0f0f0',
  // },
  // attachedImage: {
  //   width: '100%',
  //   height: 200,
  //   borderRadius: 4,
  //   backgroundColor: '#f0f0f0',
  // },
});

export default ChatScreen;
