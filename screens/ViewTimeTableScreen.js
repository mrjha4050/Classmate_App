import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { db } from '../config'; // Import the Firestore instance
import { collection, getDocs } from 'firebase/firestore';
import moment from 'moment'; // Import moment.js for date formatting

const ViewTimetableScreen = () => {
  const [timetable, setTimetable] = useState({});
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(moment().format('dddd'));

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

      // Calculate the next 7 days for the top section
      const today = moment();
      const nextDays = [];
      for (let i = 0; i < 7; i++) {
        nextDays.push({
          date: today.clone().add(i, 'days').format('YYYY-MM-DD'),
          day: today.clone().add(i, 'days').format('dddd'),
        });
      }
      setDays(nextDays);
    };

    fetchTimetable();
  }, []);

  const renderDayItem = ({ item }) => {
    const isSelected = item.day === selectedDay;
    return (
      <TouchableOpacity
        onPress={() => setSelectedDay(item.day)}
        style={[styles.dayBlock, isSelected && styles.selectedDayBlock]}
      >
        <Text style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}>{moment(item.date).format('MMM')}</Text>
        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{moment(item.date).format('DD')}</Text>
        <Text style={[styles.daySubText, isSelected && styles.selectedDaySubText]}>{item.day}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.dayBarContainer}>
        <FlatList
          data={days}
          horizontal
          renderItem={renderDayItem}
          keyExtractor={(item) => item.date + item.day} // Ensure uniqueness
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayBar}
        />
      </View>

      <ScrollView style={styles.contentContainer}>
        {timetable[selectedDay] ? (
          <View style={styles.dayContainer}>
            {Object.keys(timetable[selectedDay]).map((timeSlot, index) => (
              <View key={index} style={styles.classContainer}>
                <Text style={styles.subjectText}>Subject - <Text style={styles.subjectName}>{timetable[selectedDay][timeSlot].subject}</Text></Text>
                <Text style={styles.timeText}>Time - <Text style={styles.timeRange}>{timeSlot}</Text></Text>
                <Text style={styles.locationText}>Location - <Text style={styles.locationName}>{timetable[selectedDay][timeSlot].location}</Text></Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.dayContainer}>
            <Text style={styles.noClassesText}>No classes scheduled for this day.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 15,
  },
  dayBarContainer: {
    marginVertical: 10,
  },
  dayBar: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  dayBlock: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  selectedDayBlock: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  dayLabel: {
    fontSize: 12,
    color: '#888',
  },
  selectedDayLabel: {
    color: '#000',
  },
  dayText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDayText: {
    color: '#000',
  },
  daySubText: {
    fontSize: 14,
    color: '#888',
  },
  selectedDaySubText: {
    color: '#000',
  },
  contentContainer: {
    flex: 1,
  },
  dayContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F2994A',
    marginVertical: 5,
    borderRadius: 10,
  },
  classContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F2994A',
    borderRadius: 10,
    marginBottom: 10,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  subjectName: {
    color: '#2D9CDB',
  },
  timeText: {
    fontSize: 16,
    color: '#000',
    marginTop: 5,
  },
  timeRange: {
    color: '#EB5757',
  },
  locationText: {
    fontSize: 16,
    color: '#000',
    marginTop: 5,
  },
  locationName: {
    color: '#2D9CDB',
  },
  noClassesText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ViewTimetableScreen;
