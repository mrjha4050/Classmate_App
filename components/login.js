// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as Haptics from "expo-haptics";
import { firebaseConfig } from '../config'; // Ensure the correct path to your config file

const LoginScreen2 = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleLogin = async () => {
    if (email && password) {
      setIsLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user role from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;

          Alert.alert('Success', 'Login Successful!');
          setIsLoading(false);

          // Navigate based on role
          if (role === 'student') {
            // Fetch additional student info if needed
            const studentDocRef = doc(db, 'students', user.uid);
            const studentDoc = await getDoc(studentDocRef);
            const studentData = studentDoc.exists() ? studentDoc.data() : {};

            navigation.navigate('Home', { email: user.email, ...studentData });
          } else if (role === 'teacher') {
            // Fetch additional teacher info if needed
            const teacherDocRef = doc(db, 'teachers', user.uid);
            const teacherDoc = await getDoc(teacherDocRef);
            const teacherData = teacherDoc.exists() ? teacherDoc.data() : {};

            navigation.navigate('TeacherHomeScreen', { email: user.email, ...teacherData });
          }
        } else {
          Alert.alert('Error', 'User data not found.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error logging in:', error);
        Alert.alert('Error', 'Failed to login. Please try again.');
        setIsLoading(false);
      }
    } else {
      Alert.alert('Error', 'Please enter both email and password');
    }
  };

  const handleForgotPassword = async () => {
    if (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        Alert.alert('Success', 'Password reset email sent!');
      } catch (error) {
        console.error('Error sending password reset email:', error);
        Alert.alert('Error', 'Failed to send password reset email. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter your email');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleLogin();
          }}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
      </View>
      <TouchableOpacity
        onPress={handleForgotPassword}
        style={styles.signupRedirect}
      >
        <Text style={styles.signupRedirectText}>Forgot Password? Don't worry</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Signupscreen')}
        style={styles.signupRedirect}
      >
        <Text style={styles.signupRedirectText}>New User ?</Text>
      </TouchableOpacity>
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
  formContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 20,
  },
  signupRedirect: {
    marginTop: 10,
  },
  signupRedirectText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen2;
