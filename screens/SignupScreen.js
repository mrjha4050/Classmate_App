// src/screens/SignupScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../config';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [additionalInfo, setAdditionalInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleSignup = async () => {
    if (email && password && name) {
      setIsLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          email: user.email,
          role: role,
          name: name,
        });

        if (role === 'student') {
          const studentDocRef = doc(db, 'students', user.uid);
          await setDoc(studentDocRef, {
            userId: user.uid,
            course: additionalInfo.course,
            year: additionalInfo.year,
          });
        } else if (role === 'teacher') {
          const teacherDocRef = doc(db, 'teachers', user.uid);
          await setDoc(teacherDocRef, {
            userId: user.uid,
            department: additionalInfo.department,
            subjects: additionalInfo.subjects,
          });
        }

        Alert.alert('Success', 'Signup Successful!');
        setIsLoading(false);
        navigation.navigate('Login1');
      } catch (error) {
        console.error('Error signing up:', error);
        Alert.alert('Error', 'Failed to sign up. Please try again.');
        setIsLoading(false);
      }
    } else {
      Alert.alert('Error', 'Please enter name, email, and password');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Signup</Text>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
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
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'student' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('student')}
            >
              <Text style={styles.roleButtonText}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'teacher' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('teacher')}
            >
              <Text style={styles.roleButtonText}>Teacher</Text>
            </TouchableOpacity>
          </View>
          {role === 'student' ? (
            <View>
              <Text style={styles.label}>Course</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your course"
                value={additionalInfo.course || ''}
                onChangeText={(text) => setAdditionalInfo({ ...additionalInfo, course: text })}
              />
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your year"
                value={additionalInfo.year || ''}
                onChangeText={(text) => setAdditionalInfo({ ...additionalInfo, year: text })}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your department"
                value={additionalInfo.department || ''}
                onChangeText={(text) => setAdditionalInfo({ ...additionalInfo, department: text })}
              />
              <Text style={styles.label}>Subjects</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your subjects (comma separated)"
                value={additionalInfo.subjects || ''}
                onChangeText={(text) => setAdditionalInfo({ ...additionalInfo, subjects: text.split(',').map(subject => subject.trim()) })}
              />
            </View>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Signup</Text>
          </TouchableOpacity>
          {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login1')}
          style={styles.loginRedirect}
        >
          <Text style={styles.loginRedirectText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
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
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#ccc',
  },
  roleButtonActive: {
    backgroundColor: '#007BFF',
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  loginRedirect: {
    marginTop: 10,
  },
  loginRedirectText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
