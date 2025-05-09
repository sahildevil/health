import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { WebView } from 'react-native-webview';
import Pdf from 'react-native-pdf'; // For better PDF viewing experience

const DocumentViewerModal = ({ route, navigation }) => {
  const { uri, title, fileType } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const renderHeader = () => (
    <SafeAreaView style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.headerRight} />
    </SafeAreaView>
  );

  const renderContent = () => {
    // Use specialized PDF component for PDF files
    if (fileType === 'pdf') {
      return (
        <Pdf
          source={{ uri }}
          onLoadComplete={() => setIsLoading(false)}
          onError={(error) => {
            console.error('PDF loading error:', error);
            setError('Failed to load PDF');
            setIsLoading(false);
          }}
          onPressLink={(link) => console.log('PDF link pressed:', link)}
          style={styles.pdf}
          enablePaging={true}
          enableAnnotationRendering={true}
        />
      );
    }

    // For other document types, use WebView with appropriate content-type
    return (
      <WebView
        source={{ uri }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoad={() => setIsLoading(false)}
        onError={(error) => {
          console.error('WebView error:', error);
          setError('Failed to load document');
          setIsLoading(false);
        }}
        renderLoading={() => <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {isLoading && <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 60, // Balance the header visually
  },
  webview: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    margin: 20,
  },
});

export default DocumentViewerModal;