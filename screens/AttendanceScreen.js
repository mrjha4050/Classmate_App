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
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());
  const [displayMode, setDisplayMode] = useState("tile"); // "tile" or "list"

  const navigation = useNavigation();

  // Fetch students with their roll numbers
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

  // Fetch subjects based on selected class
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchSubjects();
    fetchStudents();
  }, [fetchSubjects, fetchStudents]);

  const handleAttendanceChange = useCallback((studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  }, []);

  const handleMarkAllPresent = useCallback(() => {
    const newAttendance = {};
    students.forEach((student) => {
      newAttendance[student.id] = "P";
    });
    setAttendance(newAttendance);
  }, [students]);

  const handleMarkAllAbsent = useCallback(() => {
    const newAttendance = {};
    students.forEach((student) => {
      newAttendance[student.id] = "A";
    });
    setAttendance(newAttendance);
  }, [students]);

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
        rollNo: student.rollno,
        name: student.studentname, // Add student name to the attendance data
        subject: lectureName,
        status: attendance[student.id] || "N/A",
        year: student.year,
        course: student.course,
      }));

      await addDoc(collection(db, "studentAttendance"), {
        attendance: attendanceData,
        timestamp: new Date().toISOString(),
      });

      Alert.alert(
        "Success",
        "Attendance saved successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setAttendance({});
              setLectureName("");
              setStartTime("");
              setEndTime("");
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

  const renderTile = useMemo(
    () =>
      ({ item }) =>
        (
          <View style={styles.tileContainer}>
            <TouchableOpacity
              style={[
                styles.tile,
                attendance[item.id] === "P"
                  ? styles.presentTile
                  : styles.absentTile,
              ]}
              onPress={() =>
                handleAttendanceChange(item.id, attendance[item.id] === "P" ? "A" : "P")
              }
              disabled={loading || notificationLoading}
            >
              <Text style={styles.tileText}>{item.rollno}</Text>
            </TouchableOpacity>
          </View>
        ),
    [attendance, handleAttendanceChange, loading, notificationLoading]
  );

  const renderList = useMemo(
    () =>
      ({ item }) =>
        (
          <View style={styles.studentCard}>
            <Text style={styles.studentName}>{item.studentname}</Text>
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

  const onStartTimeChange = (event, selectedDate) => {
    if (selectedDate || event.type === "dismissed") {
      setStartTimeModalVisible(false);
      if (selectedDate) {
        setTempStartTime(selectedDate);
        const hours = selectedDate.getHours();
        const minutes = selectedDate.getMinutes();
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        const formattedTime = `${displayHours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
        setStartTime(formattedTime);
      }
    }
  };

  const onEndTimeChange = (event, selectedDate) => {
    if (selectedDate || event.type === "dismissed") {
      setEndTimeModalVisible(false);
      if (selectedDate) {
        setTempEndTime(selectedDate);
        const hours = selectedDate.getHours();
        const minutes = selectedDate.getMinutes();
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        const formattedTime = `${displayHours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
        setEndTime(formattedTime);
      }
    }
  };

  const handleSeeAttendance = () => {
    navigation.navigate("SeeAttendance");
  };

  const handleDisplayModeChange = (mode) => {
    setDisplayMode(mode);
  };

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Filter Row */}
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
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setDisplayMode(displayMode === "tile" ? "list" : "tile")}
          disabled={loading}
        >
          <Text style={styles.filterButtonText}>
            {displayMode === "tile" ? "Switch to List" : "Switch to Tile"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Row with Labels */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              editable={false}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Lecture</Text>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => setSubjectModalVisible(true)}
              disabled={loading || notificationLoading}
            >
              <Text style={styles.inputButtonText}>
                {lectureName || "Select Lecture"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Start Time</Text>
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
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>End Time</Text>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => {
                setTempEndTime(new Date());
                setEndTimeModalVisible(true);
              }}
              disabled={loading || notificationLoading}
            >
              <Text style={styles.inputButtonText}>
                {endTime || "End Time"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
              display="spinner"
              is24Hour={false}
              onChange={onStartTimeChange}
              textColor="#000"
              style={styles.dateTimePicker}
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
              display="spinner"
              is24Hour={false}
              onChange={onEndTimeChange}
              textColor="#000"
              style={styles.dateTimePicker}
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

      {/* Bulk Action Buttons */}
      <View style={styles.bulkActionRow}>
        <TouchableOpacity
          style={styles.bulkButton}
          onPress={handleMarkAllPresent}
          disabled={loading || notificationLoading || students.length === 0}
        >
          <Text style={styles.bulkButtonText}>Mark All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bulkButton}
          onPress={handleMarkAllAbsent}
          disabled={loading || notificationLoading || students.length === 0}
        >
          <Text style={styles.bulkButtonText}>Mark All Absent</Text>
        </TouchableOpacity>
      </View>

      {/* Student Grid/List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86C1" />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={displayMode === "tile" ? renderTile : renderList}
          numColumns={displayMode === "tile" ? 3 : 1}
          key={displayMode}
          contentContainerStyle={styles.gridContent}
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
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
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
    backgroundColor: "#28a745",
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  filterButton: {
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    margin: 5,
    minWidth: 80,
    alignItems: "center",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  inputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    fontSize: 14,
  },
  inputButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    alignItems: "center",
  },
  inputButtonText: {
    fontSize: 14,
    color: "#333",
  },
  tileContainer: {
    flex: 1,
    margin: 5,
  },
  tile: {
    padding: 5,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 40,
    aspectRatio: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  presentTile: {
    backgroundColor: "#28a745",
  },
  absentTile: {
    backgroundColor: "#dc3545",
  },
  tileText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
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
  bulkActionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 10,
    borderRadius: 8,
  },
  bulkButton: {
    backgroundColor: "#2E86C1",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bulkButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#2E86C1",
    paddingVertical: 12,
    marginHorizontal: 15,
    marginVertical: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
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
    justifyContent: "center",
  },
  dateTimePicker: {
    width: "100",
    height: 200,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalItem: {
    paddingVertical: 10,
    width: "100",
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
  gridContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
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