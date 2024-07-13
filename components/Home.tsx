// src/screens/LoginScreen.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

const LoginScreen1 = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Welcome to Home Screen!</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default LoginScreen1;
