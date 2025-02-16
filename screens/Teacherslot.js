import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, ScrollView, TouchableOpacity } from "react-native";
import { db } from "../config";  
import { doc, getDoc } from "firebase/firestore";
import { format, addDays, parseISO } from "date-fns";
import { YEARS, COURSES } from "../components/constant";

const Teacherslot = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [selectedYear, setSelectedYear] = useState(YEARS[2]);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(format(new Date(), "EEEE"));

  const excludedTeachers = ["Jaymala", "Anshika"];

  useEffect(() => {
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

    setDays(generateDays());
    fetchTeacherAvailability(generateDays()[0].day);
  }, [selectedCourse, selectedYear]);

  const fetchAllLecturesForDay = async (selectedDay) => {
    const path = `timetable/${selectedCourse}/${selectedYear}/${selectedDay}`;
    const dayDocRef = doc(db, path);
    const docSnap = await getDoc(dayDocRef);

    if (docSnap.exists()) {
      return docSnap.data().lectures || [];
    }
    return [];
  };

  const determineTeacherFreeSlots = (lectures, startHour = 7, endHour = 14) => {
    const teacherSlots = {};

    lectures.forEach((lecture) => {
      const { teacher, timeSlot } = lecture;

      if (excludedTeachers.includes(teacher)) {
        return;
      }

      const [start, end] = timeSlot.split("-");
      const startTime = parseInt(start.split(":")[0]);
      const endTime = parseInt(end.split(":")[0]);

      if (!teacherSlots[teacher]) {
        teacherSlots[teacher] = Array.from({ length: endHour - startHour }, () => true);
      }

      for (let hour = startTime; hour < endTime; hour++) {
        teacherSlots[teacher][hour - startHour] = false;
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

  const fetchTeacherAvailability = async (day) => {
    const lectures = await fetchAllLecturesForDay(day);
    const teacherFreeSlots = determineTeacherFreeSlots(lectures);
    setTeachers(Object.entries(teacherFreeSlots).map(([teacher, freeSlots]) => ({ teacher, freeSlots })));
  };

  const renderTeacherInfo = ({ item }) => (
    <View style={styles.teacherRow}>
      <Text style={styles.teacherName}>{item.teacher}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {item.freeSlots.map((slot, index) => (
          <View key={index} style={styles.slotBlock}>
            <Text style={styles.scheduleText}>{slot}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderDayItem = ({ item }) => {
    if (!item || !item.day || !item.date) return null;
    const isSelected = item.day === selectedDay;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedDay(item.day);
          fetchTeacherAvailability(item.day);
        }}
        style={[styles.dayBlock, isSelected && styles.selectedDayBlock]}
      >
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
    <View style={styles.container}>
      <Text style={styles.header}>Teacher Availability</Text>
      <FlatList
        data={days}
        renderItem={renderDayItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
      />

      <FlatList
        data={teachers}
        keyExtractor={item => item.teacher}
        renderItem={renderTeacherInfo}
        contentContainerStyle={styles.teacherList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  daySelector: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  dayBlock: {
    padding: 15,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayBlock: {
    backgroundColor: '#d3d3d3',
  },
  dayLabel: {
    fontSize: 14,
    color: '#333',
  },
  selectedDayLabel: {
    fontWeight: 'bold',
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: '#007BFF',
  },
  daySubText: {
    fontSize: 12,
    color: '#666',
  },
  selectedDaySubText: {
    color: '#000',
  },
  teacherList: {
    paddingBottom: 20,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  teacherName: {
    width: 100,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  slotBlock: {
    width: 90,
    padding: 10,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f1f1f1',
  },
  scheduleText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

export default Teacherslot;