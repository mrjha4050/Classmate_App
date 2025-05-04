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
import { format, addDays, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../config';

const TeacherViewTimetable = () => {
  const [timetable, setTimetable] = useState({ lectures: [] });
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(format(new Date(), "EEEE"));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState("Third Year");
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigation = useNavigation();

  useEffect(() => {
    generateWeekDays();
    fetchTimetable();
  }, [selectedYear, selectedDay, selectedDate]);

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
    } catch (error) {
      console.error("Error fetching timetable:", error);
      Alert.alert("Error", "Failed to fetch timetable data.");
    } finally {
      setLoading(false);
    }
  };

  const generateWeekDays = () => {
    const startDate = new Date(selectedDate);
    const nextDays = Array.from({ length: 7 }, (_, i) => {
      const currentDay = addDays(startDate, i);
      return {
        date: format(currentDay, "yyyy-MM-dd"),
        day: format(currentDay, "EEEE"),
      };
    });
    setDays(nextDays);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      generateWeekDays();
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
          {format(parseISO(item.date), "MMM")}
        </Text>
        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
          {format(parseISO(item.date), "dd")}
        </Text>
        <Text style={[styles.daySubText, isSelected && styles.selectedDaySubText]}>
          {item.day.substring(0, 3)}
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

        <Modal
          transparent={true}
          animationType="slide"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Select Year:</Text>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(itemValue) => setSelectedYear(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="First Year" value="First Year" />
                <Picker.Item label="Second Year" value="Second Year" />
                <Picker.Item label="Third Year" value="Third Year" />
              </Picker>
              <Button title="Done" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>

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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6F61" />
          </View>
        ) : (
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
                <Text style={styles.noClassesText}>No classes scheduled for {selectedDay}.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

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
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  dateSelectionView: {
    flex: 1,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginRight: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  yearSelectionView: {
    flex: 1,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginLeft: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  selectionText: {
    fontSize: 16,
    color: '#888',
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
    backgroundColor: '#2E86C1',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#2C3E50',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeacherViewTimetable;