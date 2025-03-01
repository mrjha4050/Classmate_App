import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config"; // Import Firestore instance
import { Dimensions } from "react-native"; // For screen dimensions
import { useNavigation } from "@react-navigation/native"; // For navigation
import {
  VictoryBar,
  VictoryPie,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from "victory-native";

import { COURSES } from "../constant";
const SeeAttendance = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState("All"); // State to toggle between "All" and "Defaulters"
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overallAttendanceByStudent, setOverallAttendanceByStudent] = useState(
    {}
  );
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  const navigation = useNavigation(); // Use navigation hook
  const screenWidth = Dimensions.get("window").width; // Get screen width for charts

  // Fetch attendance data from Firestore
  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true);
    setAttendanceRecords([]);
    setOverallAttendanceByStudent({});

    try {
      const attendanceRef = collection(db, "studentAttendance");
      const querySnapshot = await getDocs(attendanceRef);

      const allRecords = [];
      const studentStats = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.attendance) {
          data.attendance.forEach((record) => {
            allRecords.push(record);
            const studentName = record.name.trim().toLowerCase();
            if (!studentStats[studentName]) {
              studentStats[studentName] = { present: 0, total: 0 };
            }
            studentStats[studentName].total += 1;
            if (record.status === "P") studentStats[studentName].present += 1;
          });
        }
      });

      setAttendanceRecords(allRecords);
      setOverallAttendanceByStudent(
        Object.fromEntries(
          Object.entries(studentStats).map(([name, { present, total }]) => [
            name,
            {
              percentage: total > 0 ? Math.round((present / total) * 100) : 0,
              present,
              total,
            },
          ])
        )
      );
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      Alert.alert(
        "Error",
        "Failed to fetch attendance records. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const filteredRecords = searchQuery.trim()
    ? attendanceRecords.filter(
        (record) =>
          record.name.trim().toLowerCase() === searchQuery.trim().toLowerCase()
      )
    : [];

  const groupedBySubject = filteredRecords.reduce((subjects, record) => {
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

  const overallStats = filteredRecords.reduce(
    (stats, record) => {
      stats.total += 1;
      if (record.status === "P") stats.present += 1;
      return stats;
    },
    { present: 0, total: 0 }
  );

  // Filter students based on the filterOption
  const filteredStudents =
    filterOption === "Defaulters"
      ? Object.entries(overallAttendanceByStudent).filter(
          ([, { percentage }]) => percentage < 40 // Show students with less than 40% attendance
        )
      : Object.entries(overallAttendanceByStudent); // Show all students

  // Chart data for subject-wise attendance (Bar Chart) with Victory
  const subjectChartData = Object.entries(groupedBySubject).map(
    ([subject, { present, total }]) => ({
      x: subject,
      y: total > 0 ? Math.round((present / total) * 100) : 0,
    })
  );

  // Chart data for overall attendance (Pie Chart) with Victory
  const overallChartData = [
    { x: "Present", y: overallStats.present },
    { x: "Absent", y: overallStats.total - overallStats.present },
  ];

  const chartConfig = {
    backgroundColor: "#fff",
    color: "#75C9C9", // Light blue for bars/pie slices
    labelColor: "#000", // Black for labels
  };

  const handleMarkAttendance = () => {
    navigation.navigate("AttendanceScreen"); // Navigate to AttendanceScreen
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header with Title and Mark Attendance Button */}
        <View style={styles.header}>
          <Text style={styles.title}>SEE ATTENDANCE</Text>
          <TouchableOpacity
            style={styles.markAttendanceButton}
            onPress={handleMarkAttendance}
          >
            <Text style={styles.markAttendanceButtonText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* Filter and Search Bar */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() =>
                setFilterOption(filterOption === "All" ? "Defaulters" : "All")
              }
            >
              <Text style={styles.filterButtonText}>
                {filterOption === "All" ? "All" : "Defaulters"}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Enter student name"
              keyboardType="default"
            />
          </View>
        </View>

        {/* Attendance Data */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E86C1" />
          </View>
        ) : searchQuery.trim() ? (
          attendanceRecords.length > 0 && filteredRecords.length > 0 ? (
            <View style={styles.attendanceCard}>
              <Text style={styles.sectionTitle}>
                Attendance for {searchQuery}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.overallStats}>
                  Overall:{" "}
                  {overallStats.total > 0
                    ? Math.round(
                        (overallStats.present / overallStats.total) * 100
                      )
                    : 0}
                  % ({overallStats.present}/{overallStats.total})
                </Text>
                <TouchableOpacity
                  style={styles.chartButton}
                  onPress={() => setIsModalOpen(true)}
                >
                  <Text style={styles.chartButtonText}>Show Charts</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={filteredRecords}
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
                />
              </View>
            </View>
          ) : (
            <View style={styles.noDataCard}>
              <Text style={styles.noDataText}>
                No attendance records found for {searchQuery}.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.attendanceCard}>
            <Text style={styles.sectionTitle}>
              {filterOption === "Defaulters"
                ? "Defaulters List"
                : "All Students Attendance"}
            </Text>
            <FlatList
              data={filteredStudents}
              keyExtractor={([name]) => name}
              renderItem={({
                item: [name, { percentage, present, total }],
              }) => (
                <View style={styles.studentRow}>
                  <Text style={styles.cell}>{name}</Text>
                  <Text style={styles.cell}>{percentage}%</Text>
                  <Text style={styles.cell}>{present}</Text>
                  <Text style={styles.cell}>{total}</Text>
                </View>
              )}
              ListHeaderComponent={
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCell}>Student Name</Text>
                  <Text style={styles.headerCell}>Overall %</Text>
                  <Text style={styles.headerCell}>Present</Text>
                  <Text style={styles.headerCell}>Total</Text>
                </View>
              }
              ListEmptyComponent={
                <Text style={styles.noDataText}>
                  {filterOption === "Defaulters"
                    ? "No defaulters found."
                    : "No attendance records available."}
                </Text>
              }
            />
          </View>
        )}

        {/* Modal for Charts */}
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Attendance Charts for {searchQuery || "All Students"}
              </Text>
              <View style={styles.chartsContainer}>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Subject-wise Attendance</Text>
                  <VictoryChart
                    width={screenWidth * 0.9}
                    height={200}
                    theme={VictoryTheme.material}
                  >
                    <VictoryAxis
                      dependentAxis
                      style={{
                        axis: { stroke: "#ccc" },
                        tickLabels: { fontSize: 10, fill: "#333" },
                      }}
                    />
                    <VictoryAxis
                      style={{
                        axis: { stroke: "#ccc" },
                        tickLabels: { fontSize: 10, fill: "#333", angle: -45 },
                      }}
                    />
                    <VictoryBar
                      data={subjectChartData}
                      x="x"
                      y="y"
                      style={{
                        data: {
                          fill: "#75C9C9",
                          width: 20,
                        },
                        labels: { fontSize: 10, fill: "#333" },
                      }}
                    />
                  </VictoryChart>
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Overall Attendance</Text>
                  <VictoryPie
                    width={screenWidth * 0.9}
                    height={200}
                    data={overallChartData}
                    x="x"
                    y="y"
                    colorScale={["#75C9C9", "#FF6384"]}
                    style={{
                      labels: { fontSize: 10, fill: "#333" },
                    }}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E86C1",
  },
  markAttendanceButton: {
    backgroundColor: "#28a745", // Green button to match attendance theme
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  markAttendanceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  filterButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  filterButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 16,
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
  studentRow: {
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
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  closeModalButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SeeAttendance;
