import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar
} from "react-native";
import { db } from "../config";
import { doc, getDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";

const Teacherslot = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Friday"); // Default to Friday as per your example

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const fetchTeacherSlots = async () => {
    try {
      setLoading(true);
      const teacherSlots = {};

      // Get lectures for the selected day
      const dayRef = doc(db, "timetable/Bsc.IT/Third Year", selectedDay);
      const daySnap = await getDoc(dayRef);

      if (daySnap.exists()) {
        const lectures = daySnap.data().lectures || [];
        
        // Organize lectures by teacher
        lectures.forEach(lecture => {
          if (!lecture.teacher) return;
          
          if (!teacherSlots[lecture.teacher]) {
            teacherSlots[lecture.teacher] = [];
          }
          teacherSlots[lecture.teacher].push(lecture.timeSlot);
        });
      }

      // Convert to array format for FlatList
      const teacherData = Object.keys(teacherSlots).map(teacher => ({
        name: teacher,
        slots: teacherSlots[teacher]
      }));

      setTeachers(teacherData);
    } catch (error) {
      console.error("Error fetching teacher slots:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeacherSlots();
  };

  useEffect(() => {
    fetchTeacherSlots();
  }, [selectedDay]);

  const renderTeacher = ({ item }) => (
    <View style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        <MaterialIcons name="person" size={24} color="#3b4cca" />
        <Text style={styles.teacherName}>{item.name}</Text>
      </View>
      
      <Text style={styles.slotsTitle}>Time Slots:</Text>
      {item.slots.length > 0 ? (
        <View style={styles.slotsContainer}>
          {item.slots.map((slot, index) => (
            <View key={index} style={styles.slotBlock}>
              <Text style={styles.slotText}>{slot}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noSlotsText}>No slots scheduled</Text>
      )}
    </View>
  );

  const renderDayButton = (day) => (
    <TouchableOpacity
      key={day}
      style={[
        styles.dayButton,
        selectedDay === day && styles.selectedDayButton
      ]}
      onPress={() => setSelectedDay(day)}
    >
      <Text style={[
        styles.dayButtonText,
        selectedDay === day && styles.selectedDayButtonText
      ]}>
        {day.substring(0, 3)}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b4cca" />
        <Text>Loading teacher schedules...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#3b4cca" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Teacher Schedules</Text>
          <Text style={styles.headerSubtitle}>{selectedDay}</Text>
        </View>

        {/* Day selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {daysOfWeek.map(renderDayButton)}
        </ScrollView>

        <FlatList
          data={teachers}
          renderItem={renderTeacher}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No teacher data available for {selectedDay}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3b4cca"]}
            />
          }
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 2,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#2E86C1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#f5f5f5',
  },
  daySelector: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#f5f5f5',
  },
  dayButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#e6e6e6",
  },
  selectedDayButton: {
    backgroundColor: "#3b4cca",
  },
  dayButtonText: {
    fontSize: 16,
    color: "#555",
    fontWeight: '500',
  },
  selectedDayButtonText: {
    color: "#FFFFFF",
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  teacherCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginBottom: 10,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotBlock: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#e9f0ff",
    borderWidth: 1,
    borderColor: "#d0d9ff",
  },
  slotText: {
    fontSize: 14,
    color: "#3b4cca",
    fontWeight: "500",
  },
  noSlotsText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default Teacherslot;