import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
