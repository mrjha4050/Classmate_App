// src/screens/ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { getAuth, updateEmail, updatePassword } from "firebase/auth";
import { db } from "../config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const ProfileScreen = () => {
  const auth = getAuth();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setPhoneNumber(data.phoneNumber || "");
          setNewEmail(data.email || "");
          setRole(data.role);

          if (data.role === "student") {
            const studentDocRef = doc(db, "students", auth.currentUser.uid);
            const studentDocSnap = await getDoc(studentDocRef);
            if (studentDocSnap.exists()) {
              const studentData = studentDocSnap.data();
              setAdditionalInfo({
                course: studentData.course || "",
                year: studentData.year || "",
              });
            }
          } else if (data.role === "teacher") {
            const teacherDocRef = doc(db, "teachers", auth.currentUser.uid);
            const teacherDocSnap = await getDoc(teacherDocRef);
            if (teacherDocSnap.exists()) {
              const teacherData = teacherDocSnap.data();
              setAdditionalInfo({
                department: teacherData.department || "",
                // subjects: teacherData.subjects || '',array
                subjects: Array.isArray(teacherData.subjects)
                  ? teacherData.subjects
                  : [],
              });
            }
          }
        } else {
          Alert.alert("Error", "No such user!");
        }
      } catch (error) {
        Alert.alert("Error", "Error fetching user data");
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      const updateData = {};
      if (name) updateData.name = name;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (newEmail && newEmail !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, newEmail);
        updateData.email = newEmail;
      }

      await updateDoc(userDocRef, updateData);

      if (role === "student") {
        const studentDocRef = doc(db, "students", auth.currentUser.uid);
        await updateDoc(studentDocRef, {
          course: additionalInfo.course,
          year: additionalInfo.year,
        });
      } else if (role === "teacher") {
        const teacherDocRef = doc(db, "teachers", auth.currentUser.uid);
        await updateDoc(teacherDocRef, {
          department: additionalInfo.department,
          subjects: additionalInfo.subjects,
        });
      }

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Error updating profile:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <Text style={styles.title}>Edit Profile</Text> */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your new email"
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        {role === "student" ? (
          <View>
            <Text style={styles.label}>Course</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your course"
              value={additionalInfo.course || ""}
              onChangeText={(text) =>
                setAdditionalInfo({ ...additionalInfo, course: text })
              }
            />
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your year"
              value={additionalInfo.year || ""}
              onChangeText={(text) =>
                setAdditionalInfo({ ...additionalInfo, year: text })
              }
            />
          </View>
        ) : (
          <View>
            <Text style={styles.label}>Department</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your department"
              value={additionalInfo.department || ""}
              onChangeText={(text) =>
                setAdditionalInfo({ ...additionalInfo, department: text })
              }
            />
            <Text style={styles.label}>Subjects</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your subjects (comma separated)"
              value={
                additionalInfo.subjects
                  ? additionalInfo.subjects.join(", ")
                  : ""
              }
              onChangeText={(text) =>
                setAdditionalInfo({
                  ...additionalInfo,
                  subjects: text.split(",").map((subject) => subject.trim()),
                })
              }
            />
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>
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
});

export default ProfileScreen;