import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const MeetingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Meetings Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MeetingsScreen;
