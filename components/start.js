// screens/SignInScreen.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar } from 'react-native-paper';

const SignInScreen = ({ navigation }) => {
  const handleStudentLogin = () => {
    navigation.navigate('Login1');
  };

  const handleParentLogin = () => {
    navigation.navigate('Login1');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Sign In" style={styles.signin1} />
      </Appbar.Header>
      <View style={styles.contentContainer}>
        <Text style={styles.selectText}>Who are you?</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleStudentLogin}>
            <Image
              source={require('../assets/student.png')} // Ensure this path is correct
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleParentLogin}>
            <Image
              source={require('../assets/Teacher.png')} // Ensure this path is correct
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>Teacher</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
        onPress={() => navigation.navigate('Signupscreen')}
        style={styles.signupRedirect}
      >
        <Text style={styles.signupRedirectText}>New User</Text>
      </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  appbar: {
    backgroundColor: '#3498DB', // Replace with desired color
    height: 60, // Adjust height as needed
    elevation: 4, // Add elevation for shadow
  },
  signin1: {
    flex: 1,
    fontSize: 30,
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  buttonImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    color: '#808080',
  },
  signupRedirect: {
    marginTop: 30,
  },
  signupRedirectText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignInScreen;
