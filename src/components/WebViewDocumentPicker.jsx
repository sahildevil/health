import React, {useState, useRef} from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const WebViewDocumentPicker = ({visible, onClose, onFilesSelected}) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);

  // This is the HTML content with a file input that will run in the WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-color: #f7f9fc;
          color: #333;
        }
        .title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 30px;
          text-align: center;
        }
        .upload-btn-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          margin-bottom: 20px;
        }
        .btn {
          border: 2px dashed #2e7af5;
          color: #2e7af5;
          background-color: #e3f2fd;
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 240px;
          text-align: center;
        }
        .upload-btn-wrapper input[type=file] {
          font-size: 100px;
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        .files-list {
          width: 100%;
          max-width: 300px;
        }
        .file-item {
          display: flex;
          align-items: center;
          padding: 10px;
          background: white;
          border-radius: 8px;
          margin-bottom: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .file-icon {
          margin-right: 10px;
          color: #2e7af5;
        }
        .file-details {
          flex: 1;
        }
        .file-name {
          font-size: 14px;
          margin-bottom: 4px;
          word-break: break-all;
        }
        .file-size {
          font-size: 12px;
          color: #666;
        }
        .submit-btn {
          margin-top: 20px;
          background-color: #2e7af5;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
        }
        .submit-btn:disabled {
          background-color: #cccccc;
        }
      </style>
    </head>
    <body>
      <div class="title">Select Documents</div>
      
      <div class="upload-btn-wrapper">
        <div class="btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#2e7af5"/>
          </svg>
          <span style="margin-top: 8px;">Choose Files</span>
        </div>
        <input type="file" id="fileInput" multiple onchange="handleFiles(this.files)" accept=".pdf,image/*" />
      </div>
      
      <div id="filesList" class="files-list"></div>
      
      <button id="submitButton" class="submit-btn" disabled onclick="submitFiles()">Upload Files</button>

      <script>
        const selectedFiles = [];
        
        function handleFiles(files) {
          // Clear previous files
          if (files.length === 0) return;
          
          // Process each file
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Add to selected files array
            selectedFiles.push(file);
            
            // Create file item element
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // Choose icon based on file type
            const isImage = file.type.startsWith('image/');
            const iconSvg = isImage 
              ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#2e7af5"/></svg>'
              : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.27 3L3 8.27V15.73L8.27 21H15.73L21 15.73V8.27L15.73 3H8.27ZM8.6 6H15.4L18 8.6V15.4L15.4 18H8.6L6 15.4V8.6L8.6 6ZM14 9.5H10V11H14V9.5ZM14 12.5H10V14H14V12.5Z" fill="#2e7af5"/></svg>';
            
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-icon';
            fileIcon.innerHTML = iconSvg;
            
            // File details container
            const fileDetails = document.createElement('div');
            fileDetails.className = 'file-details';
            
            // File name
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            // File size
            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(file.size);
            
            // Append elements
            fileDetails.appendChild(fileName);
            fileDetails.appendChild(fileSize);
            
            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileDetails);
            
            document.getElementById('filesList').appendChild(fileItem);
          }
          
          // Enable submit button if files selected
          document.getElementById('submitButton').disabled = selectedFiles.length === 0;
        }
        
        function formatFileSize(bytes) {
          if (bytes < 1024) return bytes + ' B';
          else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
          else return (bytes / 1048576).toFixed(1) + ' MB';
        }
        
        function submitFiles() {
          if (selectedFiles.length === 0) return;
          
          const processedFiles = [];
          let processed = 0;
          
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const reader = new FileReader();
            
            reader.onload = function(e) {
              processedFiles.push({
                name: file.name,
                type: file.type,
                size: file.size,
                uri: e.target.result
              });
              
              processed++;
              if (processed === selectedFiles.length) {
                // All files processed, send to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'files',
                  data: processedFiles
                }));
              }
            };
            
            reader.readAsDataURL(file);
          }
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = event => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'files') {
        const files = message.data.map(file => {
          // Extract base64 part from data URL
          const uri = file.uri;
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            uri: uri,
          };
        });
        onFilesSelected(files);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Picker</Text>
          <View style={{width: 24}} />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2e7af5" />
            <Text style={styles.loadingText}>Loading document picker...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{html: htmlContent}}
          onMessage={handleMessage}
          onLoadEnd={() => setLoading(false)}
          style={loading ? styles.hidden : styles.webview}
        />
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  webview: {
    flex: 1,
  },
  hidden: {
    display: 'none',
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
});

export default WebViewDocumentPicker;
