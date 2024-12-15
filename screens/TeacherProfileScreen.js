import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../AuthContext";
import {
  doc,
  getDoc,
  updateDocs,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config";

const TeacherProfile = () => {
  const { user } = useContext(AuthContext);  
  const [teacherName, setTeacherName] = useState("");
  const [lectures, setLectures] = useState([]);
  const [selectedDay, setSelectedDay] = useState(
    new Date().toLocaleString("en-US", { weekday: "long" })
  );
  const [scheduleVisible, setScheduleVisible] = useState(false);  
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState({});
  const [newDepartment, setNewDepartment] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

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

  const fetchLecturesByDayAndTeacher = async (day) => {
    try {
      if (!teacherName) {
        console.warn("Teacher name is not available.");
        return;
      }
  
      // Reference the document for the specific day
      const dayDocRef = doc(db, `timetable/Bsc.IT/Third Year/${day}`);
      const dayDocSnap = await getDoc(dayDocRef);
  
      if (dayDocSnap.exists()) {
        const dayData = dayDocSnap.data();
        const allLectures = dayData.lectures || []; // Get the "lectures" array from the document
  
        // Filter lectures for the current teacher
        const teacherLectures = allLectures.filter(
          (lecture) => lecture.teacher === teacherName
        );
  
        setLectures(teacherLectures); // Update the state with filtered lectures
      } else {
        console.warn(`No timetable found for day: ${day}`);
        setLectures([]); // No lectures for the day
      }
    } catch (error) {
      console.error("Error fetching lectures by day and teacher:", error);
      Alert.alert("Error", `Failed to fetch lectures for ${day}`);
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
      });
      Alert.alert("Success", "Profile updated successfully!");
      setEditProfileVisible(false);
      fetchTeacherProfile();
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchTeacherName(user.uid);
      fetchTeacherProfile();
      fetchLecturesByDayAndTeacher(selectedDay);
    }
  }, [user?.uid, selectedDay, teacherName]);

  const getInitials = (name) => {
    if (!name) return "??";
    const nameParts = name.split(" ");
    const initials = nameParts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    return initials;
  };

  const renderLectureItem = ({ item }) => (
    <View style={styles.lectureItem}>
      <Text style={styles.lectureText}>
        {item.subject} - {item.location}
      </Text>
      <Text style={styles.lectureText}>{item.timeSlot}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.initialsContainer}>
          <Text style={styles.initialsText}>{getInitials(teacherName)}</Text>
        </View>
        <Text style={styles.profileName}>{teacherName || "Unknown"}</Text>
        <View style={styles.row}>
          <MaterialIcons name="schedule" size={16} color="gray" />
          <Text style={styles.profileSubtitle}>
            Department: {teacherProfile.department || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.daySelector}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDay === day && styles.dayButtonSelected,
            ]}
            onPress={() => setSelectedDay(day)}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDay === day && styles.dayButtonTextSelected,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => setScheduleVisible(true)}
      >
        <Text style={styles.viewAllButtonText}>View Schedule</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => setEditProfileVisible(true)}
      >
        <Text style={styles.editProfileButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Schedule Modal */}
      <Modal visible={scheduleVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Schedule for {selectedDay}</Text>
          <FlatList
            data={lectures}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderLectureItem}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setScheduleVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Department"
            value={newDepartment}
            onChangeText={setNewDepartment}
          />
          <TextInput
            style={styles.input}
            placeholder="Phonenumber"
            value={newPhone}
            onChangeText={setNewPhone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={updateTeacherProfile}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setEditProfileVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  profileSection: { alignItems: "center", marginBottom: 20 },
  initialsContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  initialsText: { fontSize: 36, color: "white", fontWeight: "bold" },
  profileName: { fontSize: 20, fontWeight: "bold" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  profileSubtitle: { marginLeft: 5, color: "gray" },
  viewAllButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  viewAllButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  editProfileButton: {
    backgroundColor: "#28a745",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  editProfileButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  closeButton: {
    backgroundColor: "#dc3545",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  closeButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  daySelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  dayButton: { padding: 10, borderRadius: 5, backgroundColor: "#f1f1f1" },
  dayButtonSelected: { backgroundColor: "#007bff" },
  dayButtonText: { fontSize: 14, color: "#333" },
  dayButtonTextSelected: { color: "white" },
});

export default TeacherProfile;
