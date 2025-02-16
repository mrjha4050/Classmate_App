import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db } from '../config';
import { doc, getDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';  

const ViewTimetableScreen = ({ navigation }) => {  
  const [timetable, setTimetable] = useState({ lectures: [] });  
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(format(new Date(), "EEEE"));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState("Third Year");

  useEffect(() => {
    fetchTimetable();
  }, [selectedYear, selectedDay]);

  const fetchTimetable = async () => {
    try {
      const docRef = doc(db, `timetable/Bsc.IT/${selectedYear}/${selectedDay}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Timetable (from server):", data);
        setTimetable(data || { lectures: [] }); // Handle missing data gracefully
      } else {
        console.log("No timetable found for the selected day.");
        setTimetable({ lectures: [] });
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
      Alert.alert("Error", "Failed to fetch timetable data.");
    }

    const today = new Date();
    const nextDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(today, i);
      nextDays.push({
        date: format(currentDay, "yyyy-MM-dd"),
        day: format(currentDay, "EEEE"),
      });
    }
    setDays(nextDays);
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
    <View style={styles.container}>

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Edit Timetable</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateTimetableScreen')} // Navigate to CreateNoticeScreen
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.selectionView}>
        <Text style={styles.label}>Select Year</Text>
        <Text style={styles.selectionText}>{selectedYear}</Text>
      </TouchableOpacity>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 5,
  },
  selectionView: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    margin: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectionText: {
    fontSize: 16,
    marginTop: 5,
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
  },
  picker: {
    height: 50,
    width: '100%',
  },
});

export default ViewTimetableScreen;