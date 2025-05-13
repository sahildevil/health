import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import {courseService} from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const CoursesScreen = ({navigation}) => {
  const {user} = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  useEffect(() => {
    fetchCourses();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchCourses();
    });

    return unsubscribe;
  }, [navigation]);

  const renderCourseItem = ({item}) => {
    return (
      <TouchableOpacity
        style={styles.courseCard}
        onPress={() =>
          navigation.navigate('CourseDetails', {courseId: item.id})
        }>
        <Image
          source={{
            uri:
              item.thumbnail_url ||
              'https://via.placeholder.com/150x100?text=Course',
          }}
          style={styles.courseThumbnail}
        />
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{item.title}</Text>
          <Text style={styles.courseDescription} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
          <View style={styles.courseFooter}>
            <Text style={styles.courseCreator}>By {item.creator_name}</Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Educational Courses</Text>
        {(user?.role === 'admin' || user?.role === 'doctor') && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateCourse')}>
            <Icon name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7af5" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : courses.length > 0 ? (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.coursesList}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="school-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>No courses available</Text>
          {(user?.role === 'admin' || user?.role === 'doctor') && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateCourse')}>
              <Text style={styles.createButtonText}>Create A Course</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2e7af5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  coursesList: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  courseThumbnail: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  courseInfo: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCreator: {
    fontSize: 13,
    color: '#999',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e6f0ff',
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#2e7af5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#2e7af5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CoursesScreen;
