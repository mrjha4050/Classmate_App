import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { db } from "../config";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  collectionGroup,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "Warning: TextElement: Support for defaultProps will be removed",
]);

const TeacherHomeScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [todayLecturesCount, setTodayLecturesCount] = useState(0);
  const auth = getAuth();

  useEffect(() => {
    fetchUserDetails();
    fetchNotices();
    fetchTodayLectures();
  }, []);

  const fetchUserDetails = async () => {
    try {
      // Fetch user details from the 'users' collection
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUser(userData);

        const teacherInfoRef = doc(db, "teachersinfo", auth.currentUser.uid);
        const teacherInfoSnap = await getDoc(teacherInfoRef);

        if (teacherInfoSnap.exists()) {
          const teacherData = teacherInfoSnap.data();
          setUser((prevUser) => ({ ...prevUser, ...teacherData }));
        } else {
          console.error("Teacher details not found in teachersinfo.");
          Alert.alert("Error", "Teacher details not found!");
        }
      } else {
        Alert.alert("Error", "User details not found!");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Error fetching user data");
    }
  };

  const fetchNotices = async () => {
    try {
      const noticesCollection = collection(db, "notices");
      const noticesSnapshot = await getDocs(noticesCollection);
      const noticesList = noticesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotices(noticesList);
    } catch (error) {
      console.error("Error fetching notices:", error);
      Alert.alert("Error", "Error fetching notices");
    }
  };

  const fetchTodayLectures = async () => {
    try {
      // Get today's day (e.g., "Monday", "Tuesday", etc.)
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const today = new Date().getDay();
      const todayDay = days[today]; // Convert day number to day name

      console.log("Today's day:", todayDay); // Debugging

      // Fetch the logged-in teacher's details
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const teacherName = userData.name; // Fetch teacher's name from the `users` collection

        console.log("Teacher name:", teacherName); // Debugging

        const teacherInfoRef = doc(db, "teachersinfo", auth.currentUser.uid);
        const teacherInfoSnap = await getDoc(teacherInfoRef);

        if (teacherInfoSnap.exists()) {
          const teacherData = teacherInfoSnap.data();
          const department = teacherData.department;

          if (!department) {
            console.error("Department is missing in teacher data.");
            Alert.alert("Error", "Department is missing in teacher data.");
            return;
          }

          console.log("Teacher department:", department); // Debugging

          const timetableRef = collection(db, "timetable");
          const departmentDocRef = doc(timetableRef, department);
          const thirdYearRef = collection(departmentDocRef, "Third Year");
          const todayTimetableRef = doc(thirdYearRef, todayDay);

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

            // Set the number of today's lectures
            setTodayLecturesCount(teacherLectures.length);
          } else {
            console.log("No timetable found for today.");
            setTodayLecturesCount(0);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserDetails();
    await fetchNotices();
    await fetchTodayLectures();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Welcome, {user ? user.name : "User"}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("TeacherProfile")}>
          <MaterialIcons name="person" size={29} color="#2E86C1" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Notices Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notices</Text>
          <View style={styles.card}>
            {notices.map((notice) => (
              <TouchableOpacity
                key={notice.id}
                style={styles.noticeItem}
                onPress={() => navigation.navigate("NoticeDetail", { notice })}
              >
                <Text style={styles.cardTitle}>{notice.title}</Text>
                <Text style={styles.cardDate}>
                  {new Date(notice.date).toLocaleString()}
                </Text>
                <View style={styles.divider} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Lecture</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("TodaysLectures")}
          >
            <View style={styles.card}>
              <Text style={styles.cardText}>
                Number of Lectures: {todayLecturesCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AttendanceScreen")}
          >
            <View style={styles.card}>
              <Text style={styles.cardText}>View Attendance</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("TeachersNotes")}
          >
            <View style={styles.card}>
              <Text style={styles.cardText}>View Notes</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* New Quick Links Section for Assignments and Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => navigation.navigate("AssignmentsScreen")}
              style={styles.quickLink}
            >
              <MaterialIcons name="assignment" size={20} color="#2E86C1" />
              <Text style={styles.quickLinkText}>Assignments</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              onPress={() => navigation.navigate("NotesScreen")}
              style={styles.quickLink}
            >
              <MaterialIcons name="note" size={20} color="#2E86C1" />
              <Text style={styles.quickLinkText}>Notes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hello</Text>
          <TouchableOpacity onPress={() => navigation.navigate("/")}>
            <View style={styles.card}>
              <Text style={styles.cardText}>tesing</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Updated Floating Menu (removed Assignments and Notes) */}
      <View style={styles.floatingMenu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("NoticePage")}
        >
          <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Teacherslot")}
        >
          <MaterialIcons name="schedule" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("CreateNoticeScreen")}
        >
          <MaterialIcons name="create" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("ViewTimeTable")}
        >
          <MaterialIcons name="calendar-today" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("SettingsScreen")}
        >
          <MaterialIcons name="settings" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
  scrollContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2E86C1",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noticeItem: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  cardDate: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  cardText: {
    fontSize: 16,
    color: "#2C3E50",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7E9",
    marginVertical: 8,
  },
  floatingMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#2E86C1",
    borderRadius: 25,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuButton: {
    padding: 10,
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  quickLinkText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 10,
  },
});

export default TeacherHomeScreen;
