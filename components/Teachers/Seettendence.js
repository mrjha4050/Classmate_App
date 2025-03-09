import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config";
import { useNavigation } from "@react-navigation/native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { COURSES } from "../constant";

const SeeAttendance = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState("All");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overallAttendanceByStudent, setOverallAttendanceByStudent] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  const navigation = useNavigation();
  const { width: screenWidth } = Dimensions.get("window");

  const years = ["First Year", "Second Year", "Third Year"];
  const courses = ["Bsc.IT", "B.COM", "BMS", "BFM"];

  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true);
    setAttendanceRecords([]);
    setOverallAttendanceByStudent({});

    try {
      const attendanceRef = collection(db, "studentAttendance");
      const querySnapshot = await getDocs(attendanceRef);

      const allRecords = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.attendance) {
          data.attendance.forEach((record) => {
            if (
              (selectedYears.length === 0 || selectedYears.includes(record.year)) &&
              (selectedCourses.length === 0 || selectedCourses.includes(record.course))
            ) {
              allRecords.push(record);
            }
          });
        }
      });

      setAttendanceRecords(allRecords);

      // Calculate student-wise attendance stats
      const studentStats = {};
      allRecords.forEach((record) => {
        const studentName = record.name ? record.name.trim().toLowerCase() : "unknown";
        if (!studentStats[studentName]) {
          studentStats[studentName] = { present: 0, total: 0 };
        }
        studentStats[studentName].total += 1;
        if (record.status === "P") studentStats[studentName].present += 1;
      });

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
      Alert.alert("Error", "Failed to fetch attendance records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYears, selectedCourses]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData, selectedYears, selectedCourses]);

  const filteredRecords = searchQuery.trim()
    ? attendanceRecords.filter(
        (record) =>
          (record.name ? record.name.trim().toLowerCase() : "unknown") ===
          searchQuery.trim().toLowerCase()
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

  const filteredStudents =
    filterOption === "Defaulters"
      ? Object.entries(overallAttendanceByStudent).filter(
          ([, { percentage }]) => percentage < 40
        )
      : Object.entries(overallAttendanceByStudent);

  // Responsive chart data
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
      population: overallStats.present,
      color: "#75C9C9",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Absent",
      population: overallStats.total - overallStats.present,
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

  const toggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const toggleCourse = (course) => {
    setSelectedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
  };

  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Filter by Year:</Text>
          <View style={styles.filterOptions}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.filterButton,
                  selectedYears.includes(year) && styles.selectedFilterButton,
                ]}
                onPress={() => toggleYear(year)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedYears.includes(year) && styles.selectedFilterText,
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Filter by Course:</Text>
          <View style={styles.filterOptions}>
            {courses.map((course) => (
              <TouchableOpacity
                key={course}
                style={[
                  styles.filterButton,
                  selectedCourses.includes(course) && styles.selectedFilterButton,
                ]}
                onPress={() => toggleCourse(course)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedCourses.includes(course) && styles.selectedFilterText,
                  ]}
                >
                  {course}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86C1" />
        </View>
      ) : searchQuery.trim() ? (
        attendanceRecords.length > 0 && filteredRecords.length > 0 ? (
          <View style={styles.attendanceCard}>
            <Text style={styles.sectionTitle}>Attendance for {searchQuery}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.overallStats}>
                Overall:{" "}
                {overallStats.total > 0
                  ? Math.round((overallStats.present / overallStats.total) * 100)
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
              No attendance records found for {searchQuery}.
            </Text>
          </View>
        )
      ) : (
        <View style={styles.attendanceCard}>
          <Text style={styles.sectionTitle}>
            {filterOption === "Defaulters" ? "Defaulters List" : "All Students Attendance"}
          </Text>
          <FlatList
            data={filteredStudents}
            keyExtractor={([name]) => name}
            renderItem={({ item: [name, { percentage, present, total }] }) => (
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
            nestedScrollEnabled
          />
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
              Attendance Charts for {searchQuery || "All Students"}
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
    backgroundColor: "#28a745",
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
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterLabel: {
    fontSize: 16,
    color: "#333",
    marginRight: 10,
  },
  filterButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    minWidth: 80,
  },
  selectedFilterButton: {
    backgroundColor: "#2E86C1",
    borderColor: "#2E86C1",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  selectedFilterText: {
    color: "#fff",
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

export default SeeAttendance;