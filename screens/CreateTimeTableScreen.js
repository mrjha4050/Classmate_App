import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Modal, FlatList } from 'react-native';
import { db } from '../config'; // Import your Firestore configuration
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { subjects } from '../components/subjects';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const years = ["First Year", "Second Year", "Third Year"];
const courses = ["BSC.IT", "BMS", "BCA", "BFM", "BBI"];

const CreateTimetableScreen = () => {
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [teacher, setTeacher] = useState('');
  const [lectures, setLectures] = useState([]);
  const [isBreak, setIsBreak] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const usersQuerySnapshot = await getDocs(collection(db, "users"));
      const teacherList = [];

      for (let docSnap of usersQuerySnapshot.docs) {
        const userData = docSnap.data();

        if (userData.role === "teacher") {
          if (userData.name) {
            teacherList.push(userData.name);
          } else {
            console.error(`User document ${docSnap.id} is missing a name field.`);
          }
        }
      }

      setTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching teacher names: ", error);
    }
  };

  const checkForOverlap = (newStartTime, newEndTime) => {
    return lectures.some(lecture => {
        const [lectureStart, lectureEnd] = lecture.timeSlot.split('-').map(time => {
            const [hours, minutes] = time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        });
        return newStartTime < lectureEnd && newEndTime > lectureStart;
    });
  };

  const addLecture = () => {
    if (startTime >= endTime) {
      Alert.alert('Error', 'Start time must be before end time.');
      return;
    }

    if (checkForOverlap(startTime, endTime)) {
      Alert.alert('Error', 'This lecture overlaps with an existing lecture.');
      return;
    }

    const formattedStartTime = startTime.toTimeString().substring(0, 5); // HH:MM format
    const formattedEndTime = endTime.toTimeString().substring(0, 5);

    const newLecture = {
      timeSlot: `${formattedStartTime}-${formattedEndTime}`,
      subject: isBreak ? 'Break' : subject,
      location: isBreak ? '' : location,
      teacher: isBreak ? '' : teacher,
    };

    setLectures([...lectures, newLecture]);
    setStartTime(new Date(endTime));
    setEndTime(new Date(endTime.getTime() + 45 * 60000));
    setSubject('');
    setLocation('');
    setTeacher('');
    setIsBreak(false);
  };

  const handleSaveTimetable = async () => {
    if (day && selectedYear && selectedCourse && lectures.length > 0) {
      try {
        const docRef = doc(db, `timetable/${selectedCourse}/${selectedYear}`, day);
        const lectureData = {};
        lectures.forEach(lecture => {
          lectureData[lecture.timeSlot] = {
            subject: lecture.subject,
            location: lecture.location,
            teacher: lecture.teacher,
          };
        });
        await setDoc(docRef, lectureData, { merge: true });
        Alert.alert('Success', 'Timetable saved successfully!');
        setDay('');
        setLectures([]);
        setSelectedYear('');
        setSelectedCourse('');
      } catch (error) {
        console.error("Error writing document: ", error);
        Alert.alert('Error', `Failed to save timetable: ${error.message}`);
      }
    } else {
      Alert.alert('Error', 'Please select a day, year, course, and add at least one lecture.');
    }
  };

  const onChangeStartTime = (event, selectedTime) => {
    const currentTime = selectedTime || startTime;
    setShowStartTimePicker(false);
    setStartTime(currentTime);
  };

  const onChangeEndTime = (event, selectedTime) => {
    const currentTime = selectedTime || endTime;
    setShowEndTimePicker(false);
    setEndTime(currentTime);
  };

  const selectDay = (selectedDay) => {
    setDay(selectedDay);
    setShowDayModal(false);
    fetchTimetableForDay(selectedDay);
  };

  const selectTeacher = (selectedTeacher) => {
    setTeacher(selectedTeacher);
    setShowTeacherModal(false);
  };

  const selectSubject = (selectedSubject) => {
    setSubject(selectedSubject);
    setShowSubjectModal(false);
  };

  const fetchTimetableForDay = async (selectedDay) => {
    if (selectedYear && selectedCourse) {
      try {
        const docRef = doc(db, `timetable/${selectedCourse}/${selectedYear}`, selectedDay);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const loadedLectures = Object.keys(data).map(timeSlot => ({
            timeSlot,
            ...data[timeSlot]
          }));
          loadedLectures.sort((a, b) => {
            const [startA] = a.timeSlot.split('-');
            const [startB] = b.timeSlot.split('-');
            return new Date(`1970-01-01T${startA}:00Z`) - new Date(`1970-01-01T${startB}:00Z`);
          });
          setLectures(loadedLectures);
        } else {
          setLectures([]);
        }
      } catch (error) {
        console.error("Error fetching timetable: ", error);
      }
    }
  };

  const editLecture = (index) => {
    const lecture = lectures[index];
    const [start, end] = lecture.timeSlot.split('-');
    setStartTime(new Date(`1970-01-01T${start}:00Z`));
    setEndTime(new Date(`1970-01-01T${end}:00Z`));
    setSubject(lecture.subject);
    setLocation(lecture.location);
    setTeacher(lecture.teacher);

    const newLectures = lectures.filter((_, i) => i !== index);
    setLectures(newLectures);
  };

  const renderItem = ({ item }) => (
    <View style={styles.lectureContainer}>
      <Text style={styles.lectureText}>
        {item.timeSlot} - {item.subject} {item.location ? `(${item.location})` : ''} {item.teacher ? `- Teacher: ${item.teacher}` : ''}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={lectures}
      ListHeaderComponent={
        <View>
          <Text style={styles.label}>Day:</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDayModal(true)}>
            <Text>{day || "Select a day"}</Text>
          </TouchableOpacity>

          <Modal
            transparent={true}
            visible={showDayModal}
            animationType="slide"
            onRequestClose={() => setShowDayModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {daysOfWeek.map((day, index) => (
                  <TouchableOpacity key={index} style={styles.dayOption} onPress={() => selectDay(day)}>
                    <Text style={styles.dayText}>{day}</Text>
                  </TouchableOpacity>
                ))}
                <Button title="Cancel" onPress={() => setShowDayModal(false)} />
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Year:</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowYearModal(true)}>
            <Text>{selectedYear || "Select a year"}</Text>
          </TouchableOpacity>

          <Modal
            transparent={true}
            visible={showYearModal}
            animationType="slide"
            onRequestClose={() => setShowYearModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {years.map((year, index) => (
                  <TouchableOpacity key={index} style={styles.dayOption} onPress={() => { setSelectedYear(year); setShowYearModal(false); }}>
                    <Text style={styles.dayText}>{year}</Text>
                  </TouchableOpacity>
                ))}
                <Button title="Cancel" onPress={() => setShowYearModal(false)} />
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Course:</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowCourseModal(true)}>
            <Text>{selectedCourse || "Select a course"}</Text>
          </TouchableOpacity>

          <Modal
            transparent={true}
            visible={showCourseModal}
            animationType="slide"
            onRequestClose={() => setShowCourseModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {courses.map((course, index) => (
                  <TouchableOpacity key={index} style={styles.dayOption} onPress={() => { setSelectedCourse(course); setShowCourseModal(false); }}>
                    <Text style={styles.dayText}>{course}</Text>
                  </TouchableOpacity>
                ))}
                <Button title="Cancel" onPress={() => setShowCourseModal(false)} />
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Lecture Start Time:</Text>
          <Button title={`Set Start Time: ${startTime.toTimeString().substring(0, 5)}`} onPress={() => setShowStartTimePicker(true)} />
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={onChangeStartTime}
            />
          )}

          <Text style={styles.label}>Lecture End Time:</Text>
          <Button title={`Set End Time: ${endTime.toTimeString().substring(0, 5)}`} onPress={() => setShowEndTimePicker(true)} />
          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display="default"
              onChange={onChangeEndTime}
            />
          )}

          <View style={styles.breakContainer}>
            <Text style={styles.label}>Is this a break?</Text>
            <TouchableOpacity
              style={[styles.breakButton, isBreak && styles.breakButtonActive]}
              onPress={() => setIsBreak(!isBreak)}
            >
              <Text style={styles.breakButtonText}>{isBreak ? "Yes" : "No"}</Text>
            </TouchableOpacity>
          </View>

          {!isBreak && (
            <>
              <Text style={styles.label}>Subject:</Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowSubjectModal(true)}>
                <Text>{subject || "Select a subject"}</Text>
              </TouchableOpacity>

              <Modal
                transparent={true}
                visible={showSubjectModal}
                animationType="slide"
                onRequestClose={() => setShowSubjectModal(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <FlatList
                      data={subjects}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={styles.dayOption} onPress={() => selectSubject(item.name)}>
                          <Text style={styles.dayText}>{item.name}</Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={(item, index) => index.toString()}
                    />
                    <Button title="Cancel" onPress={() => setShowSubjectModal(false)} />
                  </View>
                </View>
              </Modal>

              <Text style={styles.label}>Location:</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location (e.g., Room B502)"
              />

              <Text style={styles.label}>Teacher:</Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowTeacherModal(true)}>
                <Text>{teacher || "Select a teacher"}</Text>
              </TouchableOpacity>

              <Modal
                transparent={true}
                visible={showTeacherModal}
                animationType="slide"
                onRequestClose={() => setShowTeacherModal(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <FlatList
                      data={teachers}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={styles.dayOption} onPress={() => selectTeacher(item)}>
                          <Text style={styles.dayText}>{item}</Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={(item, index) => index.toString()}
                    />
                    <Button title="Cancel" onPress={() => setShowTeacherModal(false)} />
                  </View>
                </View>
              </Modal>
            </>
          )}
        </View>
      }
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      ListFooterComponent={
        <Button title="Save Timetable" onPress={handleSaveTimetable} />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  dayOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 18,
  },
  lectureContainer: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
  },
  lectureText: {
    fontSize: 16,
  },
  breakContainer: {
    marginBottom: 15,
  },
  breakButton: {
    padding: 10,
    backgroundColor: '#ccc',
    alignItems: 'center',
    borderRadius: 5,
  },
  breakButtonActive: {
    backgroundColor: '#007BFF',
  },
  breakButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default CreateTimetableScreen;
