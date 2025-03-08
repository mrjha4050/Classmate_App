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
  Image,
} from "react-native";
import { db } from "../config";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
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
  const [recentActivity, setRecentActivity] = useState([]); // New state for recent activity
  const auth = getAuth();

  useEffect(() => {
    fetchUserDetails();
    fetchNotices();
    fetchTodayLectures();
    fetchRecentActivity(); // Fetch recent activity
  }, []);

  const fetchUserDetails = async () => {
    try {
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

      const sortedNotices = noticesList.sort((a, b) => new Date(b.date) - new Date(a.date));
      const recentNotices = sortedNotices.slice(0, 3);
      setNotices(recentNotices);
    } catch (error) {
      console.error("Error fetching notices:", error);
      Alert.alert("Error", "Error fetching notices");
    }
  };

  const fetchTodayLectures = async () => {
    try {
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
      const todayDay = days[today];

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const teacherName = userData.name;

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

          const timetableRef = collection(db, "timetable");
          const departmentDocRef = doc(timetableRef, department);
          const thirdYearRef = collection(departmentDocRef, "Third Year");
          const todayTimetableRef = doc(thirdYearRef, todayDay);

          const timetableSnapshot = await getDoc(todayTimetableRef);

          if (timetableSnapshot.exists()) {
            const lectures = timetableSnapshot.data().lectures || [];
            const teacherLectures = lectures.filter(
              (lecture) => lecture.teacher === teacherName
            );
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

  const fetchRecentActivity = async () => {
    // Mock implementation for recent activity (replace with actual Firestore query)
    try {
      // Example: Fetch recent actions like notices posted or attendance marked
      const mockActivities = [
        { id: "1", action: "Posted a notice", timestamp: "Today, 10:30 AM" },
        { id: "2", action: "Marked attendance for Bsc.IT", timestamp: "Yesterday, 2:15 PM" },
      ];
      setRecentActivity(mockActivities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      Alert.alert("Error", "Error fetching recent activity");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserDetails();
    await fetchNotices();
    await fetchTodayLectures();
    await fetchRecentActivity();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerProfile}>
          {/* Placeholder for user avatar */}
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={30} color="#fff" />
          </View>
          <Text style={styles.header}>
            Welcome, {user ? user.name : "Teacher"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("TeacherProfile")}>
          <MaterialIcons name="settings" size={24} color="#2E86C1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today’s Lectures Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Lectures</Text>
          <TouchableOpacity onPress={() => navigation.navigate("TodaysLectures")}>
            <View style={[styles.card, styles.lectureCard]}>
              <MaterialIcons name="school" size={28} color="#2E86C1" />
              <View style={styles.lectureCardContent}>
                <Text style={styles.cardTitle}>Lecture Schedule</Text>
                <Text style={styles.cardText}>
                  Number of Lectures: {todayLecturesCount}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notices Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notices</Text>
          <View style={styles.card}>
            {notices.length > 0 ? (
              notices.map((notice) => (
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
              ))
            ) : (
              <Text style={styles.noDataText}>No recent notices available.</Text>
            )}
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.card}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <Text style={styles.cardText}>{activity.action}</Text>
                  <Text style={styles.cardDate}>{activity.timestamp}</Text>
                  <View style={styles.divider} />
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No recent activity available.</Text>
            )}
          </View>
        </View>

        {/* Attendance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AttendanceScreen")}>
            <View style={[styles.card, styles.actionCard]}>
              <MaterialIcons name="check-circle" size={24} color="#2E86C1" />
              <Text style={styles.cardText}>Mark/View Attendance</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TouchableOpacity onPress={() => navigation.navigate("TeachersNotes")}>
            <View style={[styles.card, styles.actionCard]}>
              <MaterialIcons name="note" size={24} color="#2E86C1" />
              <Text style={styles.cardText}>View Notes</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Assignments")}
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
      </ScrollView>

      {/* Floating Action Menu */}
      <View style={styles.floatingMenu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("NoticePage")}
        >
          <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
          <Text style={styles.menuButtonText}>Notices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Teacherslot")}
        >
          <MaterialIcons name="schedule" size={24} color="#FFFFFF" />
          <Text style={styles.menuButtonText}>Slots</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("AttendanceScreen")}
        >
          <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
          <Text style={styles.menuButtonText}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("CreateNoticeScreen")}
        >
          <MaterialIcons name="create" size={24} color="#FFFFFF" />
          <Text style={styles.menuButtonText}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("ViewTimeTable")}
        >
          <MaterialIcons name="calendar-today" size={24} color="#FFFFFF" />
          <Text style={styles.menuButtonText}>Timetable</Text>
        </TouchableOpacity>
      </View>
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
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2E86C1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2E86C1",
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2E86C1",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lectureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#E3F2FD", // Light blue background for emphasis
  },
  lectureCardContent: {
    marginLeft: 15,
    flex: 1,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  noticeItem: {
    marginBottom: 12,
  },
  activityItem: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  cardText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 10,
  },
  cardDate: {
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7E9",
    marginVertical: 8,
  },
  noDataText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
  },
  floatingMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#2E86C1",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  menuButton: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  menuButtonText: {
    fontSize: 10,
    color: "#FFFFFF",
    marginTop: 4,
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