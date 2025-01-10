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
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import * as Notifications from "expo-notifications";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const TeacherHomeScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    fetchUserDetails();
    fetchNotices();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUser(userDocSnap.data());
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
      setNotices(noticesList.slice(0, 2));
    } catch (error) {
      console.error("Error fetching notices:", error);
      Alert.alert("Error", "Error fetching notices");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserDetails();
    await fetchNotices();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <MaterialIcons name="school" size={28} color="black" />
        <Text style={styles.header}>{user ? user.name : "Loading..."}</Text>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate("TeacherProfile")}
        >
          <MaterialIcons name="person" size={29} color="black" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>
        {user ? `Course:-${user.department || "BSCIT"}` : "Fetching details..."}
      </Text>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
              onPress={() => navigation.navigate("Teacherslot")}
            >
              <Text style={styles.quickLinkText}>Teacher's Slot</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate("CreateNoticeScreen")}
            >
              <Text style={styles.quickLinkText}>Create Notice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate("ViewTimeTable")}
            >
              <Text style={styles.quickLinkText}>Timetable</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate("AttendanceScreen")}
            >
              <Text style={styles.quickLinkText}>Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate("CreateTimetableScreen")}
            >
              <Text style={styles.quickLinkText}>Create Timetable</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section3}>
          <Text style={styles.sectionTitle}>Updated Info</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>Enterprise Java</Text>
            <Text style={styles.cardText}>3 new assignments</Text>
            <MaterialIcons name="assignment" size={24} color="black" />
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: "#007bff",
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
    borderRadius: 3,
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
    color: "#007bff",
    fontSize: 16,
  },
});

export default TeacherHomeScreen;