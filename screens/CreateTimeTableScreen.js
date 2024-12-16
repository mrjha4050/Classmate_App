import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { db } from "../config";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { subjects } from "../components/subjects";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const CreateTimetableScreen = () => {
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [teacher, setTeacher] = useState("");
  const [lectures, setLectures] = useState([]);
  const [isBreak, setIsBreak] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [hasChanges, setHasChanges] = useState(false);


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
            console.error(
              `User document ${docSnap.id} is missing a name field.`
            );
          }
        }
      }

      setTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching teacher names: ", error);
    }
  };

  const checkForOverlap = (newStartTime, newEndTime) => {
    return lectures.some((lecture) => {
      const [lectureStart, lectureEnd] = lecture.timeSlot
        .split("-")
        .map((time) => {
          const [hours, minutes] = time.split(":");
          const today = new Date();
          return new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            parseInt(hours),
            parseInt(minutes)
          );
        });
      return newStartTime < lectureEnd && newEndTime > lectureStart;
    });
  };

  const addLecture = () => {
    if (startTime >= endTime) {
      Alert.alert("Error", "Start time must be before end time.");
      return;
    }
  
    const startTimeDate = new Date(startTime.setSeconds(0, 0));
    const endTimeDate = new Date(endTime.setSeconds(0, 0));
  
    if (checkForOverlap(startTimeDate, endTimeDate)) {
      Alert.alert("Error", "This lecture overlaps with an existing lecture.");
      return;
    }
  
    const formattedStartTime = startTime.toTimeString().substring(0, 5); 
    const formattedEndTime = endTime.toTimeString().substring(0, 5);
  
    const newLecture = {
      timeSlot: `${formattedStartTime}-${formattedEndTime}`,
      subject: isBreak ? "Break" : subject,
      location: isBreak ? "" : location,
      teacher: isBreak ? "" : teacher,
    };
  
    setLectures([...lectures, newLecture]);
    setHasChanges(true); 
    setStartTime(new Date(endTime));
    setEndTime(new Date(endTime.getTime() + 45 * 60000));
    setSubject("");
    setLocation("");
    setTeacher("");
    setIsBreak(false);
  };

  const fetchTimetableForDay = async (selectedDay) => {
    if (!year || !selectedDay) {
      Alert.alert("Error", "Please select a year and day before fetching the timetable.");
      return;
    }
    setLoading(true);
    try {
      const path = `timetable/Bsc.IT/${year}/${selectedDay}`;
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedLectures = data.lectures || [];
        loadedLectures.sort((a, b) => {
          const startA = new Date(`1970-01-01T${a.timeSlot.split("-")[0]}:00Z`);
          const startB = new Date(`1970-01-01T${b.timeSlot.split("-")[0]}:00Z`);
          return startA - startB;
        });
        setLectures(loadedLectures);
      } else {
        setLectures([]);
        Alert.alert("Info", "No lectures found for this day.");
      }
    } catch (error) {
      console.error("Error fetching timetable: ", error);
      Alert.alert("Error", `Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateLecture = async () => {
    if (startTime >= endTime) {
      Alert.alert('Error', 'Start time must be before end time.');
      return;
    }
    const startTimeDate = new Date(startTime.setSeconds(0, 0));
    const endTimeDate = new Date(endTime.setSeconds(0, 0));

    const formattedStartTime = startTime.toTimeString().substring(0, 5);  
    const formattedEndTime = endTime.toTimeString().substring(0, 5);

    const newLecture = {
      timeSlot: `${formattedStartTime}-${formattedEndTime}`,
      subject: isBreak ? 'Break' : subject,
      location: isBreak ? '' : location,
      teacher: isBreak ? '' : teacher,
    };

    let updatedLectures = [...lectures];
    updatedLectures.push(newLecture);
    setLectures(updatedLectures);

    try {
      const path = `timetable/${course}/${year}/${day}`;
      const dayDocRef = doc(db, path);
      await setDoc(dayDocRef, { lectures: updatedLectures }, { merge: true });
      Alert.alert('Success', 'Timetable updated successfully!');
    } catch (error) {
      console.error("Error writing document: ", error);
      Alert.alert('Error', `Failed to save timetable: ${error.message}`);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }


  const handleSaveTimetable = async () => {
    if (!day || !lectures.length || !year) {
      Alert.alert(
        "Error",
        "Please select a year, day, and add at least one lecture."
      );
      return;
    }
    try {
      const path = `timetable/Bsc.IT/${year}/${day}`;
      const dayDocRef = doc(db, path);
      await setDoc(dayDocRef, { lectures }, { merge: true });
      Alert.alert("Success", "Timetable saved successfully!");
      setHasChanges(false);
  
      setDay("");
      setLectures([]);
      setYear("");
    } catch (error) {
      console.error("Error writing document: ", error);
      Alert.alert("Error", `Failed to save timetable: ${error.message}`);
    }
  };

  const handleNavigateAway = () => {
    if (hasChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save them before leaving?",
        [
          { text: "Don't Save", onPress: () => {} },
          { text: "Save", onPress: handleSaveTimetable },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
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
  const selectCourse = (selectedCourse) => {
    setCourse(selectedCourse);
    setShowCourseModal(false);
  };
  const selectYear = (selectedYear) => {
    setYear(selectedYear);
    setShowYearModal(false);
  };
  const editLecture = (index) => {
    const lecture = lectures[index];
    const [startTimeStr, endTimeStr] = lecture.timeSlot.split('-');
    const currentDay = new Date().toISOString().substring(0, 10); // 'YYYY-MM-DD'
    const newStartTime = new Date(`${currentDay}T${startTimeStr}:00`);
    const newEndTime = new Date(`${currentDay}T${endTimeStr}:00`);
  
    setStartTime(newStartTime);
    setEndTime(newEndTime);
    setSubject(lecture.subject);
    setLocation(lecture.location);
    setTeacher(lecture.teacher);
    setIsBreak(lecture.subject === 'Break');
    setIsEditing(true);
    setEditingIndex(index);
    setHasChanges(true); 
  };
  return (
    <View style={styles.mainContainer}>
    <FlatList
      data={lectures}
      keyExtractor={(item, index) => index.toString()}
      ListHeaderComponent={
        <>
          <Text style={styles.label}>Year:</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowYearModal(true)}
          >
            <Text>{year || "Select a year"}</Text>
          </TouchableOpacity>
  
          <Modal
            transparent={true}
            visible={showYearModal}
            animationType="slide"
            onRequestClose={() => setShowYearModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {["First Year", "Second Year", "Third Year"].map((yearOption, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dayOption}
                    onPress={() => selectYear(yearOption)}
                  >
                    <Text style={styles.dayText}>{yearOption}</Text>
                  </TouchableOpacity>
                ))}
                <Button title="Cancel" onPress={() => setShowYearModal(false)} />
              </View>
            </View>
          </Modal>
  
          <Text style={styles.label}>Day:</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDayModal(true)}
          >
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
                  <TouchableOpacity
                    key={index}
                    style={styles.dayOption}
                    onPress={() => selectDay(day)}
                  >
                    <Text style={styles.dayText}>{day}</Text>
                  </TouchableOpacity>
                ))}
                <Button title="Cancel" onPress={() => setShowDayModal(false)} />
              </View>
            </View>
          </Modal>
  
          <Text style={styles.label}>Lecture Start Time:</Text>
          <Button
            title={`Set Start Time: ${startTime.toTimeString().substring(0, 5)}`}
            onPress={() => setShowStartTimePicker(true)}
          />
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={onChangeStartTime}
            />
          )}
  
          <Text style={styles.label}>Lecture End Time:</Text>
          <Button
            title={`Set End Time: ${endTime.toTimeString().substring(0, 5)}`}
            onPress={() => setShowEndTimePicker(true)}
          />
          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display="default"
              onChange={onChangeEndTime}
            />
          )}
  
          {!isBreak && (
            <>
              <Text style={styles.label}>Subject:</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowSubjectModal(true)}
              >
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
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dayOption}
                          onPress={() => selectSubject(item.name)}
                        >
                          <Text style={styles.dayText}>{item.name}</Text>
                        </TouchableOpacity>
                      )}
                    />
                    <Button
                      title="Cancel"
                      onPress={() => setShowSubjectModal(false)}
                    />
                  </View>
                </View>
              </Modal>
            </>
          )}
  
          {/* Teacher Selection */}
          <Text style={styles.label}>Teacher:</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowTeacherModal(true)}
          >
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
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dayOption}
                      onPress={() => selectTeacher(item)}
                    >
                      <Text style={styles.dayText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowTeacherModal(false)}
                />
              </View>
            </View>
          </Modal>
  
          <Button title="Add Lecture" onPress={addLecture} />
        </>
      }
      renderItem={({ item, index }) => (
        <TouchableOpacity onPress={() => editLecture(index)}>
          <View style={styles.lectureContainer}>
            <Text style={styles.lectureText}>
              {item.timeSlot} - {item.subject}{" "}
              {item.location ? `(${item.location})` : ""}{" "}
              {item.teacher ? `- Teacher: ${item.teacher}` : ""}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveTimetable}
          >
            <Text style={styles.saveButtonText}>Save Timetable</Text>
          </TouchableOpacity>
        </View>
      }
      nestedScrollEnabled={true}
    />
  </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  dayOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: "100%",
    alignItems: "center",
  },
  dayText: {
    fontSize: 18,
  },
  lectureContainer: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#E0E0E0",
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
    backgroundColor: "#ccc",
    alignItems: "center",
    borderRadius: 5,
  },
  breakButtonActive: {
    backgroundColor: "#007BFF",
  },
  breakButtonText: {
    fontSize: 16,
    color: "white",
  },
  footer: {
    borderRadius: 10,
    padding: 5,
    backgroundColor: "#FE8441",
    borderTopWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  saveButton: {
    padding: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateTimetableScreen;
