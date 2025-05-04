import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Pdf from 'react-native-pdf';
import RNFetchBlob from 'react-native-blob-util';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

const PdfViewer = ({pdfUrl}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPath, setPdfPath] = useState(null);

  useEffect(() => {
    const downloadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Attempting to load PDF from URL:', pdfUrl);

        // Try to load directly first
        setPdfPath(pdfUrl);
      } catch (err) {
        console.error('PDF setup error:', err);
        setError('Failed to setup PDF');
        setLoading(false);
      }
    };

    if (pdfUrl) {
      downloadPdf();
    }
  }, [pdfUrl]);

  const onLoadComplete = (numberOfPages, filePath) => {
    console.log(`PDF loaded successfully with ${numberOfPages} pages`);
    setPageCount(numberOfPages);
    setLoading(false);
  };

  const onError = error => {
    console.error('PDF error:', error);

    // Try to download if direct loading fails
    if (pdfPath === pdfUrl) {
      console.log('Direct loading failed, trying to download PDF first...');
      downloadAndLoad();
    } else {
      setError('Failed to load PDF: ' + error.message);
      setLoading(false);
    }
  };

  const downloadAndLoad = async () => {
    try {
      console.log('Downloading PDF from remote URL');
      const res = await RNFetchBlob.config({
        fileCache: true,
        appendExt: 'pdf',
      }).fetch('GET', pdfUrl);

      const filePath = `file://${res.path()}`;
      console.log('Downloaded to file path:', filePath);
      setPdfPath(filePath);
    } catch (err) {
      console.error('PDF download error:', err);
      setError('Failed to download PDF: ' + err.message);
      setLoading(false);
    }
  };

  const openExternalPdf = () => {
    Linking.canOpenURL(pdfUrl).then(supported => {
      if (supported) {
        Linking.openURL(pdfUrl);
      } else {
        console.log("Don't know how to open URI: " + pdfUrl);
        setError("Cannot open PDF externally");
      }
    });
  };

  if (loading && !pdfPath) {
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
        <TouchableOpacity 
          style={[styles.externalButton, {position: 'relative', marginTop: 16}]} 
          onPress={openExternalPdf}
        >
          <Icon name="open-in-new" size={18} color="#fff" />
          <Text style={styles.externalButtonText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* PDF Viewer */}
      <Pdf
        source={{uri: pdfPath}}
        onLoadComplete={onLoadComplete}
        onPageChanged={page => setCurrentPage(page)}
        onError={onError}
        style={styles.pdf}
        enablePaging={true}
      />

      {/* Show page counter if we have pages */}
      {pageCount > 0 && (
        <View style={styles.pageCounter}>
          <Text style={styles.pageCounterText}>
            {currentPage} / {pageCount}
          </Text>
        </View>
      )}
      
      {/* External button */}
      <TouchableOpacity 
        style={styles.externalButton} 
        onPress={openExternalPdf}
      >
        <Icon name="open-in-new" size={18} color="#fff" />
        <Text style={styles.externalButtonText}>Open in Browser</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 400, 
    backgroundColor: '#f7f9fc',
    position: 'relative',
  },
  loadingContainer: {
    width: '100%',
    height: 400,
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
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    padding: 16,
  },
  pdf: {
    flex: 1,
    width: '100%',
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
  externalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#2e7af5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 8,
    borderRadius: 8,
  },
  externalButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default PdfViewer;

// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   ActivityIndicator,
//   Dimensions,
// } from 'react-native';
// import Pdf from 'react-native-pdf';
// import PagerView from 'react-native-pager-view';
// import RNFetchBlob from 'react-native-blob-util';

// const {width} = Dimensions.get('window');

// const PdfViewer = ({pdfUrl}) => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [pageCount, setPageCount] = useState(0);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pdfPath, setPdfPath] = useState(null);

//   useEffect(() => {
//     const downloadPdf = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         console.log('Attempting to load PDF from URL:', pdfUrl);

//         // Try to load directly first
//         setPdfPath(pdfUrl);
//       } catch (err) {
//         console.error('PDF setup error:', err);
//         setError('Failed to setup PDF');
//         setLoading(false);
//       }
//     };

//     if (pdfUrl) {
//       downloadPdf();
//     }
//   }, [pdfUrl]);

//   const onLoadComplete = (numberOfPages, filePath) => {
//     console.log(
//       `PDF loaded successfully with ${numberOfPages} pages from ${filePath}`,
//     );
//     setPageCount(numberOfPages);
//     setLoading(false);
//   };

//   const onError = error => {
//     console.error('PDF error:', error);

//     // Try to download if direct loading fails
//     if (pdfPath === pdfUrl) {
//       console.log('Direct loading failed, trying to download PDF first...');
//       downloadAndLoad();
//     } else {
//       setError('Failed to load PDF: ' + error.message);
//       setLoading(false);
//     }
//   };

//   const downloadAndLoad = async () => {
//     try {
//       console.log('Downloading PDF from remote URL');
//       const res = await RNFetchBlob.config({
//         fileCache: true,
//         appendExt: 'pdf',
//       }).fetch('GET', pdfUrl);

//       const filePath = `file://${res.path()}`;
//       console.log('Downloaded to file path:', filePath);
//       setPdfPath(filePath);
//     } catch (err) {
//       console.error('PDF download error:', err);
//       setError('Failed to download PDF: ' + err.message);
//       setLoading(false);
//     }
//   };

//   const onPageChanged = page => {
//     setCurrentPage(page + 1);
//   };

//   if (loading && !pdfPath) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#2e7af5" />
//         <Text style={styles.loadingText}>Loading brochure...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {loading && (
//         <View style={styles.overlayLoading}>
//           <ActivityIndicator size="large" color="#2e7af5" />
//         </View>
//       )}

//       <Pdf
//         source={{uri: pdfPath}}
//         onLoadComplete={onLoadComplete}
//         onPageChanged={page => setCurrentPage(page)}
//         onError={onError}
//         style={styles.pdf}
//         enablePaging={true}
//       />

//       {pageCount > 0 && (
//         <View style={styles.pageCounter}>
//           <Text style={styles.pageCounterText}>
//             {currentPage} / {pageCount}
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     width: '100%',
//     height: 400, // Increased height for better visibility
//     backgroundColor: '#f7f9fc',
//     position: 'relative',
//   },
//   loadingContainer: {
//     width: '100%',
//     height: 400,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f7f9fc',
//   },
//   overlayLoading: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255,255,255,0.7)',
//     zIndex: 10,
//   },
//   loadingText: {
//     marginTop: 8,
//     color: '#666',
//   },
//   errorContainer: {
//     width: '100%',
//     height: 400,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f7f9fc',
//   },
//   errorText: {
//     color: '#d32f2f',
//     textAlign: 'center',
//     padding: 16,
//   },
//   pdf: {
//     flex: 1,
//     width: '100%',
//     backgroundColor: '#f7f9fc',
//   },
//   pageCounter: {
//     position: 'absolute',
//     bottom: 16,
//     right: 16,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   pageCounterText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
// });

// export default PdfViewer;
