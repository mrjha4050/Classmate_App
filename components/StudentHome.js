import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { db } from "../config";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const auth = getAuth();

  const fetchUserAndStudentDetails = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        Alert.alert("Error", "No such user!");
        return;
      }

      const userName = userDocSnap.data().name;
      const userId = userDocSnap.id;

      const studentId = userDocSnap.data().studentId || auth.currentUser.uid;
      const studentDocRef = doc(db, "students", studentId);
      const studentDocSnap = await getDoc(studentDocRef);

      if (studentDocSnap.exists()) {
        const studentDetails = studentDocSnap.data();
        setUser({
          name: userName,
          userId: userId,
          rollNumber: studentDetails.rollNo,
          course: studentDetails.course,
          year: studentDetails.year,
          division: studentDetails.division,
          phoneNumber: studentDetails.phonenumber,
          // userId: student.studentid,  
        });
      } else {
        setUser({
          name: userName,
          userId: userId,
        });
        Alert.alert("Warning", "Student details not found!");
      }
    } catch (error) {
      console.error("Error fetching user and student data:", error);
      Alert.alert("Error", "Error fetching data");
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
      noticesList.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotices(noticesList.slice(0, 3));
    } catch (error) {
      console.error("Error fetching notices:", error);
      Alert.alert("Error", "Error fetching notices");
    }
  };

  const fetchAssignments = async () => {
    try {
      const assignmentsCollection = collection(db, "assignments");
      const assignmentsSnapshot = await getDocs(assignmentsCollection);
      const assignmentsList = assignmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        subject: doc.data().subject,
        description: doc.data().description,
      }));
      assignmentsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAssignments(assignmentsList.slice(0, 1));
    } catch (error) {
      console.error("Error fetching assignments:", error);
      Alert.alert("Error", "Error fetching assignments");
    }
  };

  useEffect(() => {
    fetchUserAndStudentDetails();
    fetchNotices();
    fetchAssignments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserAndStudentDetails();
    await fetchNotices();
    await fetchAssignments();
    setRefreshing(false);
  };

  const renderAssignmentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("StudentsAssignments")}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="assignment" size={24} color="#FF6F61" />
          <Text style={styles.cardTitle}>{item.subject}</Text>
        </View>
        <Text style={styles.cardText} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyAssignment = () => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="assignment" size={24} color="#FF6F61" />
          <Text style={styles.cardTitle}>No Assignments</Text>
        </View>
        <Text style={styles.cardText}>No assignments available.</Text>
      </View>
    </View>
  );

  const quickLinks = [
    { name: "Notices", icon: "notifications", screen: "NoticePage" },
    { name: "Timetable", icon: "calendar-today", screen: "ViewTimeTable" },
    { name: "Attendance", icon: "check-circle", screen: "StudentAttendance" },
    { name: "Notes", icon: "note", screen: "TeachersNotes" },
  ];

  const renderQuickLink = ({ item }) => (
    <TouchableOpacity
      style={styles.quickLinkCard}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.8}
    >
      <MaterialIcons name={item.icon} size={28} color="#FF6F61" />
      <Text style={styles.quickLinkText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={[styles.headerContainer, { backgroundColor: "#FF6F61" }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>
              Hello, {user ? user.name : "Student"}
            </Text>
            <Text style={styles.subHeaderText}>
              {user
                ? `${user.course || "N/A"} | Roll No: ${user.rollNumber || "N/A"}`
                : "Fetching details..."}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <MaterialIcons name="person" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Notices</Text>
        {notices.length > 0 ? (
          notices.map((notice) => (
            <TouchableOpacity
              key={notice.id}
              style={styles.card}
              onPress={() => navigation.navigate("NoticePage", { notice })}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="event" size={24} color="#FF6F61" />
                  <Text style={styles.cardTitle}>{notice.title}</Text>
                </View>
                <Text style={styles.cardText} numberOfLines={2}>
                  {notice.date
                    ? new Date(notice.date).toLocaleString()
                    : "No date available"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>No recent notices available.</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Links Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore Dashboard</Text>
        <FlatList
          data={quickLinks}
          renderItem={renderQuickLink}
          keyExtractor={(item) => item.name}
          numColumns={2}
          columnWrapperStyle={styles.quickLinksRow}
        />
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Assignments</Text>
      <FlatList
        data={assignments}
        renderItem={renderAssignmentItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyAssignment}
        contentContainerStyle={styles.assignmentList}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6F61"]}
            tintColor="#FF6F61"
          />
        }
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 16,
    color: "#FFF",
    opacity: 0.9,
  },
  profileButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 50,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 10,
    flex: 1,
  },
  cardText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  quickLinksRow: {
    justifyContent: "space-between",
  },
  quickLinkCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    width: (width - 60) / 2, // Adjust width for 2 columns with spacing
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickLinkText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
    marginTop: 8,
  },
  assignmentList: {
    paddingBottom: 20,
  },
});

export default HomeScreen;
