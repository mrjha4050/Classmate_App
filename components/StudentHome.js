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
} from "react-native";
import { db } from "../config";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

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
          studentId: studentId,
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
      assignmentsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by timestamp
      setAssignments(assignmentsList.slice(0, 1)); // Limit to 1 for display
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
      style={styles.assignmentCard}
      onPress={() => navigation.navigate("StudentsAssignments")}  
    >
      <View style={styles.assignmentTextContainer}>
        <Text style={styles.assignmentSubject}>{item.subject}</Text>
        <Text style={styles.assignmentDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <MaterialIcons name="assignment" size={24} color="#FE8441" />
    </TouchableOpacity>
  );

  const renderEmptyAssignment = () => (
    <View style={styles.assignmentCard}>
      <Text style={styles.cardText}>No assignments available</Text>
      <MaterialIcons name="assignment" size={24} color="#FE8441" />
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.headerContainer}>
        <MaterialIcons name="school" size={28} color="black" />
        <Text style={styles.header}>{user ? user.name : "Loading..."}</Text>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate("ProfileScreen")}
        >
          <MaterialIcons name="person" size={29} color="black" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>
        {user
          ? `Class - ${user.course || "N/A"} || Roll No - ${
              user.rollNumber || "N/A"
            }`
          : "Fetching details..."}
      </Text>

      <View style={styles.section1}>
        <Text style={styles.sectionTitle1}>Lectures</Text>
        {notices.map((notice) => (
          <TouchableOpacity
            key={notice.id}
            style={styles.card}
            onPress={() => navigation.navigate("NoticeDetail", { notice })}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{notice.title}</Text>
              <Text style={styles.cardDate}>
                {new Date(notice.date).toLocaleString()}
              </Text>
            </View>
            <MaterialIcons name="event" size={24} color="black" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section2}>
        <Text style={styles.sectionTitle}>Explore Dashboard</Text>
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLinkButton}
            onPress={() => navigation.navigate("NoticePage")}
          >
            <Text style={styles.quickLinkText}>NoticePage</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLinkButton}
            onPress={() => navigation.navigate("ViewTimeTable")}
          >
            <Text style={styles.quickLinkText}>TimeTable</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLinkButton}
            onPress={() => navigation.navigate("AttendanceScreen")}
          >
            <Text style={styles.quickLinkText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLinkButton}
            onPress={() => navigation.navigate("TeachersNotes")}
          >
            <Text style={styles.quickLinkText}>Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.section3}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
  },
  section1: {
    marginVertical: 10,
    marginHorizontal: 10,
    paddingHorizontal: 8,
    backgroundColor: "#FE8441",
    borderRadius: 16,
  },
  section2: {
    marginVertical: 10,
    marginHorizontal: 10,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  section3: {
    marginVertical: 10,
    marginHorizontal: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#FEF0E6", // Light orange background for consistency
  },
  sectionTitle: {
    fontSize: 20,
    marginVertical: 10,
  },
  sectionTitle1: {
    color: "white",
    fontSize: 20,
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#FE8441", // Orange accent
  },
  cardText: {
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  assignmentTextContainer: {
    flex: 1,
  },
  assignmentSubject: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  assignmentDescription: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  quickLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickLinkButton: {
    backgroundColor: "#FBEEE6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "48%",
    alignItems: "center",
  },
  quickLinkText: {
    color: "#FF945B",
    fontSize: 16,
  },
  assignmentList: {
    paddingBottom: 20,
  },
});

export default HomeScreen;