import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { CheckBox } from "react-native-elements";
import { LogBox } from "react-native";
import { AuthContext } from "../AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TeacherProfile = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [teacherName, setTeacherName] = useState("");
  const [teacherProfile, setTeacherProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [profilePhotoUri, setProfilePhotoUri] = useState(null); // Store local image URI
  const [uploading, setUploading] = useState(false);

  const departments = ["Bsc.IT", "Bsc.CS", "BBA", "B.Com"];
  const subjects = ["ITSM", "SOA", "SIC", "GIS", "Python"];

  // Suppress the defaultProps warning
  useEffect(() => {
    LogBox.ignoreLogs(["Warning: TextElement: Support for defaultProps"]);
  }, []);

  const fetchTeacherName = async (teacherId) => {
    try {
      const userDocRef = doc(db, "users", teacherId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setTeacherName(data.name || "Unknown");
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
        setProfilePhotoUri(data.profilePhotoUrl || null); // Use profilePhotoUrl from Firestore
        setNewDepartment(data.department || "");
        setNewPhone(data.phone || "");
        setSelectedSubjects(data.subjects || []);
      } else {
        Alert.alert("Error", "No teacher profile found!");
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
        subjects: selectedSubjects,
        profilePhotoUrl: profilePhotoUri, // Update with local URI or null if not set
      });
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
      fetchTeacherProfile();
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const pickImage = async () => {
    console.log("pickImage function triggered");
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Permission result:", permissionResult);
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    console.log("ImagePicker result:", result);

    if (!result.canceled) {
      setUploading(true);
      try {
        const imageUri = result.assets[0].uri;
        console.log("Selected image URI:", imageUri);
        setProfilePhotoUri(imageUri); // Set the local URI for display
        Alert.alert("Success", "Image selected successfully! Save to update profile.");
      } catch (error) {
        console.error("Error selecting image:", error);
        Alert.alert("Error", "Failed to select image: " + error.message);
      } finally {
        setUploading(false);
      }
    } else {
      console.log("Image selection canceled by user");
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
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((item) => item !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: insets.top, backgroundColor: "#F5F7FA" }}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2E86C1" />
        </TouchableOpacity>
        <Text style={styles.header}>Profile</Text>
        <TouchableOpacity
          style={styles.editIcon}
          onPress={() => setIsEditing(!isEditing)}
        >
          <MaterialIcons name="edit" size={24} color="#2E86C1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.profileCard}>
          {profilePhotoUri ? (
            <Image
              source={{ uri: profilePhotoUri }}
              style={styles.profileImage}
              onError={(e) => {
                console.log("Image load error:", e.nativeEvent.error);
                setProfilePhotoUri(null);
              }}
            />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{getInitials(teacherName)}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{teacherName || "Unknown"}</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MaterialIcons name="school" size={20} color="#2E86C1" />
              <Text style={styles.detailText}>
                Department: {teacherProfile.department || "N/A"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={20} color="#2E86C1" />
              <Text style={styles.detailText}>
                Phone: {teacherProfile.phone || "N/A"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="book" size={20} color="#2E86C1" />
              <Text style={styles.detailText}>
                Subjects: {teacherProfile.subjects?.join(", ") || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {isEditing && (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Profile Photo</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.uploadButtonText}>Select Photo</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subjects</Text>
              <View style={styles.checkboxContainer}>
                {subjects.map((subject, index) => (
                  <CheckBox
                    key={index}
                    title={subject}
                    checked={selectedSubjects.includes(subject)}
                    onPress={() => toggleSubjectSelection(subject)}
                    checkedColor="#2E86C1"
                    uncheckedColor="#7F8C8D"
                    containerStyle={styles.checkbox}
                    textStyle={styles.checkboxText}
                  />
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={updateTeacherProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => Alert.alert("Feature", "Change Password coming soon!")}
            >
              <Text style={styles.changePasswordButtonText}>Change Password</Text>
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
    padding: 16,
    backgroundColor: "#F5F7FA",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7E9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  editIcon: {
    padding: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2C3E50",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    resizeMode: "cover",
  },
  initialsContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2E86C1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  initialsText: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 15,
    textAlign: "center",
  },
  detailsContainer: {
    width: "100%",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 10,
  },
  editForm: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 8,
  },
  picker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7E9",
    padding: 10,
  },
  checkboxContainer: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  checkbox: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  checkboxText: {
    fontSize: 16,
    color: "#2C3E50",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7E9",
    padding: 12,
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: "#2E86C1",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#28a745",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  changePasswordButton: {
    backgroundColor: "#2E86C1",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  changePasswordButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TeacherProfile;