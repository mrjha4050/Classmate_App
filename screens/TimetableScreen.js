import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config'; // Your Firebase configuration file

const TimeTableScreen = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'timetable'));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTimetable(data);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setError('Failed to load timetable data');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a8d080" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>📅 CollegeTimetable</Text>
      </View>
      {timetable.length > 0 ? (
        timetable.map((day) => (
          <View key={day.id} style={styles.dayContainer}>
            <Text style={styles.dayHeader}>{day.day}</Text>
            {day.subjects && day.subjects.map((subject, subIndex) => (
              <View key={subIndex} style={styles.subjectContainer}>
                <View style={styles.subjectTextContainer}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectDetails}>
                    {subject.time} - Room {subject.room}
                  </Text>
                </View>
                {subject.icon && (
                  <Image source={{ uri: subject.icon }} style={styles.subjectIcon} />
                )}
              </View>
            ))}
          </View>
        ))
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No timetable data available.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#a8d080',
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  dayContainer: {
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectTextContainer: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subjectDetails: {
    fontSize: 14,
    color: 'gray',
  },
  subjectIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default TimeTableScreen;
