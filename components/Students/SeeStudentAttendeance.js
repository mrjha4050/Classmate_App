import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../config";
import { BarChart, PieChart } from "react-native-chart-kit";
import { getAuth } from "firebase/auth";
import { AuthContext } from "../../AuthContext";

const SeestudentAttendence = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overallAttendance, setOverallAttendance] = useState({ present: 0, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  const { width: screenWidth } = Dimensions.get("window");
  const auth = getAuth();

  const fetchUserDetails = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const studentId = userData.studentId || auth.currentUser.uid;
        setUser({
          name: userData.name,
          studentId: studentId,
          userId: auth.currentUser.uid,  
        });
        console.log("Fetched User Details:", { name: userData.name, studentId, userId: auth.currentUser.uid });
      } else {
        Alert.alert("Error", "User details not found!");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      Alert.alert("Error", "Failed to fetch user details.");
    }
  };

  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true);
    setAttendanceRecords([]);
    setOverallAttendance({ present: 0, total: 0 });

    if (!user) {
      console.log("User not yet loaded");
      setIsLoading(false);
      return;
    }

    try {
      const attendanceRef = collection(db, "studentAttendance");
      const querySnapshot = await getDocs(attendanceRef);

      console.log("Logged-in User ID:", user.userId);

      const userRecords = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Checking Attendance Document:", data);

        if (data.attendance && Array.isArray(data.attendance)) {
          data.attendance.forEach((record) => {
            if (record.userId === user.userId) {
              userRecords.push({
                subject: record.subject,
                date: record.date,
                status: record.status,
                studentId: record.userId,
                name: record.name,
                rollNo: record.rollNo,
                course: record.course,
                year: record.year,
              });
            }
          });
        }
      });

      console.log("Fetched Records for User:", userRecords);
      setAttendanceRecords(userRecords);

      const overallStats = userRecords.reduce(
        (stats, record) => {
          stats.total += 1;
          if (record.status === "P") stats.present += 1;
          return stats;
        },
        { present: 0, total: 0 }
      );

      setOverallAttendance(overallStats);
      console.log("Overall Attendance:", overallStats);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      Alert.alert("Error", "Failed to fetch attendance records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAttendanceData();
    }
  }, [fetchAttendanceData, user]);

  const groupedBySubject = attendanceRecords.reduce((subjects, record) => {
    const subject = subjects[record.subject] || {
      name: record.subject,
      present: 0,
      total: 0,
    };
    subject.total += 1;
    if (record.status === "P") subject.present += 1;
    subjects[record.subject] = subject;
    return subjects;
  }, {});

  const subjectChartData = {
    labels: Object.keys(groupedBySubject).map((label) =>
      label.length > 5 ? `${label.slice(0, 5)}...` : label
    ),
    datasets: [
      {
        data: Object.values(groupedBySubject).map(({ present, total }) =>
          total > 0 ? Math.round((present / total) * 100) : 0
        ),
      },
    ],
  };

  const pieChartData = [
    {
      name: "Present",
      population: overallAttendance.present,
      color: "#75C9C9",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Absent",
      population: overallAttendance.total - overallAttendance.present,
      color: "#FF6384",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 134, 193, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  const renderContent = () => (
    <View style={styles.content}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86C1" />
        </View>
      ) : attendanceRecords.length > 0 ? (
        <View style={styles.attendanceCard}>
          <Text style={styles.sectionTitle}>
            Attendance for {user ? user.name : "Unknown"}
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.overallStats}>
              Overall:{" "}
              {overallAttendance.total > 0
                ? Math.round((overallAttendance.present / overallAttendance.total) * 100)
                : 0}
              % ({overallAttendance.present}/{overallAttendance.total})
            </Text>
            <TouchableOpacity
              style={styles.chartButton}
              onPress={() => setIsModalOpen(true)}
            >
              <Text style={styles.chartButtonText}>Show Charts</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={attendanceRecords}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.recordRow}>
                <Text style={styles.cell}>{item.subject}</Text>
                <Text style={styles.cell}>{item.date}</Text>
                <Text style={styles.cell}>
                  {item.status === "P" ? "Present" : "Absent"}
                </Text>
              </View>
            )}
            ListHeaderComponent={
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Subject</Text>
                <Text style={styles.headerCell}>Date</Text>
                <Text style={styles.headerCell}>Status</Text>
              </View>
            }
            nestedScrollEnabled
          />
          <View style={styles.summarySection}>
            <Text style={styles.subSectionTitle}>Subject-wise Summary</Text>
            <FlatList
              data={Object.entries(groupedBySubject)}
              keyExtractor={([subject]) => subject}
              renderItem={({ item: [subject, { present, total }] }) => (
                <View style={styles.summaryRow}>
                  <Text style={styles.cell}>{subject}</Text>
                  <Text style={styles.cell}>
                    {Math.round((present / total) * 100)}%
                  </Text>
                  <Text style={styles.cell}>
                    {present}/{total}
                  </Text>
                </View>
              )}
              ListHeaderComponent={
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCell}>Subject</Text>
                  <Text style={styles.headerCell}>%</Text>
                  <Text style={styles.headerCell}>Present/Total</Text>
                </View>
              }
              nestedScrollEnabled
            />
          </View>
        </View>
      ) : (
        <View style={styles.noDataCard}>
          <Text style={styles.noDataText}>
            No attendance records found for {user ? user.name : "Unknown"}.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[{}]}
        renderItem={renderContent}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={false}
      />
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Attendance Charts for {user ? user.name : "Unknown"}
            </Text>
            <ScrollView style={styles.chartsScrollView}>
              <View style={styles.chartsContainer}>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Subject-wise Attendance</Text>
                  <BarChart
                    data={subjectChartData}
                    width={screenWidth * 0.8}
                    height={200}
                    yAxisLabel=""
                    yAxisSuffix="%"
                    chartConfig={chartConfig}
                    fromZero={true}
                    withInnerLines={false}
                    flatColor={true}
                    style={styles.chartStyle}
                    decorator={() => null}
                    withCustomBarColorFromData={true}
                    barPercentage={0.5}
                  />
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Overall Attendance</Text>
                  <PieChart
                    data={pieChartData}
                    width={screenWidth * 0.8}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                    style={styles.chartStyle}
                  />
                </View>
              </View>
            </ScrollView>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
    backgroundColor: "#fff",
  },
  attendanceCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  overallStats: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  chartButton: {
    backgroundColor: "#2E86C1",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  chartButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  summarySection: {
    marginTop: 16,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: {
    fontSize: 16,
    color: "#333",
    paddingHorizontal: 8,
    flex: 1,
    textAlign: "center",
  },
  headerCell: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    flex: 1,
    textAlign: "center",
  },
  noDataCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E86C1",
    marginBottom: 16,
  },
  chartsScrollView: {
    maxHeight: "60%",
  },
  chartsContainer: {
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },
  chartCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: "center",
    width: "100%",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  closeModalButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  closeModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SeestudentAttendence;