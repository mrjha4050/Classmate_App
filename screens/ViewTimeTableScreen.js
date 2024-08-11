import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { db } from '../config'; // Import the Firestore instance
import { collection, getDocs } from 'firebase/firestore';

const ViewTimetableScreen = () => {
  const [timetable, setTimetable] = useState({});

  useEffect(() => {
    const fetchTimetable = async () => {
      const timetableCollection = collection(db, 'timetable');
      const timetableSnapshot = await getDocs(timetableCollection);
      const timetableData = {};
      timetableSnapshot.forEach((doc) => {
        timetableData[doc.id] = doc.data();
      });

      // Sorting each day's lectures by time slot
      Object.keys(timetableData).forEach(day => {
        timetableData[day] = Object.entries(timetableData[day])
          .sort(([a], [b]) => {
            const timeA = a.split('-')[0];
            const timeB = b.split('-')[0];
            return timeA.localeCompare(timeB);
          })
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});
      });

      setTimetable(timetableData);
    };

    fetchTimetable();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {Object.keys(timetable).map(day => (
        <View key={day} style={styles.dayContainer}>
          <Text style={styles.dayHeader}>{day}</Text>
          {Object.keys(timetable[day]).map(timeSlot => (
            <View key={timeSlot} style={styles.classContainer}>
              <Text style={styles.timeText}>{timeSlot}</Text>
              <Text style={styles.subjectText}>{timetable[day][timeSlot].subject}</Text>
              <Text style={styles.locationText}>{timetable[day][timeSlot].location}</Text>
              <Text style={styles.teacherText}>Teacher: {timetable[day][timeSlot].teacher}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#FE8441',
    color: 'black',
  },
  classContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  timeText: {
    fontSize: 16,
    color: '#000',
  },
  subjectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  locationText: {
    fontSize: 16,
    color: '#000',
  },
  teacherText: {
    fontSize: 16,
    color: '#000',
    // fontStyle: 'italic',
  },
});

export default ViewTimetableScreen;
