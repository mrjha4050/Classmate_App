import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../config";
import * as Notifications from "expo-notifications";
import { COURSES } from "../components/constant";
import DateTimePicker from "@react-native-community/datetimepicker"; // For native time picker
import { Ionicons } from "@expo/vector-icons"; // For back icon (install @expo/vector-icons)
import { useNavigation } from "@react-navigation/native"; // For navigation

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const AttendanceScreen = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState(COURSES[0] || "Bsc.IT");
  const [selectedDivision, setSelectedDivision] = useState("A");
  const [selectedYear, setSelectedYear] = useState("Third Year");
  const [lectureName, setLectureName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(""); // Will store time in AM/PM format (e.g., "10:00 AM")
  const [endTime, setEndTime] = useState(""); // Will store time in AM/PM format (e.g., "11:00 PM")
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [divisionModalVisible, setDivisionModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [startTimeModalVisible, setStartTimeModalVisible] = useState(false);
  const [endTimeModalVisible, setEndTimeModalVisible] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [tempStartTime, setTempStartTime] = useState(new Date()); // Temporary state for DateTimePicker
  const [tempEndTime, setTempEndTime] = useState(new Date()); // Temporary state for DateTimePicker

  const navigation = useNavigation(); // Use navigation hook

  // Fetch students with their names from 'users' collection
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const studentsQuery = query(
        collection(db, "students"),
        where("course", "==", selectedClass),
        where("division", "==", selectedDivision),
        where("year", "==", selectedYear)
      );

      const studentsSnapshot = await getDocs(studentsQuery);
      if (studentsSnapshot.empty) {
        Alert.alert(
          "No Students Found",
          "No students found for the selected filters."
        );
        setStudents([]);
        setAttendance({});
        setIsDataFetched(false);
        return;
      }

      const fetchedStudents = await Promise.all(
        studentsSnapshot.docs.map(async (docSnapshot) => {
          const studentData = docSnapshot.data();
          const userDocRef = doc(db, "users", studentData.userId);
          const userDoc = await getDoc(userDocRef);

          return {
            id: docSnapshot.id,
            course: studentData.course,
            division: studentData.division,
            phonenumber: studentData.phonenumber || "N/A",
            rollno: studentData.rollno || "N/A",
            studentid: studentData.studentid || "N/A",
            year: studentData.year,
            studentname: userDoc.exists()
              ? userDoc.data().name || "Unknown"
              : "Unknown",
            email: userDoc.exists()
              ? userDoc.data().email || "Unknown"
              : "Unknown",
          };
        })
      );

      setStudents(fetchedStudents);
      const initialAttendance = {};
      fetchedStudents.forEach((student) => {
        initialAttendance[student.id] = "P"; // Default to Present
      });
      setAttendance(initialAttendance);
      setIsDataFetched(true);
    } catch (error) {
      console.error("Error fetching students:", error);
      Alert.alert("Error", "Failed to fetch students. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDivision, selectedYear]);

  // Fetch subjects based on selected class (department)
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true); // Show loading while fetching subjects
      const subjectsQuery = query(
        collection(db, "subjects"),
        where("department", "==", selectedClass)
      );
      const subjectsSnapshot = await getDocs(subjectsQuery);
      const fetchedSubjects = subjectsSnapshot.docs.map(
        (doc) => doc.data().subjectName || "Unknown"
      );
      setSubjects(fetchedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      Alert.alert("Error", "Failed to fetch subjects. Please try again.");
    } finally {
      setLoading(false); // Hide loading after fetching
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchSubjects();
    fetchStudents(); // Fetch students on mount or when filters change
  }, [fetchSubjects, fetchStudents]);

  const handleAttendanceChange = useCallback((studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  }, []);

  const handleSaveAttendance = async () => {
    if (!lectureName || !startTime || !endTime) {
      Alert.alert("Error", "Please fill in all the fields!");
      return;
    }

    if (students.length === 0) {
      Alert.alert("Error", "No students fetched to save attendance.");
      return;
    }

    setNotificationLoading(true);
    try {
      const attendanceData = students.map((student) => ({
        date,
        name: student.studentname,
        rollNo: student.rollno,
        subject: lectureName,
        status: attendance[student.id] || "N/A",
        year: student.year, // Include student's year
        course: student.course, // Include student's course
      }));

      await addDoc(collection(db, "studentAttendance"), {
        attendance: attendanceData,
        timestamp: new Date().toISOString(),
      });

      // Enhanced popup for attendance saved
      Alert.alert(
        "Success",
        "Attendance saved successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setAttendance({}); // Reset attendance after confirmation
              setLectureName(""); // Reset lecture name
              setStartTime(""); // Reset start time
              setEndTime(""); // Reset end time
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error saving attendance:", error.message);
      Alert.alert("Error", "Failed to save attendance. Please try again.");
    } finally {
      setNotificationLoading(false);
    }
  };

  const renderItem = useMemo(
    () =>
      ({ item }) =>
        (
          <View style={styles.studentCard}>
            <Text style={styles.studentName}>
              {item.rollno} - {item.studentname}
            </Text>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  attendance[item.id] === "P"
                    ? styles.presentButtonActive
                    : styles.presentButton,
                ]}
                onPress={() => handleAttendanceChange(item.id, "P")}
                disabled={loading || notificationLoading}
              >
                <Text style={styles.buttonText}>P</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  attendance[item.id] === "A"
                    ? styles.absentButtonActive
                    : styles.absentButton,
                ]}
                onPress={() => handleAttendanceChange(item.id, "A")}
                disabled={loading || notificationLoading}
              >
                <Text style={styles.buttonText}>A</Text>
              </TouchableOpacity>
            </View>
          </View>
        ),
    [attendance, handleAttendanceChange, loading, notificationLoading]
  );

  // Handle time selection for startTime
  const onStartTimeChange = (event, selectedDate) => {
    if (selectedDate || event.type === "dismissed") {
      setStartTimeModalVisible(false);
      if (selectedDate) {
        setTempStartTime(selectedDate);
        const hours = selectedDate.getHours();
        const minutes = selectedDate.getMinutes();
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert to 12-hour format
        const formattedTime = `${displayHours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
        setStartTime(formattedTime);
      }
    }
  };

  // Handle time selection for endTime
  const onEndTimeChange = (event, selectedDate) => {
    if (selectedDate || event.type === "dismissed") {
      setEndTimeModalVisible(false);
      if (selectedDate) {
        setTempEndTime(selectedDate);
        const hours = selectedDate.getHours();
        const minutes = selectedDate.getMinutes();
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert to 12-hour format
        const formattedTime = `${displayHours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
        setEndTime(formattedTime);
      }
    }
  };

  const handleSeeAttendance = () => {
    navigation.navigate("SeeAttendance"); // Navigate to SeeAttendance screen
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Icon and Title */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <TouchableOpacity
          style={styles.seeAttendanceButton}
          onPress={handleSeeAttendance}
        >
          <Text style={styles.seeAttendanceButtonText}>See Attendance</Text>
        </TouchableOpacity>
      </View>

      {/* Input Row for Filters */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setClassModalVisible(true)}
          disabled={loading}
        >
          <Text style={styles.filterButtonText}>{selectedClass}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setDivisionModalVisible(true)}
          disabled={loading}
        >
          <Text style={styles.filterButtonText}>{selectedDivision}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setYearModalVisible(true)}
          disabled={loading}
        >
          <Text style={styles.filterButtonText}>{selectedYear}</Text>
        </TouchableOpacity>
      </View>

      {/* Input Row for Date, Lecture, Time */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          editable={false}
        />
        <TouchableOpacity
          style={styles.inputButton}
          onPress={() => setSubjectModalVisible(true)}
          disabled={loading || notificationLoading}
        >
          <Text style={styles.inputButtonText}>
            {lectureName || "Select Lecture"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={() => {
            setTempStartTime(new Date());
            setStartTimeModalVisible(true);
          }}
          disabled={loading || notificationLoading}
        >
          <Text style={styles.inputButtonText}>
            {startTime || "Start Time"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={() => {
            setTempEndTime(new Date());
            setEndTimeModalVisible(true);
          }}
          disabled={loading || notificationLoading}
        >
          <Text style={styles.inputButtonText}>{endTime || "End Time"}</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modals */}
      <Modal
        visible={startTimeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStartTimeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timeModalContainer}>
            <DateTimePicker
              value={tempStartTime}
              mode="time"
              display="spinner" // Use spinner for scrollable AM/PM format
              is24Hour={false} // Use 12-hour format with AM/PM
              onChange={onStartTimeChange}
              textColor="#000" // Explicitly set text color to black
              style={styles.dateTimePicker} // Custom style for visibility
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setStartTimeModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={endTimeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEndTimeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timeModalContainer}>
            <DateTimePicker
              value={tempEndTime}
              mode="time"
              display="spinner" // Use spinner for scrollable AM/PM format
              is24Hour={false} // Use 12-hour format with AM/PM
              onChange={onEndTimeChange}
              textColor="#000" // Explicitly set text color to black
              style={styles.dateTimePicker} // Custom style for visibility
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEndTimeModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Student List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86C1" />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.noStudentsText}>No students found.</Text>
          }
        />
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          (loading || notificationLoading) && styles.disabledButton,
        ]}
        onPress={handleSaveAttendance}
        disabled={loading || notificationLoading}
      >
        <Text style={styles.saveButtonText}>
          {notificationLoading ? "Saving..." : "Save Attendance"}
        </Text>
        {notificationLoading && (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={styles.loadingIndicator}
          />
        )}
      </TouchableOpacity>

      {/* Modals for Filters */}
      <Modal
        visible={classModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setClassModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Class</Text>
            {COURSES.map((course) => (
              <TouchableOpacity
                key={course}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedClass(course);
                  setClassModalVisible(false);
                }}
                disabled={loading}
              >
                <Text style={styles.modalItemText}>{course}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setClassModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={divisionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDivisionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Division</Text>
            {["A", "B", "C"].map((division) => (
              <TouchableOpacity
                key={division}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedDivision(division);
                  setDivisionModalVisible(false);
                }}
                disabled={loading}
              >
                <Text style={styles.modalItemText}>{division}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDivisionModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={yearModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Year</Text>
            {["First Year", "Second Year", "Third Year"].map((year) => (
              <TouchableOpacity
                key={year}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedYear(year);
                  setYearModalVisible(false);
                }}
                disabled={loading}
              >
                <Text style={styles.modalItemText}>{year}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setYearModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={subjectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Subject</Text>
            {subjects.map((subject, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalItem}
                onPress={() => {
                  setLectureName(subject);
                  setSubjectModalVisible(false);
                }}
                disabled={loading}
              >
                <Text style={styles.modalItemText}>{subject}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSubjectModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#2E86C1",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  seeAttendanceButton: {
    backgroundColor: "#28a745", // Green button to match attendance theme
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  seeAttendanceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  filterRow: {
    backgroundColor: "#2E86C1",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    minWidth: 90,
    alignItems: "center",
  },
  filterButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 16,
    minWidth: 90,
  },
  inputButton: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  inputButtonText: {
    fontSize: 16,
    color: "#333",
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  studentName: {
    color: "#2C3E50",
    fontSize: 16,
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 5,
  },
  attendanceButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
  },
  presentButton: {
    backgroundColor: "#28a745",
  },
  presentButtonActive: {
    backgroundColor: "#218838",
  },
  absentButton: {
    backgroundColor: "#dc3545",
  },
  absentButtonActive: {
    backgroundColor: "#c82333",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#2E86C1",
    padding: 12,
    margin: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxHeight: "70%",
    alignItems: "center",
  },
  timeModalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    justifyContent: "center", // Center the DateTimePicker
  },
  dateTimePicker: {
    width: "100%",
    height: 200, // Adjust height to ensure visibility
    backgroundColor: "#fff", // Ensure background is visible
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalItem: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#2E86C1",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: "50%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  noStudentsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
});

export default AttendanceScreen;