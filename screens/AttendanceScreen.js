import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { collection, getDocs, addDoc, doc } from "firebase/firestore";
import { db } from "../config";

const AttendanceScreen = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});

  const fetchStudents = async () => {
    try {
      const studentInfoSnapshot = await getDocs(collection(db, "studentinfo"));
      const studentInfoData = studentInfoSnapshot.docs.map((doc) => ({
        id: doc.id,
        rollNo: doc.data().rollNumber,
        userId: doc.data().userId,
      }));
  
      const studentsWithNames = await Promise.all(
        studentInfoData.map(async (student) => {
          const userRef = doc(db, "users", student.userId);
          const userDoc = await getDoc(userRef);
          const userName = userDoc.exists() ? userDoc.data().name : "Unknown";
          return { ...student, name: userName };
        })
      );
    } catch (error) {
      Alert.alert("Error", `Failed to fetch students: ${error.message}`);
    }
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
        <Text style={styles.title}>ATTENDANCE</Text>
        <Text style={styles.classInfo}>
          Class <Text style={styles.highlightedText}>TYBSCIT</Text> 10/8/2024
        </Text>
      </View>
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
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  classInfo: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  highlightedText: {
    color: "red",
    fontWeight: "bold",
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
});

export default AttendanceScreen;
