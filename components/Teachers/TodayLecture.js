import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, getDoc, collection } from "firebase/firestore";
import { db, auth } from "../../config";

const TodaysLectures = ({ navigation }) => {
  const [teacherName, setTeacherName] = useState("");
  const [department, setDepartment] = useState("");
  const [todaysLectures, setTodaysLectures] = useState([]);

  useEffect(() => {
    fetchTodaysLectures();
  }, []);

  const fetchTodaysLectures = async () => {
    try {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const today = new Date().getDay();
      const todayDay = days[today]; // Convert day number to day name

      console.log("Today's day:", todayDay); // Debugging

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const teacherName = userData.name; // Fetch teacher's name from the `users` collection
        setTeacherName(teacherName);

        console.log("Teacher name:", teacherName); // Debugging

        // Fetch additional teacher details from the `teachersinfo` collection
        const teacherInfoRef = doc(db, "teachersinfo", auth.currentUser.uid);
        const teacherInfoSnap = await getDoc(teacherInfoRef);

        if (teacherInfoSnap.exists()) {
          const teacherData = teacherInfoSnap.data();
          const department = teacherData.department; // Fetch department
          setDepartment(department);

          console.log("Teacher department:", department); // Debugging

          const timetableRef = collection(db, "timetable");
          const departmentDocRef = doc(timetableRef, department);
          const thirdYearRef = collection(departmentDocRef, "Third Year");
          const todayTimetableRef = doc(thirdYearRef, todayDay);

          // Fetch the document
          const timetableSnapshot = await getDoc(todayTimetableRef);

          if (timetableSnapshot.exists()) {
            console.log("Timetable document found:", timetableSnapshot.data()); // Debugging

            // Check if the document contains lectures
            const lectures = timetableSnapshot.data().lectures || [];

            // Filter lectures for the logged-in teacher using the teacher's name
            const teacherLectures = lectures.filter(
              (lecture) => lecture.teacher === teacherName
            );

            console.log("Lectures for today:", teacherLectures); // Debugging

            // Set the filtered lectures
            setTodaysLectures(teacherLectures);
          } else {
            console.log("No timetable found for today.");
            Alert.alert("Info", "No lectures found for today.");
          }
        } else {
          console.error("Teacher document not found in teachersinfo.");
          Alert.alert("Error", "Teacher details not found!");
        }
      } else {
        console.error("User document not found in users.");
        Alert.alert("Error", "User details not found!");
      }
    } catch (error) {
      console.error("Error fetching today's lectures:", error);
      Alert.alert("Error", "Error fetching today's lectures");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Today's Lectures</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2E86C1" />
        </TouchableOpacity>
      </View>

      {/* Lectures List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {todaysLectures.length > 0 ? (
          todaysLectures.map((lecture, index) => (
            <View key={index} style={styles.lectureCard}>
              <Text style={styles.lectureTitle}>Lecture {index + 1}</Text>
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={20} color="#2E86C1" />
                <Text style={styles.detailText}>Location: {lecture.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="book" size={20} color="#2E86C1" />
                <Text style={styles.detailText}>Subject: {lecture.subject}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={20} color="#2E86C1" />
                <Text style={styles.detailText}>Time: {lecture.timeSlot}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noLecturesText}>No lectures found for today.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6F7",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7E9",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E86C1",
  },
  scrollContainer: {
    padding: 16,
  },
  lectureCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lectureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 8,
  },
  noLecturesText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginTop: 20,
  },
});

export default TodaysLectures;