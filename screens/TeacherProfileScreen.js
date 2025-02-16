import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  SafeAreaView, // Added SafeAreaView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { CheckBox } from "react-native-elements"; // For checkboxes
import { AuthContext } from "../AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // For custom safe area handling

const TeacherProfile = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [teacherName, setTeacherName] = useState("");
  const [teacherProfile, setTeacherProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
  const [newDepartment, setNewDepartment] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]); // Array of selected subjects

  const departments = ["Bsc.IT", "Bsc.CS", "BBA", "B.Com"];
  const subjects = ["ITSM", "SOA", "SIC", "GIS", "Python"];

  const fetchTeacherName = async (teacherId) => {
    try {
      const userDocRef = doc(db, "users", teacherId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setTeacherName(userDocSnap.data().name || "Unknown");
      } else {
        Alert.alert("Error", "No user found for the teacher!");
      }
    } catch (error) {
      console.error("Error fetching teacher name:", error);
      Alert.alert("Error", "Failed to fetch teacher name.");
    }
  };

  const fetchTeacherProfile = async () => {
    try {
      const teacherDocRef = doc(db, "teachersinfo", user.uid);
      const teacherDocSnap = await getDoc(teacherDocRef);
      if (teacherDocSnap.exists()) {
        const data = teacherDocSnap.data();
        setTeacherProfile(data);
        setNewDepartment(data.department || "");
        setNewPhone(data.phone || "");
        setSelectedSubjects(data.subjects || []); // Initialize selected subjects
      }
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      Alert.alert("Error", "Failed to fetch teacher profile.");
    }
  };

  const updateTeacherProfile = async () => {
    try {
      const teacherDocRef = doc(db, "teachersinfo", user.uid);
      await updateDoc(teacherDocRef, {
        department: newDepartment,
        phone: newPhone,
        subjects: selectedSubjects, // Save selected subjects
      });
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false); // Exit edit mode
      fetchTeacherProfile(); // Refresh profile data
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchTeacherName(user.uid);
      fetchTeacherProfile();
    }
  }, [user?.uid]);

  const getInitials = (name) => {
    if (!name) return "??";
    const nameParts = name.split(" ");
    const initials = nameParts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    return initials;
  };

  const toggleSubjectSelection = (subject) => {
    // Add or remove the subject from the selectedSubjects array
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((item) => item !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  // Get safe area insets
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>


<View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2E86C1" />
          </TouchableOpacity>
          <Text style={styles.header}>Profile</Text>
          <View style={styles.headerPlaceholder} /> Placeholder for alignment
        </View>
      <ScrollView style={styles.container}>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{getInitials(teacherName)}</Text>
          </View>
          <Text style={styles.profileName}>{teacherName || "Unknown"}</Text>

          {/* Department */}
          <View style={styles.detailRow}>
            <MaterialIcons name="school" size={20} color="#2E86C1" />
            <Text style={styles.detailText}>
              Department: {teacherProfile.department || "N/A"}
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={20} color="#2E86C1" />
            <Text style={styles.detailText}>
              Phone: {teacherProfile.phone || "N/A"}
            </Text>
          </View>

          {/* Subjects */}
          <View style={styles.detailRow}>
            <MaterialIcons name="book" size={20} color="#2E86C1" />
            <Text style={styles.detailText}>
              Subjects: {teacherProfile.subjects?.join(", ") || "N/A"}
            </Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => setIsEditing(!isEditing)} // Toggle edit mode
        >
          <Text style={styles.editProfileButtonText}>
            {isEditing ? "Cancel" : "Edit Profile"}
          </Text>
        </TouchableOpacity>

        {/* Edit Form (Visible when isEditing is true) */}
        {isEditing && (
          <View style={styles.editForm}>
            {/* Department Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Department</Text>
              <Picker
                selectedValue={newDepartment}
                onValueChange={(itemValue) => setNewDepartment(itemValue)}
                style={styles.picker}
              >
                {departments.map((dept, index) => (
                  <Picker.Item key={index} label={dept} value={dept} />
                ))}
              </Picker>
            </View>

            {/* Subject Checkboxes */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Subjects</Text>
              {subjects.map((subject, index) => (
                <CheckBox
                  key={index}
                  title={subject}
                  checked={selectedSubjects.includes(subject)}
                  onPress={() => toggleSubjectSelection(subject)}
                  containerStyle={styles.checkboxContainer}
                  textStyle={styles.checkboxText}
                />
              ))}
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={updateTeacherProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F4F6F7",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7E9",
  },
  backButton: {
    padding: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  headerPlaceholder: {
    width: 24, // Same as back button size for alignment
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  initialsContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2E86C1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  initialsText: {
    fontSize: 36,
    color: "white",
    fontWeight: "bold",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 10,
  },
  editProfileButton: {
    backgroundColor: "#2E86C1",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginVertical: 10,
  },
  editProfileButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  editForm: {
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 5,
  },
  picker: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7E9",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7E9",
    padding: 10,
    fontSize: 16,
  },
  checkboxContainer: {
    backgroundColor: "transparent",
    borderWidth: 0,
    margin: 0,
    padding: 0,
  },
  checkboxText: {
    fontSize: 16,
    color: "#2C3E50",
  },
  saveButton: {
    backgroundColor: "#28a745",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginVertical: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TeacherProfile;