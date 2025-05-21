import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
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

  useEffect(() => {
    fetchDiscussions();
  }, [courseId]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourseDiscussions(courseId);
      setDiscussions(data || []);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const renderDiscussionItem = ({item}) => {
    const formattedDate = item.created_at
      ? format(new Date(item.created_at), 'MMM d, yyyy h:mm a')
      : 'Just now';

    const isOwnComment = user && item.user_id === user.id;

    return (
      <View style={styles.commentContainer}>
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

          {isOwnComment && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteComment(item.id)}>
              <Icon name="delete-outline" size={18} color="#ff6b6b" />
            </TouchableOpacity>
          )}
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
      </View>
    );
  };

  const handleDeleteComment = async commentId => {
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

  const getRoleColor = role => {
    switch (role.toLowerCase()) {
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

      {discussions.length > 0 ? (
        <FlatList
          data={discussions}
          renderItem={renderDiscussionItem}
          keyExtractor={item => item.id}
          style={styles.discussionList}
          contentContainerStyle={styles.discussionListContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="chat-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>
            Be the first to start the discussion!
          </Text>
        </View>
      )}
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
  discussionList: {
    flex: 1,
  },
  discussionListContent: {
    paddingBottom: 16,
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
