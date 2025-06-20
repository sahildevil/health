import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {courseService} from '../services/api';
import {formatDistanceToNow} from 'date-fns';

const CourseDiscussion = ({
  courseId,
  videoId,
  user,
  discussionType = 'course', // 'course' or 'video'
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const flatListRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  // Fetch comments initially and set up polling
  useEffect(() => {
    // Initial fetch
    fetchComments(true);
    
    // Set up polling every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (isPolling) {
        fetchComments(false); // false means don't show loading indicator
      }
    }, 3000);
    
    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [courseId, videoId, isPolling]);
  
  const fetchComments = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }
      
      console.log(`Fetching discussions for course ${courseId}${videoId ? ` video ${videoId}` : ''}`);
      
      // Use the discussions endpoint (not comments)
      const data = await courseService.getCourseDiscussions(courseId, videoId);
      
      // Sort comments by created_at (newest first)
      const sortedComments = data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      
      setComments(sortedComments);
      setLastUpdate(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error.message || 'Failed to load comments');
      
      // Only show alert on initial load
      if (showLoading) {
        Alert.alert('Error', 'Failed to load comments. Please try again later.');
      }
      
      // Don't clear existing comments on polling errors
      if (showLoading) {
        setComments([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSendComment = async () => {
    if (!message.trim()) return;
    if (!user) {
      Alert.alert('Login Required', 'Please login to post a comment');
      return;
    }

    try {
      setSending(true);
      
      // Store current message and clear input for better UX
      const commentContent = message.trim();
      setMessage('');
      
      // Temporarily stop polling to avoid conflicts
      setIsPolling(false);
      
      // Add discussion to the course
      const discussionData = {
        content: commentContent,
        video_id: videoId || null,
        parent_id: null
      };
      
      await courseService.addCourseDiscussion(courseId, discussionData);
      
      // Fetch updated comments immediately
      await fetchComments(false);
      
      // Resume polling after a short delay
      setTimeout(() => {
        setIsPolling(true);
      }, 2000);
      
      // Scroll to the top of the list to show the new comment
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to post comment');
      // Restore the message if sending failed
      setMessage(commentContent);
      // Resume polling even if sending failed
      setIsPolling(true);
    } finally {
      setSending(false);
    }
  };

  const renderCommentItem = ({item}) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentAvatar}>
        {item.user_avatar ? (
          <Image 
            source={{uri: item.user_avatar}} 
            style={styles.avatarImage}
            onError={() => console.log(`Failed to load avatar for ${item.user_name}`)}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>
              {item.user_name ? item.user_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.userName}>{item.user_name || "Unknown User"}</Text>
          <Text style={styles.commentTime}>
            {formatDistanceToNow(new Date(item.created_at), {addSuffix: true})}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  // Manual refresh function
  const handleRefresh = () => {
    fetchComments(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
      style={styles.container}>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color="#e74c3c" />
          <Text style={styles.errorText}>Failed to load comments</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.commentsContainer}
          refreshing={loading}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="chat-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to start the discussion</Text>
            </View>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || sending) && styles.disabledButton,
          ]}
          onPress={handleSendComment}
          disabled={!message.trim() || sending}>
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  refreshInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#2e7af5',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  lastUpdateTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 8,
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '500',
  },
  errorSubtext: {
    marginTop: 4,
    color: '#999',
    fontSize: 14,
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
  commentsContainer: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#2e7af5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#2e7af5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default CourseDiscussion;