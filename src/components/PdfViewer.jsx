import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import PagerView from 'react-native-pager-view';
import RNFetchBlob from 'react-native-blob-util';

const { width, height } = Dimensions.get('window');

const PdfViewer = ({ pdfUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPath, setPdfPath] = useState(null);

  // Download the PDF if it's a remote URL
  useEffect(() => {
    const downloadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If it's already a file path or data URL, use it directly
        if (pdfUrl.startsWith('file://') || pdfUrl.startsWith('data:')) {
          setPdfPath(pdfUrl);
          return;
        }
        
        // Otherwise download it
        const res = await RNFetchBlob.config({
          fileCache: true,
          appendExt: 'pdf',
        }).fetch('GET', pdfUrl);
        
        const filePath = `file://${res.path()}`;
        setPdfPath(filePath);
      } catch (err) {
        console.error('PDF download error:', err);
        setError('Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    if (pdfUrl) {
      downloadPdf();
    }
  }, [pdfUrl]);

  const onLoadComplete = (numberOfPages, filePath) => {
    setPageCount(numberOfPages);
    setLoading(false);
  };

  const onError = (error) => {
    console.error('PDF error:', error);
    setError('Failed to load PDF');
    setLoading(false);
  };

  const onPageChanged = (page) => {
    setCurrentPage(page + 1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7af5" />
        <Text style={styles.loadingText}>Loading brochure...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* PDF Viewer */}
      <PagerView 
        style={styles.pagerView} 
        initialPage={0}
        onPageSelected={(e) => onPageChanged(e.nativeEvent.position)}
      >
        {[...Array(pageCount)].map((_, index) => (
          <View key={index} style={styles.pageContainer}>
            <Pdf
              source={{ uri: pdfPath, page: index + 1 }}
              onLoadComplete={onLoadComplete}
              onError={onError}
              style={styles.pdf}
              enablePaging={false}
              singlePage={true}
            />
          </View>
        ))}
      </PagerView>
      
      {/* Page counter */}
      <View style={styles.pageCounter}>
        <Text style={styles.pageCounterText}>{currentPage} / {pageCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    backgroundColor: '#f7f9fc',
    position: 'relative',
  },
  loadingContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  errorText: {
    color: '#d32f2f',
  },
  pagerView: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  pageContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  pageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pageCounterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PdfViewer;