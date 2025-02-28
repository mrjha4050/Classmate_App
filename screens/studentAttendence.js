import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, View, Text } from "react-native";
import { db } from "../config";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function StudentAttendance({ navigation }) {
  const [studentData, setStudentData] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch user data from "users" to get the name and studentId
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setStudentData({ name: "Unknown User" });
          console.log(
            "User document does not exist for UID:",
            auth.currentUser.uid
          );
          return;
        }

        const userName = userDocSnap.data().name; // Get name from "users" collection
        console.log("User Name from 'users' (raw):", userName); // Debug raw name
        const normalizedUserName = userName.toLowerCase().trim(); // Normalize name: lowercase and trim spaces
        console.log("Normalized User Name for Query:", normalizedUserName); // Debug normalized name
        const studentId = userDocSnap.data().studentId || auth.currentUser.uid; // Fallback to userId if studentId not present
        console.log("Student ID:", studentId); // Debug log for studentId

        // Fetch student data from "students" collection
        const studentDocRef = doc(db, "students", studentId);
        const studentDocSnap = await getDoc(studentDocRef);

        if (studentDocSnap.exists()) {
          const studentData = studentDocSnap.data();
          const userCourse = studentData.course || "N/A"; // Get the user's course (e.g., "Bsc.IT")

          // Fetch subjects data from "subjects" collection based on the user's course
          const subjectsQuery = query(
            collection(db, "subjects"), // Assuming "subjects" is the collection name
            where("course", "==", userCourse) // Filter subjects by the user's course
          );
          const subjectsSnapshot = await getDocs(subjectsQuery);

          const subjectsData = subjectsSnapshot.docs.map(
            (doc) => doc.data().name || "Unknown Subject"
          ); // Assuming each subject document has a "name" field

          // Fetch attendance data from "studentAttendance" collection based on name
          const attendanceQuery = query(
            collection(db, "studentAttendance"),
            where("name", "==", normalizedUserName) // Use normalized name for query
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);

          console.log(
            "Attendance Query Results (Count):",
            attendanceSnapshot.size
          ); // Log number of results
          console.log(
            "Attendance Query Results (Data):",
            attendanceSnapshot.docs.map((doc) => ({
              id: doc.id,
              data: doc.data(),
            }))
          ); // Log detailed attendance data

          const attendanceRecords = attendanceSnapshot.docs.map((doc) =>
            doc.data()
          );
          const subjectAttendance = calculateAttendance(
            attendanceRecords,
            subjectsData
          );

          setStudentData({
            name: userName,
            course: userCourse,
            year: studentData.year || "N/A",
            division: studentData.division || "N/A",
            overallAttendance: subjectAttendance.overall || "0%", // Calculated overall attendance
            subjects: subjectAttendance.subjects || [], // Dynamic subject-wise attendance, no defaults
          });
        } else {
          console.log(
            "Student document does not exist for Student ID:",
            studentId
          );
          setStudentData({
            name: userName,
            course: "N/A",
            year: "N/A",
            division: "N/A",
            overallAttendance: "0%",
            subjects: [], // Empty if no data
          });
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setStudentData({
          name: "Error Loading Data",
          course: "N/A",
          year: "N/A",
          division: "N/A",
          overallAttendance: "0%",
          subjects: [], // Empty if error
        });
      }
    };

    fetchStudentData();
  }, [auth]);

  // Function to calculate overall and subject-wise attendance percentages
  const calculateAttendance = (attendanceRecords, availableSubjects) => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      // If no attendance records, use available subjects with 0% attendance
      return {
        overall: "0%",
        subjects:
          availableSubjects.map((subject) => ({
            name: subject,
            attendance: "0%",
          })) || [],
      };
    }

    const subjectTotals = {};
    let totalClasses = 0;
    let attendedClasses = 0;

    // Process each attendance record
    attendanceRecords.forEach((record) => {
      const subject = record.subject || "Unknown";
      const status = record.status || "A"; // Default to "A" (Absent) if status is missing, as per screenshot ("P" for Present, "A" for Absent)

      if (!subjectTotals[subject]) {
        subjectTotals[subject] = { present: 0, total: 0 };
      }

      subjectTotals[subject].total += 1;
      totalClasses += 1;

      if (status.toUpperCase() === "P") {
        // Check for "P" (Present) as shown in screenshot
        subjectTotals[subject].present += 1;
        attendedClasses += 1;
      }
    });

    // Calculate overall attendance
    const overallPercentage =
      totalClasses > 0
        ? Math.round((attendedClasses / totalClasses) * 100) + "%"
        : "0%";

    // Calculate subject-wise attendance, ensuring all available subjects are included
    const subjectAttendance = availableSubjects.map((subject) => {
      const stats = subjectTotals[subject] || { present: 0, total: 0 };
      return {
        name: subject,
        attendance:
          stats.total > 0
            ? Math.round((stats.present / stats.total) * 100) + "%"
            : "0%",
      };
    });

    return {
      overall: overallPercentage,
      subjects: subjectAttendance, // Return subjects based on the user's course, with calculated or default attendance
    };
  };

  if (!studentData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>ATTENDANCE</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Name: {studentData.name}</Text>
          <Text style={styles.infoText}>Course: {studentData.course}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Year: {studentData.year}</Text>
          <Text style={styles.infoText}>Division: {studentData.division}</Text>
        </View>
        <Text style={styles.overallAttendance}>
          Overall attendance: {studentData.overallAttendance}
        </Text>
        <Text style={styles.subHeader}>Subject Wise Attendance</Text>
        <View style={styles.subjectsBox}>
          {studentData.subjects.length > 0 ? (
            studentData.subjects.map((subject, index) => (
              <Text key={index} style={styles.subjectText}>
                {subject.name}: {subject.attendance}
              </Text>
            ))
          ) : (
            <Text style={styles.subjectText}>No attendance data available</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  content: {
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 20,
  },
  overallAttendance: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
  },
  subjectsBox: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    padding: 15,
    marginBottom: 20,
  },
  subjectText: {
    fontSize: 20,
    marginVertical: 10,
  },
  loadingText: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
  },
});
