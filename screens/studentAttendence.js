import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View, Text } from "react-native";

export default function StudentAttendance({ navigation }) {
  // Static data mimicking the attendance card design
  const staticAttendance = {
    name: "Naman",
    course: "BScIT",
    year: "Third Year",
    division: "A",
    overallAttendance: "78%",
    subjects: [{ name: "SQA", attendance: "50%" }],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>ATTENDANCE</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Name: {staticAttendance.name}</Text>
          <Text style={styles.infoText}>Course: {staticAttendance.course}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Year: {staticAttendance.year}</Text>
          <Text style={styles.infoText}>
            Division: {staticAttendance.division}
          </Text>
        </View>
        <Text style={styles.overallAttendance}>
          Overall attendance: {staticAttendance.overallAttendance}
        </Text>
        <Text style={styles.subHeader}>Subject Wise Attendance</Text>
        <View style={styles.subjectsBox}>
          {staticAttendance.subjects.map((subject, index) => (
            <Text key={index} style={styles.subjectText}>
              {subject.name}: {subject.attendance}
            </Text>
          ))}
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
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 10,
    padding: 16,
    width: "90%",
    elevation: 4, // Add shadow for Android
    shadowColor: "#000", // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
  },
  overallAttendance: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  subjectsBox: {
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 5,
    padding: 10,
  },
  subjectText: {
    fontSize: 16,
    marginVertical: 5,
  },
});
