import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
} from "react-native";
import { db } from "../config";
import { collection, getDocs, getDoc, doc, addDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { YEARS, YEAR_SUBJECTS } from "../components/constant";

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
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(YEARS[2]);
  const [subjects, setSubjects] = useState(YEAR_SUBJECTS[selectedYear]);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);

  const fetchStudents = async () => {
    try {
      const studentInfoSnapshot = await getDocs(collection(db, "students"));
      const studentInfoData = studentInfoSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          rollNo: doc.data().studentrollno,
          userId: doc.data().userId,
          year: doc.data().studentyear,
          name: doc.data().studentname,
          email: doc.data().studentemail,
        }))
        .filter((student) => student.year === selectedYear)
        .sort((a, b) => a.rollNo - b.rollNo); // Sort by rollNo in ascending order

      setStudents(studentInfoData);
    } catch (error) {
      console.error("Error fetching students:", error.message);
      Alert.alert("Error", `Failed to fetch students: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchStudents();
    setSubjects(YEAR_SUBJECTS[selectedYear] || []);
  }, [selectedYear]);

  const handleAttendance = (id, status) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const sendPushNotification = async (expoPushToken, name, status) => {
    if (!expoPushToken) return;
    const messageBody =
      status === "present"
        ? `You have been marked as present for ${selectedSubject}.`
        : `You have been marked as absent for ${selectedSubject}.`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Attendance Notification",
          body: messageBody,
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

      formattedData.forEach((student) => {
        const selectedStudent = students.find(
          (s) => s.rollNo === student.rollNo
        );

        if (selectedStudent?.expoPushToken) {
          if (student.status === "P") {
            sendPushNotification(
              selectedStudent.expoPushToken,
              student.name,
              "present"
            );
          } else if (student.status === "A") {
            sendPushNotification(
              selectedStudent.expoPushToken,
              student.name,
              "absent"
            );
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
    <SafeAreaView style={styles.container}>
      {/* Header for Year Selection */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setYearModalVisible(true)}>
          <Text style={styles.classInfo}>
            Class <Text style={styles.highlightedText}>{selectedYear}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={yearModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Year</Text>
            {YEARS.map((year) => (
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#2E86C1", padding: 20, alignItems: "center" },
  classInfo: { color: "white", fontSize: 18, fontWeight: "bold" },
  highlightedText: { color: "#FFD700" }, // Gold color for highlighted text
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
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  modalItem: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  modalItemText: { fontSize: 16, color: "black" },
  closeButton: {
    backgroundColor: "#2E86C1",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: "50%",
    alignItems: "center",
  },
  closeButtonText: { color: "white", fontWeight: "bold" },
  subjectButton: {
    backgroundColor: "#28a745",
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
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  rollNoText: { color: "#2C3E50", fontSize: 16, flex: 1 },
  button: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
  presentButton: { backgroundColor: "#28a745" },
  presentButtonActive: { backgroundColor: "#218838" },
  absentButton: { backgroundColor: "#dc3545" },
  absentButtonActive: { backgroundColor: "#c82333" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  saveButton: {
    backgroundColor: "#2E86C1",
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});

export default AttendanceScreen;