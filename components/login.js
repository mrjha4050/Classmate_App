import React, { useState , useEffect  } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import * as Haptics from "expo-haptics";
import {db} from '../config'; 
import {auth} from '../config';
import {registerForPushNotifications} from '../controllers/registerForPushNotifications';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        throw new Error('User data not found.');
      } 

      const userData = userDocSnap.data();
      console.log("User data:", userData);  
      Alert.alert('Success', 'Login Successful!');

      if (userData.role === 'student') {
        navigation.navigate('Home', { email: user.email, ...userData });
      } else if (userData.role === 'teacher') {
        const teacherDocRef = doc(db, 'teachersinfo', user.uid);
        const teacherDocSnap = await getDoc(teacherDocRef);
        if (!teacherDocSnap.exists()) {
          throw new Error('Teacher details not found.');
        }

        const teacherData = teacherDocSnap.data();
        console.log("Teacher details found:", teacherData);  
        navigation.navigate('TeacherHomeScreen', { email: user.email, ...teacherData });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error', error.message || 'Failed to login. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return; 
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    }
  };
  
  useEffect(() => {
    console.log("Registering for push notifications...");
    registerForPushNotifications()
      .then(() => console.log("Push notification registration completed"))
      .catch((error) => console.error("Error during push notification registration:", error));
  }, []);

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

export default LoginScreen;