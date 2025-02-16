// screens/SignInScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignInScreen = ({ navigation }) => {
  const handleStudentLogin = () => {
    navigation.navigate('LoginScreen');
    console.log('Navigate to login 1');
  };

  const handleTeacherLogin = () => {
    navigation.navigate('LoginScreen');
    console.log('Navigate to login 1');

  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentContainer}>
        <Text style={styles.selectText}>Who are you?</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleStudentLogin}>
            <Image
              source={require('../assets/student.png')}  
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleTeacherLogin}>
            <Image
              source={require('../assets/Teacher.png')}  
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>Teacher</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#0B353B',  
    height: 60,  
    elevation: 4, 
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
