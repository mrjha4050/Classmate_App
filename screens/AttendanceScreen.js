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

const AttendanceScreen = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedYear, setSelectedYear] = useState("Third Year"); // Default year
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility

  const years = ["First Year", "Second Year", "Third Year"]; // Available years

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
        .filter((student) => student.year === selectedYear); // Filter by selected year

      const studentsWithNames = await Promise.all(
        studentInfoData.map(async (student) => {
          const userDoc = await getDoc(doc(db, "users", student.userId));
          const userName = userDoc.exists() ? userDoc.data().name : "Unknown";
          return { ...student, name: userName };
        })
      );

      setStudents(studentsWithNames);
    } catch (error) {
      console.error("Error fetching students:", error.message);
      Alert.alert("Error", `Failed to fetch students: ${error.message}`);
    }
  };

  // Handle selecting a year
  const selectYear = (year) => {
    setSelectedYear(year);
    setModalVisible(false);
    fetchStudents(); // Refetch students after selecting a year
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAttendance = (id, status) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const saveAttendance = async () => {
    try {
      const formattedData = students.map((student) => ({
        rollNo: student.rollNo,
        name: student.name,
        status: attendance[student.id] || "N/A",
        date: new Date().toISOString(),
      }));

      await addDoc(collection(db, "studentAttendance"), {
        attendance: formattedData,
        timestamp: new Date(),
      });

      Alert.alert("Success", "Attendance saved to Database!");
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.classInfo}>
            Class <Text style={styles.highlightedText}>{selectedYear}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Year</Text>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={styles.modalItem}
                onPress={() => selectYear(year)}
              >
                <Text style={styles.modalItemText}>{year}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveAttendance}>
        <Text style={styles.saveButtonText}>Save Attendance</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#3b4cca",
    padding: 15,
    alignItems: "center",
  },
  classInfo: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  highlightedText: {
    color: "red",
  },
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
  rollNoText: {
    color: "white",
    fontSize: 16,
    flex: 1,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  presentButton: {
    backgroundColor: "green",
  },
  presentButtonActive: {
    backgroundColor: "darkgreen",
  },
  absentButton: {
    backgroundColor: "red",
  },
  absentButtonActive: {
    backgroundColor: "darkred",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalItem: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 16,
    color: "black",
  },
  closeButton: {
    backgroundColor: "#3b4cca",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: "50%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default AttendanceScreen;