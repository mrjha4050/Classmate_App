import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { db } from "../config";
import { collection, getDocs, getDoc, doc, addDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const AttendanceScreen = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedYear, setSelectedYear] = useState("Third Year");
  const [subjects, setSubjects] = useState(["SIC", "GIS", "SQA", "ITSM", "BI"]);  
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);

  const years = ["First Year", "Second Year", "Third Year"];

  // Fetch students based on selected year
  const fetchStudents = async () => {
    try {
      const studentInfoSnapshot = await getDocs(collection(db, "studentinfo"));
      const studentInfoData = studentInfoSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          rollNo: doc.data().rollNumber,
          userId: doc.data().userId,
          year: doc.data().year,
        }))
        .filter((student) => student.year === selectedYear);

      const studentsWithNames = await Promise.all(
        studentInfoData.map(async (student) => {
          const userDoc = await getDoc(doc(db, "users", student.userId));
          const userName = userDoc.exists() ? userDoc.data().name : "Unknown";
          const expoPushToken = userDoc.exists()
            ? userDoc.data().expoPushToken
            : null;
          return { ...student, name: userName, expoPushToken };
        })
      );

      setStudents(studentsWithNames);
    } catch (error) {
      console.error("Error fetching students:", error.message);
      Alert.alert("Error", `Failed to fetch students: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedYear]);

  const handleAttendance = (id, status) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const sendPushNotification = async (expoPushToken, name) => {
    if (!expoPushToken) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Attendance Marked",
          body: `You have been marked as present for ${selectedSubject}.`,
          data: { name },
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending notification:", error.message);
    }
  };

  const saveAttendance = async () => {
    if (!selectedSubject) {
      Alert.alert("Error", "Please select a subject before saving attendance.");
      return;
    }

    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const formattedData = students.map((student) => ({
        rollNo: student.rollNo,
        name: student.name,
        subject: selectedSubject,
        status: attendance[student.id] || "N/A",
        date: currentDate,
      }));

      await addDoc(collection(db, "studentAttendance"), {
        attendance: formattedData,
        timestamp: new Date(),
      });

      // Send notifications to students marked as Present
      formattedData.forEach((student) => {
        if (student.status === "P") {
          const selectedStudent = students.find(
            (s) => s.rollNo === student.rollNo
          );
          if (selectedStudent?.expoPushToken) {
            sendPushNotification(selectedStudent.expoPushToken, student.name);
          }
        }
      });

      Alert.alert("Success", "Attendance saved and notifications sent!");
    } catch (error) {
      Alert.alert("Error", `Failed to save attendance: ${error.message}`);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.rollNoText}>
        {item.rollNo} - {item.name}
      </Text>
      <TouchableOpacity
        style={[
          styles.button,
          attendance[item.id] === "P"
            ? styles.presentButtonActive
            : styles.presentButton,
        ]}
        onPress={() => handleAttendance(item.id, "P")}
      >
        <Text style={styles.buttonText}>P</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          attendance[item.id] === "A"
            ? styles.absentButtonActive
            : styles.absentButton,
        ]}
        onPress={() => handleAttendance(item.id, "A")}
      >
        <Text style={styles.buttonText}>A</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header for Year Selection */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setYearModalVisible(true)}>
          <Text style={styles.classInfo}>
            Class <Text style={styles.highlightedText}>{selectedYear}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Year Selection */}
      <Modal
        visible={yearModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Year</Text>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedYear(year);
                  setYearModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{year}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setYearModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for Subject Selection */}
      <TouchableOpacity
        style={styles.subjectButton}
        onPress={() => setSubjectModalVisible(true)}
      >
        <Text style={styles.subjectButtonText}>
          {selectedSubject || "Select Subject"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={subjectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Subject</Text>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSubject(subject);
                  setSubjectModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{subject}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSubjectModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Student List */}
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveAttendance}>
        <Text style={styles.saveButtonText}>Save Attendance</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#3b4cca", padding: 15, alignItems: "center" },
  classInfo: { color: "white", fontSize: 16, fontWeight: "bold" },
  highlightedText: { color: "red" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  modalItem: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  modalItemText: { fontSize: 16, color: "black" },
  closeButton: {
    backgroundColor: "#3b4cca",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: "50%",
    alignItems: "center",
  },
  closeButtonText: { color: "white", fontWeight: "bold" },
  subjectButton: {
    backgroundColor: "#007bff",
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  subjectButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3b4cca",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  rollNoText: { color: "white", fontSize: 16, flex: 1 },
  button: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
  presentButton: { backgroundColor: "green" },
  presentButtonActive: { backgroundColor: "darkgreen" },
  absentButton: { backgroundColor: "red" },
  absentButtonActive: { backgroundColor: "darkred" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});

export default AttendanceScreen;
