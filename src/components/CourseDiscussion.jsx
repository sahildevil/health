import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {courseService} from '../services/api';
import {formatDistanceToNow} from 'date-fns';

const CourseDiscussion = ({
  courseId,
  videoId,
  user,
  discussionType = 'course',
  focusComment = null,
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const scrollViewRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // New state for reply functionality
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Add new state for highlighting
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const [highlightedParentId, setHighlightedParentId] = useState(null);

  // Fetch comments initially and set up polling
  useEffect(() => {
    fetchComments(true);
    
    pollingIntervalRef.current = setInterval(() => {
      if (isPolling) {
        fetchComments(false);
      }
    }, 3000);
    
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
      
      const data = await courseService.getCourseDiscussions(courseId, videoId);
      
      // Organize comments with replies
      const organizedComments = organizeCommentsWithReplies(data);
      
      setComments(organizedComments);
      setLastUpdate(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error.message || 'Failed to load comments');
      
      if (showLoading) {
        Alert.alert('Error', 'Failed to load comments. Please try again later.');
      }
      
      if (showLoading) {
        setComments([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Organize comments into parent-child structure
  const organizeCommentsWithReplies = (allComments) => {
    if (!Array.isArray(allComments)) {
      console.warn('organizeCommentsWithReplies: expected array, got:', typeof allComments);
      return [];
    }

    const sortedComments = allComments.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );
    
    const parentComments = [];
    const repliesMap = {};
    
    // First pass: separate parent comments and replies
    sortedComments.forEach(comment => {
      if (comment.parent_id) {
        // This is a reply
        if (!repliesMap[comment.parent_id]) {
          repliesMap[comment.parent_id] = [];
        }
        repliesMap[comment.parent_id].push(comment);
      } else {
        // This is a parent comment
        parentComments.push({
          ...comment,
          replies: []
        });
      }
    });
    
    // Second pass: attach replies to their parent comments
    parentComments.forEach(parent => {
      if (repliesMap[parent.id]) {
        parent.replies = repliesMap[parent.id];
      }
    });
    
    // Sort parent comments by newest first
    return parentComments.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  };

  const handleSendComment = async () => {
    const messageContent = message.trim();
    if (!messageContent) return;
    if (!user) {
      Alert.alert('Login Required', 'Please login to post a comment');
      return;
    }

    try {
      setSending(true);
      setMessage('');
      setIsPolling(false);
      
      const discussionData = {
        content: messageContent,
        video_id: videoId || null,
        parent_id: null
      };
      
      await courseService.addCourseDiscussion(courseId, discussionData);
      await fetchComments(false);
      
      setTimeout(() => {
        setIsPolling(true);
      }, 2000);
      
      // Scroll to top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to post comment');
      setMessage(messageContent);
      setIsPolling(true);
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async () => {
    const replyContent = replyMessage.trim();
    if (!replyContent || !replyingTo) return;
    if (!user) {
      Alert.alert('Login Required', 'Please login to post a reply');
      return;
    }

    try {
      setSending(true);
      setReplyMessage('');
      const currentReplyingTo = replyingTo;
      setReplyingTo(null);
      setIsPolling(false);
      
      const replyData = {
        content: replyContent,
        video_id: videoId || null,
        parent_id: currentReplyingTo.id
      };
      
      await courseService.addCourseDiscussion(courseId, replyData);
      await fetchComments(false);
      
      setTimeout(() => {
        setIsPolling(true);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Failed to post reply');
      setReplyMessage(replyContent);
      setReplyingTo(currentReplyingTo);
      setIsPolling(true);
    } finally {
      setSending(false);
    }
  };

  const handleReply = (comment) => {
    console.log('Reply to comment:', comment);
    if (!comment || !comment.id) {
      console.error('Invalid comment for reply:', comment);
      return;
    }
    
    setReplyingTo(comment);
    setReplyMessage('');
    
    // Scroll to bottom where the reply input will be
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyMessage('');
  };

  const renderReplyItem = (reply) => {
    if (!reply || !reply.id) {
      console.warn('Invalid reply item:', reply);
      return null;
    }
    
    const isHighlighted = reply.id === highlightedCommentId;

    return (
      <View 
        key={reply.id} 
        style={[
          styles.replyContainer, 
          isHighlighted && styles.highlightedReply
        ]}
      >
        <View style={styles.replyLine} />
        <View style={styles.replyContent}>
          <View style={styles.commentAvatar}>
            {reply.user_avatar ? (
              <Image 
                source={{uri: reply.user_avatar}} 
                style={styles.avatarImage}
                onError={() => console.log(`Failed to load avatar for ${reply.user_name}`)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {reply.user_name ? reply.user_name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.replyTextContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.userName}>{reply.user_name || "Unknown User"}</Text>
              <Text style={styles.commentTime}>
                {formatDistanceToNow(new Date(reply.created_at), {addSuffix: true})}
              </Text>
            </View>
            <Text style={styles.commentText}>{reply.content}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCommentItem = (item) => {
    if (!item || !item.id) {
      console.warn('Invalid comment item:', item);
      return null;
    }
    
    const isHighlighted = item.id === highlightedCommentId || item.id === highlightedParentId;

    return (
      <View 
        key={item.id} 
        style={[
          styles.commentContainer, 
          isHighlighted && styles.highlightedComment
        ]}
      >
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
          
          {/* Reply button */}
          <TouchableOpacity 
            style={styles.replyButton}
            onPress={() => handleReply(item)}
            disabled={false}
          >
            <Icon name="reply" size={14} color="#666" />
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
          
          {/* Render replies */}
          {item.replies && Array.isArray(item.replies) && item.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {item.replies.map(reply => renderReplyItem(reply))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComments(false);
    setRefreshing(false);
  };

  // Calculate if send button should be disabled
  const isSendDisabled = () => {
    if (sending) return true;
    if (replyingTo) {
      return !replyMessage.trim();
    }
    return !message.trim();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="chat-outline" size={40} color="#ccc" />
      <Text style={styles.emptyText}>No comments yet</Text>
      <Text style={styles.emptySubtext}>Be the first to start the discussion</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle-outline" size={32} color="#e74c3c" />
      <Text style={styles.errorText}>Failed to load comments</Text>
      <Text style={styles.errorSubtext}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={handleRefresh}
        disabled={false}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#2e7af5" />
      <Text style={styles.loadingText}>Loading comments...</Text>
    </View>
  );

  // Add focusComment to props
  useEffect(() => {
    if (focusComment && !loading && comments.length > 0) {
      // Find the comment to focus on (could be a parent or a reply)
      let foundComment = false;
      
      // First check parent comments
      for (const comment of comments) {
        if (comment.id.toString() === focusComment) {
          // Highlight this comment
          setHighlightedCommentId(comment.id);
          foundComment = true;
          break;
        }
        
        // Check replies
        if (comment.replies && comment.replies.length > 0) {
          for (const reply of comment.replies) {
            if (reply.id.toString() === focusComment) {
              // Highlight this reply and its parent
              setHighlightedCommentId(reply.id);
              setHighlightedParentId(comment.id);
              foundComment = true;
              break;
            }
          }
          if (foundComment) break;
        }
      }
      
      // Scroll to the highlighted comment after a short delay to ensure rendering
      if (foundComment) {
        setTimeout(() => {
          if (scrollViewRef.current) {
            // The scrolling logic would depend on your implementation
            // For a ScrollView, you might use scrollTo with a measured position
            // This is a placeholder for the actual implementation
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 500);
      }
    }
  }, [focusComment, loading, comments]);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
      style={styles.container}>
      
      {loading ? renderLoadingState() : error ? renderErrorState() : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2e7af5']}
              tintColor="#2e7af5"
            />
          }
          showsVerticalScrollIndicator={true}
        >
          {comments.length === 0 ? renderEmptyState() : (
            <View style={styles.commentsContainer}>
              {comments.map(comment => renderCommentItem(comment))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <View style={styles.replyIndicator}>
          <View style={styles.replyIndicatorContent}>
            <Icon name="reply" size={16} color="#2e7af5" />
            <Text style={styles.replyIndicatorText}>
              Replying to {replyingTo.user_name || 'User'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={cancelReply} 
            style={styles.cancelReplyButton}
            disabled={false}
          >
            <Icon name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input container */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={replyingTo ? `Reply to ${replyingTo.user_name || 'User'}...` : "Add a comment..."}
          value={replyingTo ? replyMessage : message}
          onChangeText={replyingTo ? setReplyMessage : setMessage}
          multiline={true}
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            isSendDisabled() && styles.disabledButton,
          ]}
          onPress={replyingTo ? handleSendReply : handleSendComment}
          disabled={isSendDisabled()}>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
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
    marginBottom: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  replyLine: {
    width: 2,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
    marginLeft: 20,
  },
  replyContent: {
    flex: 1,
    flexDirection: 'row',
  },
  replyTextContent: {
    flex: 1,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f0f7ff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyIndicatorText: {
    fontSize: 14,
    color: '#2e7af5',
    marginLeft: 8,
    fontWeight: '500',
  },
  cancelReplyButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
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
  // Add to styles:
  highlightedComment: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 3,
    borderLeftColor: '#2e7af5',
  },
  highlightedReply: {
    backgroundColor: '#f0f7ff',
  },
});

export default CourseDiscussion;