import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {courseService} from '../services/api';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CourseDiscussion from '../components/CourseDiscussion';
import {format} from 'date-fns';

const {width} = Dimensions.get('window');

const CourseDetailsScreen = ({route, navigation}) => {
  const {courseId} = route.params;
  const {user} = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourseById(courseId);
      setCourse(data);

      // Select the first video by default if available
      if (data.videos && data.videos.length > 0) {
        setSelectedVideo(data.videos[0]);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const refreshCourse = async () => {
    try {
      await fetchCourseDetails();
    } catch (error) {
      console.error('Error refreshing course:', error);
    }
  };

  const handleDeleteCourse = async () => {
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await courseService.deleteCourse(courseId);
              Alert.alert('Success', 'Course deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const handleSelectVideo = video => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const renderVideoItem = ({item}) => {
    const isActive = selectedVideo && selectedVideo.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.videoItem, isActive && styles.activeVideoItem]}
        onPress={() => handleSelectVideo(item)}>
        <View style={styles.videoItemContent}>
          <Icon
            name={isActive ? 'play-circle' : 'play-circle-outline'}
            size={24}
            color={isActive ? '#2e7af5' : '#888'}
          />
          <View style={styles.videoTextContainer}>
            <Text
              style={[styles.videoTitle, isActive && styles.activeVideoTitle]}
              numberOfLines={2}>
              {item.title}
            </Text>
            {item.duration && (
              <Text style={styles.videoDuration}>
                {Math.floor(item.duration / 60)}:
                {(item.duration % 60).toString().padStart(2, '0')}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7af5" />
        <Text style={styles.loadingText}>Loading course...</Text>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#ff6b6b" />
        <Text style={styles.errorText}>Course not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const canManageCourse =
    user &&
    (user.role === 'admin' ||
      (user.role === 'doctor' && user.id === course.creator_id));

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.title}
        </Text>

        {canManageCourse && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('AddCourseVideo', {courseId})}>
              <Icon name="plus-circle" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDeleteCourse}>
              <Icon name="delete" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {selectedVideo ? (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{uri: selectedVideo.video_url}}
              style={styles.videoPlayer}
              controls={true}
              paused={!isPlaying}
              resizeMode="contain"
              onError={error => console.error('Video error:', error)}
            />
            <Text style={styles.videoTitle}>{selectedVideo.title}</Text>
            {selectedVideo.description && (
              <Text style={styles.videoDescription}>
                {selectedVideo.description}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.noVideoContainer}>
            <Image
              source={{
                uri:
                  course.thumbnail_url ||
                  'https://via.placeholder.com/400x225?text=Course+Thumbnail',
              }}
              style={styles.courseThumbnail}
            />
          </View>
        )}

        <View style={styles.courseInfoSection}>
          <Text style={styles.sectionTitle}>About This Course</Text>
          <Text style={styles.courseDescription}>
            {course.description || 'No description available'}
          </Text>

          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Icon name="account" size={16} color="#666" />
              <Text style={styles.metadataText}>{course.creator_name}</Text>
            </View>

            {course.category && (
              <View style={styles.metadataItem}>
                <Icon name="tag" size={16} color="#666" />
                <Text style={styles.metadataText}>{course.category}</Text>
              </View>
            )}

            <View style={styles.metadataItem}>
              <Icon name="video" size={16} color="#666" />
              <Text style={styles.metadataText}>
                {course.videos?.length || 0} videos
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.courseContentSection}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          {course.videos && course.videos.length > 0 ? (
            <FlatList
              data={course.videos}
              renderItem={renderVideoItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noVideosContainer}>
              <Icon name="video-off" size={40} color="#ccc" />
              <Text style={styles.noVideosText}>No videos available</Text>
              {canManageCourse && (
                <TouchableOpacity
                  style={styles.addVideoButton}
                  onPress={() =>
                    navigation.navigate('AddCourseVideo', {courseId})
                  }>
                  <Text style={styles.addVideoButtonText}>Add a Video</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Add Discussion Section */}
        <View style={styles.discussionSection}>
          <Text style={styles.sectionTitle}>Discussion</Text>
          <CourseDiscussion
            courseId={courseId}
            user={user}
            refreshDiscussions={refreshCourse}
          />
        </View>
      </ScrollView>
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
    backgroundColor: '#2e7af5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    backgroundColor: '#000',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  noVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  courseInfoSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metadataText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  courseContentSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  videoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activeVideoItem: {
    backgroundColor: '#f0f7ff',
  },
  videoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  videoTitle: {
    fontSize: 14,
    color: '#333',
  },
  activeVideoTitle: {
    fontWeight: 'bold',
    color: '#2e7af5',
  },
  videoDuration: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2e7af5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  noVideosContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideosText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
    marginBottom: 16,
  },
  addVideoButton: {
    backgroundColor: '#2e7af5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addVideoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  discussionSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
});

export default CourseDetailsScreen;
