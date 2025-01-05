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
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import * as Notifications from "expo-notifications";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const TeacherHomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState("");
  const auth = getAuth();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );
    fetchUserAndTeacherDetails();
    fetchNotices();
  }, []);

  const fetchUserAndTeacherDetails = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const teacherId = auth.currentUser.uid;
        const teacherDocRef = doc(db, "teachersinfo", teacherId);
        const teacherDocSnap = await getDoc(teacherDocRef);

        if (teacherDocSnap.exists()) {
          const teacherDetails = teacherDocSnap.data();
          setUser({
            ...userDocSnap.data(),
            department: teacherDetails.department,
            subjects: teacherDetails.subjects,
          });
          await setDoc(teacherDocRef, {
            expoPushToken: expoPushToken,
            ...teacherDetails,
          });

          await checkAttendance(teacherId);
        } else {
          Alert.alert("Error", "Teacher details not found!");
        }
      } else {
        Alert.alert("Error", "No such user!");
      }
    } catch (error) {
      console.error("Error fetching user and teacher data:", error);
      Alert.alert("Error", "Error fetching user and teacher data");
    }
  };

  const checkAttendance = async (teacherId) => {
    const today = getCurrentDate();
    const attendanceRef = doc(db, "TeacherAttendance", teacherId);
    const attendanceSnap = await getDoc(attendanceRef);

    if (!attendanceSnap.exists() || attendanceSnap.data().date !== today) {
      promptAttendance(teacherId, today);
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  };

  const promptAttendance = (teacherId, today) => {
    Alert.alert(
      "Attendance",
      "Are you present or absent today?",
      [
        {
          text: "Present",
          onPress: () => markAttendance(teacherId, today, "present"),
        },
        {
          text: "Absent",
          onPress: () => markAttendance(teacherId, today, "absent"),
        },
      ],
      { cancelable: false }
    );
  };

  const markAttendance = async (teacherId, date, status) => {
    try {
      await setDoc(doc(db, "TeacherAttendance", teacherId), {
        date: date,
        status: status,
      });

      if (status === "absent") {
        sendAbsentNotification();
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      Alert.alert("Error", "Error marking attendance");
    }
  };

  const sendAbsentNotification = async () => {
    try {
      const teachersSnapshot = await getDocs(collection(db, "teachersinfo"));
      const tokens = teachersSnapshot.docs
        .map((doc) => doc.data().expoPushToken)
        .filter((token) => token !== expoPushToken);

      tokens.forEach(async (token) => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Teacher Absent",
            body: `${user?.name} is absent today.`,
            data: { someData: "data" },
          },
          trigger: { seconds: 1 },
        });
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      Alert.alert("Error", "Error sending absence notification");
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
      noticesList.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date
      setNotices(noticesList.slice(0, 2));
    } catch (error) {
      console.error("Error fetching notices:", error);
      Alert.alert("Error", "Error fetching notices");
    }
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserAndTeacherDetails();
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
          <Text style={styles.avatarText}>
            <MaterialIcons
              name="person"
              size={29}
              color="black"
              style={styles.bellIcon}
            />
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>
        {user ? `Course:-${user.department}` : "Fetching details..."}
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
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.navigate("NoticePage");
              }}
            >
              <Text style={styles.quickLinkText}>NoticePage</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.navigate("Teacherslot");
              }}
            >
              <Text style={styles.quickLinkText}>Teacher's Slot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.navigate("CreateNoticeScreen");
              }}
            >
              <Text style={styles.quickLinkText}>Create Notice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.navigate("ViewTimeTable");
              }}
            >
              <Text style={styles.quickLinkText}> Timetable</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.navigate("AttendanceScreen");
              }}
            >
              <Text style={styles.quickLinkText}> Attendence</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.navigate("CreateTimetableScreen");
              }}
            >
              <Text style={styles.quickLinkText}> Create Timetable</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section3}>
          <Text style={styles.sectionTitle}>Updated Info</Text>
          <TouchableOpacity
            style={styles.quickLinkButton}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              navigation.navigate("AttendanceScreen");
            }}>
              <MaterialIcons name="assignment" size={24} color="black">+</MaterialIcons>
          </TouchableOpacity>
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
  container: {
    paddingHorizontal: 10,
    backgroundColor: "#fff",
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
  iconButton: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 2,
  },
  bellIcon: {
    // color: "orange",
    color: "#007bff",
  },
  usernameContainer: {
    flex: 1,
    alignItems: "center",
  },
  section1: {
    marginVertical: 10,
    marginHorizontal: 10,
    paddingHorizontal: 8,
    // backgroundColor: "#FE8441",  // Orange Colour
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
  cardText: {
    fontSize: 13,
    flex: 1,
    marginRight: 6,
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
    // color: "#FF945B",  // Orange Colour
    color :"#007bff",
    fontSize: 16,
  },
});

export default TeacherHomeScreen;
  