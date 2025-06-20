import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ProgressBar = ({ 
  progress, 
  height = 10, 
  backgroundColor = '#f0f0f0',
  fillColor = '#2e7af5',
  showPercentage = true,
  isProcessing = false,
  style = {}
}) => {
  // Ensure progress is between 0 and 100
  const percentage = Math.min(Math.max(progress, 0), 100);
  
  return (
    <View style={[styles.container, style]}>
      <View 
        style={[
          styles.progressBar,
          { height },
          { backgroundColor }
        ]}
      >
        <Animated.View 
          style={[
            styles.fill, 
            { 
              width: `${percentage}%`, 
              backgroundColor: isProcessing ? '#4CAF50' : fillColor 
            }
          ]} 
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentText}>
          {isProcessing ? 'Processing...' : `${percentage.toFixed(1)}%`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  progressBar: {
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  percentText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  }
});

export default ProgressBar;