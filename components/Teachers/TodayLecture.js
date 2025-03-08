import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, getDoc, collection, query, where } from "firebase/firestore";
import { auth, db } from "../../config";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TodaysLectures = ({ navigation }) => {
  const [teacherInfo, setTeacherInfo] = useState({ name: "", department: "" });
  const [lectures, setLectures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");

      try {
        if (!auth?.currentUser?.uid) {
          throw new Error("No authenticated user found.");
        }

        const userId = auth.currentUser.uid;
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error("User document not found.");
        }

        const userData = userDocSnap.data();
        const teacherName = userData.name || "Unknown Teacher";
        const teacherInfoRef = doc(db, "teachersinfo", userId);
        const teacherInfoSnap = await getDoc(teacherInfoRef);

        if (!teacherInfoSnap.exists()) {
          throw new Error("Teacher details not found.");
        }

        const teacherData = teacherInfoSnap.data();
        const department = teacherData.department || "Unknown Department";
        setTeacherInfo({ name: teacherName, department });

        const today = new Date().getDay();
        const todayDay = DAYS_OF_WEEK[today];
        console.log("Fetching lectures for:", todayDay, "by", teacherName);

        const timetableRef = collection(db, "timetable");
        const deptDocRef = doc(timetableRef, department);
        const yearRef = collection(deptDocRef, "Third Year");
        const todayTimetableRef = doc(yearRef, todayDay);
        const timetableSnapshot = await getDoc(todayTimetableRef);

        if (timetableSnapshot.exists()) {
          const timetableData = timetableSnapshot.data();
          const allLectures = timetableData.lectures || [];
          const teacherLectures = allLectures.filter(lecture => lecture.teacher === teacherName);
          console.log("Found lectures:", teacherLectures);
          setLectures(teacherLectures);
        } else {
          console.log("No timetable found for today:", todayDay);
          setLectures([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError(err.message || "Failed to fetch today's lectures.");
        Alert.alert("Error", err.message || "Failed to fetch today's lectures.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderLectureItem = ({ item, index }) => (
    <View style={styles.lectureCard}>
      <Text style={styles.lectureTitle}>Lecture {index + 1}</Text>
      <View style={styles.detailRow}>
        <MaterialIcons name="location-on" size={20} color="#2E86C1" />
        <Text style={styles.detailText}>Location: {item.location}</Text>
      </View>
      <View style={styles.detailRow}>
        <MaterialIcons name="book" size={20} color="#2E86C1" />
        <Text style={styles.detailText}>Subject: {item.subject}</Text>
      </View>
      <View style={styles.detailRow}>
        <MaterialIcons name="access-time" size={20} color="#2E86C1" />
        <Text style={styles.detailText}>Time: {item.timeSlot}</Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2E86C1" style={styles.loading} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </>
  );

  const renderEmptyList = () => (
    <Text style={styles.noLecturesText}>No lectures found for today.</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Today's Lectures</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2E86C1" />
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <FlatList
          data={isLoading || error ? [] : lectures}
          renderItem={renderLectureItem}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.listContainer}
        />
      </View>
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
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
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
  loading: {
    marginVertical: 20,
  },
  errorText: {
    color: "#dc3545",
    textAlign: "center",
    marginVertical: 20,
  },
});

export default TodaysLectures;