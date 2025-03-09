import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const TimetableDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { timetableUpdate } = route.params;

  console.log("Timetable Update Lectures:", timetableUpdate.lectures);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2E86C1" />
        </TouchableOpacity>
        <Text style={styles.header}>Timetable Update Details</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Update on {new Date(timetableUpdate.date).toLocaleDateString()}
          </Text>
          <Text style={styles.label}>Description:</Text>
          <Text style={styles.cardText}>{timetableUpdate.description}</Text>

          <Text style={styles.label}>Year:</Text>
          <Text style={styles.cardText}>{timetableUpdate.year}</Text>

          <Text style={styles.label}>Division:</Text>
          <Text style={styles.cardText}>{timetableUpdate.division}</Text>

          <Text style={styles.label}>Duration:</Text>
          <Text style={styles.cardText}>{timetableUpdate.duration} minutes</Text>

          <Text style={styles.label}>Time Slot:</Text>
          <Text style={styles.cardText}>
            {timetableUpdate.startTime} - {timetableUpdate.endTime}
          </Text>

          <Text style={styles.label}>Lectures:</Text>
          {timetableUpdate.lectures && timetableUpdate.lectures.length > 0 ? (
            Array.isArray(timetableUpdate.lectures[0]) ? (
              timetableUpdate.lectures[0].map((lecture, index) => (
                <View key={index} style={styles.lectureItem}>
                  <Text style={styles.cardText}>
                    {`${lecture.subject} (${lecture.startTime} - ${lecture.endTime}, ${lecture.location})`}
                  </Text>
                </View>
              ))
            ) : (
              timetableUpdate.lectures.map((lecture, index) => (
                <View key={index} style={styles.lectureItem}>
                  <Text style={styles.cardText}>
                    {`${lecture.subject} (${lecture.startTime} - ${lecture.endTime}, ${lecture.location})`}
                  </Text>
                </View>
              ))
            )
          ) : (
            <Text style={styles.noDataText}>No lectures scheduled.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7E9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E86C1",
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E86C1",
    marginTop: 10,
  },
  cardText: {
    fontSize: 16,
    color: "#2C3E50",
    marginVertical: 4,
  },
  lectureItem: {
    marginVertical: 4,
    paddingLeft: 10,
  },
  noDataText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginVertical: 4,
  },
});

export default TimetableDetailsScreen;