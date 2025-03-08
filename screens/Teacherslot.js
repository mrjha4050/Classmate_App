import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { db } from "../config";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { format, addDays, parseISO } from "date-fns";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { YEARS, COURSES } from "../components/constant";

const Teacherslot = ({ navigation }) => {
  const [teachers, setTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);  
  const [selectedCourse, setSelectedCourse] = useState("Bsc.IT");
  const [selectedYear, setSelectedYear] = useState("Third Year");
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(format(new Date(), "EEEE"));
  const [loading, setLoading] = useState(false);
  const [daysWithData, setDaysWithData] = useState(new Set()); // Track days with timetable data

  const excludedTeachers = ["Jaymala", "Anshika"];

  const generateDays = () => {
    const today = new Date();
    const nextDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(today, i);
      nextDays.push({
        date: format(currentDay, "yyyy-MM-dd"),
        day: format(currentDay, "EEEE"),
      });
    }
    return nextDays;
  };

  const fetchAllTeachers = async () => {
    try {
      // Assuming teachers are stored in `teachersinfo` with a field `department` matching the course
      const teachersRef = collection(db, "teachersinfo");
      const teachersSnap = await getDocs(teachersRef);
      const teacherList = [];
      teachersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.department === selectedCourse && !excludedTeachers.includes(data.name)) {
          teacherList.push({ name: data.name });
        }
      });
      console.log("All teachers for", selectedCourse, ":", teacherList);
      setAllTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching all teachers:", error);
      Alert.alert("Error", "Failed to fetch teachers list.");
    }
  };

  const fetchAllLecturesForDay = async (selectedDay) => {
    try {
      const path = `timetable/${selectedCourse}/${selectedYear}/${selectedDay}`;
      console.log("Fetching lectures from path:", path);
      const dayDocRef = doc(db, path);
      const docSnap = await getDoc(dayDocRef);

      if (docSnap.exists()) {
        const lectures = docSnap.data().lectures || [];
        console.log("Fetched lectures:", lectures);
        return lectures;
      }
      console.log("No document found at path:", path);
      return [];
    } catch (error) {
      console.error("Error fetching lectures:", error, "Path:", path);
      Alert.alert("Error", `Failed to fetch teacher availability: ${error.message}`);
      return [];
    }
  };

  const checkDaysWithData = async () => {
    const daysSet = new Set();
    const generatedDays = generateDays();
    for (const day of generatedDays) {
      const path = `timetable/${selectedCourse}/${selectedYear}/${day.day}`;
      const dayDocRef = doc(db, path);
      const docSnap = await getDoc(dayDocRef);
      if (docSnap.exists()) {
        daysSet.add(day.day);
      }
    }
    setDaysWithData(daysSet);
  };

  const determineTeacherFreeSlots = (lectures, startHour = 7, endHour = 14) => {
    // Initialize slots for all teachers as free
    const teacherSlots = {};
    allTeachers.forEach((teacher) => {
      teacherSlots[teacher.name] = Array.from({ length: endHour - startHour }, () => true);
    });

    // Mark slots as occupied based on lectures
    lectures.forEach((lecture) => {
      const { teacher, timeSlot } = lecture;

      if (!teacher || excludedTeachers.includes(teacher)) {
        return;
      }

      const [start, end] = timeSlot.includes(" to ")
        ? timeSlot.split(" to ")
        : timeSlot.split(" - ");
      const startTimeStr = start.replace(".", ":");
      const endTimeStr = end.replace(".", ":");
      const startTime = parseInt(startTimeStr.split(":")[0]);
      const endTime = parseInt(endTimeStr.split(":")[0]);

      if (teacherSlots[teacher]) {
        for (let hour = startTime; hour < endTime; hour++) {
          if (hour - startHour >= 0 && hour - startHour < endHour - startHour) {
            teacherSlots[teacher][hour - startHour] = false;
          }
        }
      }
    });

    const freeSlots = {};
    Object.keys(teacherSlots).forEach((teacher) => {
      freeSlots[teacher] = teacherSlots[teacher]
        .map((isFree, index) => {
          if (isFree) {
            return `${index + startHour}:00 - ${index + startHour + 1}:00`;
          }
          return null;
        })
        .filter((slot) => slot !== null);
    });

    return freeSlots;
  };

  const fetchTeacherAvailability = useCallback(async (day) => {
    setLoading(true);
    const lectures = await fetchAllLecturesForDay(day);
    const teacherFreeSlots = determineTeacherFreeSlots(lectures);
    const teacherData = Object.entries(teacherFreeSlots)
      .map(([teacher, freeSlots]) => ({ teacher, freeSlots }))
      .filter((item) => item.freeSlots.length > 0)
      .sort((a, b) => a.teacher.localeCompare(b.teacher)); // Sort alphabetically
    setTeachers(teacherData);
    setLoading(false);
  }, [selectedCourse, selectedYear, allTeachers]);

  useEffect(() => {
    const generatedDays = generateDays();
    setDays(generatedDays);

    const todayDay = format(new Date(), "EEEE");
    const isValidDay = generatedDays.some((d) => d.day === todayDay);
    setSelectedDay(isValidDay ? todayDay : generatedDays[0].day);

    fetchAllTeachers();
    checkDaysWithData();
  }, [selectedCourse, selectedYear]);

  useEffect(() => {
    if (allTeachers.length > 0) {
      fetchTeacherAvailability(selectedDay);
    }
  }, [selectedDay, allTeachers, fetchTeacherAvailability]);

  const handleDaySelection = (day) => {
    setSelectedDay(day);
  };

  const renderTeacherInfo = ({ item }) => (
    <View style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        <MaterialIcons name="person" size={24} color="#2E86C1" />
        <Text style={styles.teacherName}>{item.teacher}</Text>
      </View>
      <Text style={styles.freeSlotsTitle}>Free Slots:</Text>
      {item.freeSlots.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {item.freeSlots.map((slot, index) => (
            <View key={index} style={styles.slotBlock}>
              <Text style={styles.slotText}>{slot}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noSlotsText}>No free slots available.</Text>
      )}
    </View>
  );

  const renderDayItem = ({ item }) => {
    if (!item || !item.day || !item.date) return null;
    const isSelected = item.day === selectedDay;
    const hasData = daysWithData.has(item.day);
    return (
      <TouchableOpacity
        onPress={() => handleDaySelection(item.day)}
        style={[styles.dayCard, isSelected && styles.selectedDayCard]}
      >
        {hasData && (
          <View style={styles.dataBadge}>
            <MaterialIcons name="schedule" size={12} color="#FFFFFF" />
          </View>
        )}
        <Text style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}>
          {format(parseISO(item.date), "MMM")}
        </Text>
        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
          {format(parseISO(item.date), "dd")}
        </Text>
        <Text style={[styles.daySubText, isSelected && styles.selectedDaySubText]}>
          {item.day}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2E86C1" />
        </TouchableOpacity>
        <Text style={styles.header}>Teacherslot</Text>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Teacher Availability</Text>

            {/* Course and Year Filters */}
            <View style={styles.filterContainer}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCourse}
                  onValueChange={(itemValue) => {
                    setSelectedCourse(itemValue);
                    fetchAllTeachers();
                    checkDaysWithData();
                  }}
                  style={styles.picker}
                >
                  {COURSES.map((course, index) => (
                    <Picker.Item key={index} label={course} value={course} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedYear}
                  onValueChange={(itemValue) => {
                    setSelectedYear(itemValue);
                    fetchAllTeachers();
                    checkDaysWithData();
                  }}
                  style={styles.picker}
                >
                  {["First Year", "Second Year", "Third Year"].map((year, index) => (
                    <Picker.Item key={index} label={year} value={year} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Day Selector */}
            <FlatList
              data={days}
              renderItem={renderDayItem}
              keyExtractor={(item) => item.date}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelector}
            />
          </>
        }
        data={teachers}
        keyExtractor={(item) => item.teacher}
        renderItem={renderTeacherInfo}
        contentContainerStyle={styles.teacherList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No teachers available on {selectedDay}.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => handleDaySelection("Friday")}
            >
              <Text style={styles.retryButtonText}>Try Friday</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E86C1" />
            </View>
          ) : null
        }
      />
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
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7E9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    flex: 1,
    textAlign: "center",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 20,
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7E9",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#2C3E50",
  },
  daySelector: {
    paddingVertical: 10,
  },
  dayCard: {
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7E9",
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  selectedDayCard: {
    backgroundColor: "#2E86C1",
    borderColor: "#2E86C1",
    borderWidth: 2,
  },
  dataBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#28a745",
    borderRadius: 10,
    padding: 3,
  },
  dayLabel: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  selectedDayLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dayText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  selectedDayText: {
    color: "#FFFFFF",
  },
  daySubText: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  selectedDaySubText: {
    color: "#FFFFFF",
  },
  teacherList: {
    paddingBottom: 20,
  },
  teacherCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teacherHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 10,
  },
  freeSlotsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 8,
  },
  slotBlock: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#BBDEFB",
    justifyContent: "center",
    alignItems: "center",
  },
  slotText: {
    fontSize: 14,
    color: "#2E86C1",
    fontWeight: "500",
  },
  noSlotsText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#2E86C1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Teacherslot;