import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  Button, 
  Alert, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { db } from '../config';

const ViewTimetableScreen = () => {
  const [timetable, setTimetable] = useState({ lectures: [] });
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(format(new Date(), "EEEE"));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchStudentYear = async () => {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const studentId = userDocSnap.data().studentId || auth.currentUser.uid;
          const studentDocRef = doc(db, "students", studentId);
          const studentDocSnap = await getDoc(studentDocRef);

          if (studentDocSnap.exists()) {
            const studentYear = studentDocSnap.data().year;
            setSelectedYear(studentYear);
          }
        }
      } catch (error) {
        console.error("Error fetching student year:", error);
      }
    };

    fetchStudentYear();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchTimetable();
    }
  }, [selectedYear, selectedDay]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, `timetable/Bsc.IT/${selectedYear}/${selectedDay}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTimetable(docSnap.data());
      } else {
        setTimetable({ lectures: [] });
      }

      // Generate week days
      const today = new Date();
      const nextDays = Array.from({ length: 7 }, (_, i) => {
        const currentDay = addDays(today, i);
        return {
          date: format(currentDay, "yyyy-MM-dd"),
          day: format(currentDay, "EEEE"),
        };
      });
      setDays(nextDays);
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderDayItem = ({ item }) => {
    const isSelected = item.day === selectedDay;
    return (
      <TouchableOpacity
        onPress={() => setSelectedDay(item.day)}
        style={[styles.dayBlock, isSelected && styles.selectedDayBlock]}
      >
        <Text style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}>
          {format(new Date(item.date), "MMM")}
        </Text>
        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
          {format(new Date(item.date), "dd")}
        </Text>
        <Text style={[styles.daySubText, isSelected && styles.selectedDaySubText]}>
          {item.day}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Timetable</Text>
          <View style={styles.emptySpace} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6F61" />
          </View>
        ) : (
          <>
            <View style={styles.dayBarContainer}>
              <FlatList
                data={days}
                horizontal
                renderItem={renderDayItem}
                keyExtractor={(item) => item.date + item.day}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayBar}
              />
            </View>

            <ScrollView style={styles.contentContainer}>
              {timetable?.lectures?.length > 0 ? (
                <View style={styles.dayContainer}>
                  {timetable.lectures.map((lecture, index) => (
                    <View key={index} style={styles.classContainer}>
                      <Text style={styles.subjectText}>
                        Subject - <Text style={styles.subjectName}>{lecture.subject}</Text>
                      </Text>
                      <Text style={styles.timeText}>
                        Time - <Text style={styles.timeRange}>{lecture.timeSlot}</Text>
                      </Text>
                      <Text style={styles.locationText}>
                        Location - <Text style={styles.locationName}>{lecture.location}</Text>
                      </Text>
                      <Text style={styles.teacherText}>
                        Teacher - <Text style={styles.teacherName}>{lecture.teacher}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.dayContainer}>
                  <Text style={styles.noClassesText}>No classes scheduled for this day.</Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// Keep all your existing styles exactly the same
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FF6F61',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 5,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  emptySpace: {
    width: 24,
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
    marginVertical: 5,
    borderRadius: 10,
  },
  classContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F2994A',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  teacherText: {
    fontSize: 16,
    color: '#000',
    marginTop: 5,
  },
  teacherName: {
    color: '#2D9CDB',
  },
  noClassesText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ViewTimetableScreen;