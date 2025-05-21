import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {courseService} from '../services/api';
import {format} from 'date-fns';

const CourseDiscussion = ({courseId, user, refreshDiscussions}) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});

  useEffect(() => {
    fetchDiscussions();
  }, [courseId]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourseDiscussions(courseId);
      
      // Organize comments into a hierarchy (top-level and replies)
      const organizedData = organizeComments(data || []);
      setDiscussions(organizedData);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Organize comments into parent/child structure
  const organizeComments = (comments) => {
    // Separate top-level comments from replies
    const topLevel = comments.filter(comment => !comment.parent_id);
    const replies = comments.filter(comment => comment.parent_id);
    
    // Add replies array to each top-level comment
    return topLevel.map(comment => ({
      ...comment,
      replies: replies
        .filter(reply => reply.parent_id === comment.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDiscussions();
  };

  const handlePostComment = async () => {
    if (!message.trim()) return;

    try {
      setPosting(true);
      await courseService.addCourseDiscussion(courseId, {content: message});
      setMessage('');
      fetchDiscussions();
      if (refreshDiscussions) {
        refreshDiscussions();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyMessage.trim() || !replyingTo) return;

    try {
      setPosting(true);
      await courseService.addCourseDiscussion(courseId, {
        content: replyMessage,
        parent_id: replyingTo.id
      });
      
      setReplyMessage('');
      setReplyingTo(null);
      fetchDiscussions();
      
      if (refreshDiscussions) {
        refreshDiscussions();
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'Failed to post reply. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleReplyPress = (comment) => {
    setReplyingTo(comment);
    setReplyMessage('');
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleDeleteComment = async (commentId) => {
    try {
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            onPress: async () => {
              try {
                await courseService.deleteCourseDiscussion(courseId, commentId);
                fetchDiscussions();
              } catch (error) {
                console.error('Error deleting comment:', error);
                Alert.alert('Error', 'Failed to delete comment');
              }
            },
            style: 'destructive',
          },
        ],
      );
    } catch (error) {
      console.error('Error handling delete:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '#8e44ad'; // Purple
      case 'doctor':
        return '#2e86de'; // Blue
      case 'pharma':
        return '#10ac84'; // Green
      default:
        return '#7f8c8d'; // Gray
    }
  };

  const renderReply = (reply) => {
    const formattedDate = reply.created_at
      ? format(new Date(reply.created_at), 'MMM d, yyyy h:mm a')
      : 'Just now';

    const isOwnReply = user && reply.user_id === user.id;

    return (
      <View key={reply.id} style={styles.replyContainer}>
        <View style={styles.commentHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarContainer, styles.replyAvatarContainer]}>
              <Text style={styles.avatarText}>
                {reply.user_name ? reply.user_name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>
                {reply.user_name || 'Anonymous'}
              </Text>
              <Text style={styles.commentDate}>{formattedDate}</Text>
            </View>
          </View>

          {isOwnReply && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteComment(reply.id)}>
              <Icon name="delete-outline" size={16} color="#ff6b6b" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.commentContent}>{reply.content}</Text>

        {reply.role && (
          <View
            style={[
              styles.roleBadge,
              {backgroundColor: getRoleColor(reply.role)},
            ]}>
            <Text style={styles.roleText}>{reply.role}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderDiscussionItem = (item) => {
    const formattedDate = item.created_at
      ? format(new Date(item.created_at), 'MMM d, yyyy h:mm a')
      : 'Just now';

    const isOwnComment = user && item.user_id === user.id;
    const hasReplies = item.replies && item.replies.length > 0;
    const isExpanded = expandedReplies[item.id] !== false; // Default to expanded

    return (
      <View key={item.id} style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {item.user_name ? item.user_name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>
                {item.user_name || 'Anonymous'}
              </Text>
              <Text style={styles.commentDate}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.commentActions}>
            {isOwnComment && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteComment(item.id)}>
                <Icon name="delete-outline" size={18} color="#ff6b6b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.commentContent}>{item.content}</Text>

        {item.role && (
          <View
            style={[
              styles.roleBadge,
              {backgroundColor: getRoleColor(item.role)},
            ]}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        )}

        <View style={styles.commentFooter}>
          {user && (
            <TouchableOpacity 
              style={styles.replyButton}
              onPress={() => handleReplyPress(item)}>
              <Icon name="reply" size={14} color="#2e7af5" />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          )}
          
          {hasReplies && (
            <TouchableOpacity 
              style={styles.toggleRepliesButton}
              onPress={() => toggleReplies(item.id)}>
              <Icon 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={14} 
                color="#666" 
              />
              <Text style={styles.toggleRepliesText}>
                {isExpanded ? "Hide" : "Show"} {item.replies.length} {item.replies.length === 1 ? "reply" : "replies"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Reply input area */}
        {replyingTo?.id === item.id && (
          <View style={styles.replyInputContainer}>
            <View style={styles.replyInputHeader}>
              <Text style={styles.replyingToText}>
                Replying to {item.user_name || 'Anonymous'}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Icon name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.replyInputRow}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a reply..."
                value={replyMessage}
                onChangeText={setReplyMessage}
                multiline
                maxLength={500}
                autoFocus
              />
              <TouchableOpacity
                style={[
                  styles.replyPostButton,
                  !replyMessage.trim() && styles.disabledButton,
                ]}
                disabled={!replyMessage.trim() || posting}
                onPress={handlePostReply}>
                {posting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="send" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Replies section */}
        {hasReplies && isExpanded && (
          <View style={styles.repliesContainer}>
            {item.replies.map(reply => renderReply(reply))}
          </View>
        )}
      </View>
    );
  };

  const renderDiscussionList = () => {
    if (discussions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="chat-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>
            Be the first to start the discussion!
          </Text>
        </View>
      );
    }

    return discussions.map(item => renderDiscussionItem(item));
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2e7af5" />
        <Text style={styles.loadingText}>Loading discussions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.postButton,
              !message.trim() && styles.disabledButton,
            ]}
            onPress={handlePostComment}
            disabled={!message.trim() || posting}>
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>
            Please log in to join the discussion
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.discussionScrollView}
        contentContainerStyle={styles.discussionListContent}
        showsVerticalScrollIndicator={true}>
        {renderDiscussionList()}
        {refreshing && (
          <View style={styles.refreshingIndicator}>
            <ActivityIndicator size="small" color="#2e7af5" />
            <Text style={styles.refreshingText}>Refreshing...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 80,
    fontSize: 16,
  },
  postButton: {
    backgroundColor: '#2e7af5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0c0e8',
  },
  discussionScrollView: {
    maxHeight: 400, // Set a fixed height for the discussion area
  },
  discussionListContent: {
    paddingBottom: 16,
  },
  refreshingIndicator: {
    alignItems: 'center',
    padding: 10,
  },
  refreshingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  commentContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2e7af5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  replyAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  deleteButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  replyButtonText: {
    marginLeft: 4,
    color: '#2e7af5',
    fontSize: 13,
    fontWeight: '500',
  },
  toggleRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  toggleRepliesText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 12,
  },
  replyInputContainer: {
    marginTop: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#2e7af5',
  },
  replyInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 80,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  replyPostButton: {
    backgroundColor: '#2e7af5',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repliesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  replyContainer: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  loginPrompt: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666',
  },
});

export default CourseDiscussion;