// src/screens/SignUpScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { firebaseConfig } from "../config"; // Ensure the correct path to your config file

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const handleSignUp = async () => {
    if (email && password) {
      setIsLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Sign Up Successful!");
        setIsLoading(false);
        navigation.navigate('Login');
      } catch (error) {
        console.error("Error signing up:", error);
        Alert.alert("Error", "Failed to create user. Please try again.");
        setIsLoading(false);
      }
    } else {
      Alert.alert("Error", "Please enter both email and password");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.loginRedirect}
      >
        <Text style={styles.loginRedirectText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  formContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 20,
  },
  loginRedirect: {
    marginTop: 10,
  },
  loginRedirectText: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SignUpScreen;
