import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { getAuth, updateEmail } from "firebase/auth";
import { db } from "../config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const ProfileScreen = () => {
  const auth = getAuth();
  const [name, setName] = useState("");  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [role, setRole] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
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
            const studentDocRef = doc(db, "studentinfo", auth.currentUser.uid);
            const studentDocSnap = await getDoc(studentDocRef);
            if (studentDocSnap.exists()) {
              const studentData = studentDocSnap.data();
              setAdditionalInfo({
                course: studentData.course || "",
                year: studentData.year || "",
              });
            }
          } else if (data.role === "teacher") {
            const teacherDocRef = doc(db, "teachersinfo", auth.currentUser.uid);
            const teacherDocSnap = await getDoc(teacherDocRef);
            if (teacherDocSnap.exists()) {
              const teacherData = teacherDocSnap.data();
              setAdditionalInfo({
                department: teacherData.department || "",
                // subjects: Array.isArray(teacherData.subjects)
                //   ? teacherData.subjects
                  // : [],
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
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    if (!name || !phoneNumber || !newEmail) {
      Alert.alert("Error", "Please fill in all required fields!");
      return;
    }
    setLoading(true);
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
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Error updating profile:", error);
    }
    setLoading(false);
  };

  const getInitials = (name) => {
    if (!name) return "";
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("");
    return initials.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{getInitials(name)}</Text>
          </View>
        </View>

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
          {role === "student" && (
            <>
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
            </>
          )}
          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>
              {loading ? "Updating..." : "Update Profile"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3b4cca",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ProfileScreen;