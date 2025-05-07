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
} from 'react-native';
import io from 'socket.io-client';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';

// Update these URLs to match your server configuration
const SOCKET_URL = 'http://192.168.1.11:5000';
const API_URL = 'http://192.168.1.11:5000';
//const API_URL = 'https://health-server-fawn.vercel.app';
//const SOCKET_URL = 'https://health-server-fawn.vercel.app';
const ChatScreen = () => {
  const {user} = useAuth();
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState({}); // Store messages by roomId
  const [newMessage, setNewMessage] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const currentRoomIdRef = useRef(null); // Track the current room ID

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

      // Update the receive_message event handler

      socketRef.current.on('receive_message', message => {
        console.log('Received message:', message);

        // Handle received message
        const newMessage = {
          id: message.id,
          text: message.text || message.content, // Handle different field names
          senderId: message.senderId || message.sender_id,
          senderName: message.senderName || message.sender_name,
          receiverId: message.receiverId || message.receiver_id,
          timestamp: message.timestamp || message.created_at,
          roomId: message.roomId || message.room_id,
        };

        // Immediately update messages without checking for duplicates
        // This ensures all incoming messages appear right away
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

  // Update the sendMessage function

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

  const renderDoctor = ({item}) => (
    <TouchableOpacity
      style={[
        styles.doctorItem,
        selectedDoctor?.id === item.id && styles.selectedDoctor,
      ]}
      onPress={() => setSelectedDoctor(item)}>
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
    </TouchableOpacity>
  );

  const renderMessage = ({item}) => (
    <View
      style={[
        styles.messageContainer,
        item.senderId === user?.id ? styles.ownMessage : styles.otherMessage,
        item.pending && styles.pendingMessage,
      ]}>
      <Text style={styles.senderName}>
        {item.senderId === user?.id ? 'You' : item.senderName || 'User'}
      </Text>
      <Text style={styles.messageText}>{item.text}</Text>
      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
        {item.pending && <Text style={styles.pendingText}>sending...</Text>}
      </View>
    </View>
  );

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
        <ActivityIndicator size="large" color="#2e7af5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Available Doctors</Text>
      <FlatList
        horizontal
        data={doctors}
        renderItem={renderDoctor}
        keyExtractor={item => item.id?.toString()}
        style={styles.doctorsList}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No doctors available</Text>
        }
      />

      {selectedDoctor ? (
        <>
          <View style={styles.chatHeader}>
            <Text style={styles.chatHeaderText}>
              Chat with Dr. {selectedDoctor.name || 'Unknown'}
            </Text>
            <View style={styles.connectionStatusContainer}>
              <Text
                style={[
                  styles.connectionStatus,
                  socketConnected
                    ? styles.connectedText
                    : styles.disconnectedText,
                ]}>
                {socketConnected ? '• Connected' : '• Disconnected'}
              </Text>
              {!socketConnected && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={retryConnection}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) =>
              item.id?.toString() || `${item.timestamp}-${index}`
            }
            inverted
            style={styles.messagesList}
            ListEmptyComponent={
              <Text style={styles.emptyMessagesText}>No messages yet</Text>
            }
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </>
      ) : (
        <View style={styles.selectDoctorContainer}>
          <Text style={styles.selectDoctorText}>
            Select a doctor to start chatting
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    color: '#333',
  },
  doctorsList: {
    maxHeight: 100,
  },
  doctorItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 120,
    alignItems: 'center',
  },
  selectedDoctor: {
    backgroundColor: '#2e7af5',
    borderColor: '#2e7af5',
  },
  doctorName: {
    fontWeight: 'bold',
    color: '#333',
  },
  doctorSpecialization: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedDoctorText: {
    color: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#eee',
  },
  chatHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    fontSize: 12,
    marginRight: 8,
  },
  connectedText: {
    color: 'green',
  },
  disconnectedText: {
    color: 'red',
  },
  retryButton: {
    backgroundColor: '#2e7af5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
    padding: 8,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  pendingMessage: {
    opacity: 0.7,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  pendingText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2e7af5',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#a0c0f0',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectDoctorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  selectDoctorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyListText: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
  emptyMessagesText: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default ChatScreen;
