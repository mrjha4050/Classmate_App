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
  Image,
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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
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
              setProfilePhotoUrl(studentData.profilePhotoUrl || null);
            }
          } else if (data.role === "teacher") {
            const teacherDocRef = doc(db, "teachersinfo", auth.currentUser.uid);
            const teacherDocSnap = await getDoc(teacherDocRef);
            if (teacherDocSnap.exists()) {
              const teacherData = teacherDocSnap.data();
              setAdditionalInfo({
                department: teacherData.department || "",
              });
              setProfilePhotoUrl(teacherData.profilePhotoUrl || null);
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
    if (!phoneNumber) {
      Alert.alert("Error", "Phone number is required!");
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const updateData = {};

      // For all roles, update phoneNumber
      updateData.phoneNumber = phoneNumber;

      // For non-student roles, allow updating name and email
      if (role !== "student") {
        if (!name || !newEmail) {
          Alert.alert("Error", "Name and email are required for non-students!");
          setLoading(false);
          return;
        }
        updateData.name = name;
        if (newEmail && newEmail !== auth.currentUser.email) {
          await updateEmail(auth.currentUser, newEmail);
          updateData.email = newEmail;
        }
      }

      // Update the users collection
      await updateDoc(userDocRef, updateData);

      // Update additional info based on role
      if (role === "student") {
        const studentDocRef = doc(db, "studentinfo", auth.currentUser.uid);
        await updateDoc(studentDocRef, {
          course: additionalInfo.course || "",
          year: additionalInfo.year || "",
        });
      } else if (role === "teacher") {
        const teacherDocRef = doc(db, "teachersinfo", auth.currentUser.uid);
        await updateDoc(teacherDocRef, {
          department: additionalInfo.department || "",
        });
      }

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
          {profilePhotoUrl ? (
            <Image
              source={{ uri: profilePhotoUrl }}
              style={styles.avatar}
              onError={() => {
                console.log("Failed to load profile image:", profilePhotoUrl);
                setProfilePhotoUrl(null);
              }}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.initials}>{getInitials(name)}</Text>
            </View>
          )}
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, role === "student" && styles.readOnlyInput]}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            editable={role !== "student"} // Read-only for students
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
            style={[styles.input, role === "student" && styles.readOnlyInput]}
            placeholder="Enter your new email"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={role !== "student"} // Read-only for students
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
          {role === "teacher" && (
            <>
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your department"
                value={additionalInfo.department || ""}
                onChangeText={(text) =>
                  setAdditionalInfo({ ...additionalInfo, department: text })
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
  readOnlyInput: {
    backgroundColor: "#f0f0f0",  
    color: "#666",  
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