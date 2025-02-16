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
  Switch,
} from "react-native";
import { db } from "../config";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { subjects } from "../components/subjects";
import { Ionicons } from "@expo/vector-icons"; // For the delete icon

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CreateTimetableScreen = ({ navigation }) => {
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
      const teacherList = usersQuerySnapshot.docs
        .filter((doc) => doc.data().role === "teacher")
        .map((doc) => doc.data().name);
      setTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching teachers: ", error);
      Alert.alert("Error", "Failed to fetch teachers.");
    }
  };

  const checkForOverlap = (newStartTime, newEndTime) => {
    return lectures.some((lecture) => {
      const [lectureStart, lectureEnd] = lecture.timeSlot
        .split("-")
        .map((time) => new Date(`1970-01-01T${time}:00Z`));
      return newStartTime < lectureEnd && newEndTime > lectureStart;
    });
  };

  const addOrUpdateLecture = () => {
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

    let updatedLectures = [...lectures];
    if (isEditing) {
      updatedLectures[editingIndex] = newLecture;
    } else {
      updatedLectures.push(newLecture);
    }

    setLectures(updatedLectures);
    setHasChanges(true);
    resetForm();
  };

  const resetForm = () => {
    setStartTime(new Date());
    setEndTime(new Date());
    setSubject("");
    setLocation("");
    setTeacher("");
    setIsBreak(false);
    setIsEditing(false);
    setEditingIndex(-1);
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

  const handleSaveTimetable = async () => {
    if (!day || !lectures.length || !year) {
      Alert.alert("Error", "Please select a year, day, and add at least one lecture.");
      return;
    }
    try {
      const path = `timetable/Bsc.IT/${year}/${day}`;
      const dayDocRef = doc(db, path);
      await setDoc(dayDocRef, { lectures }, { merge: true });
      Alert.alert("Success", "Timetable saved successfully!");
      setHasChanges(false);
      resetForm();
    } catch (error) {
      console.error("Error writing document: ", error);
      Alert.alert("Error", `Failed to save timetable: ${error.message}`);
    }
  };

  const editLecture = (index) => {
    const lecture = lectures[index];
    const [startTimeStr, endTimeStr] = lecture.timeSlot.split("-");
    const currentDay = new Date().toISOString().substring(0, 10);
    const newStartTime = new Date(`${currentDay}T${startTimeStr}:00`);
    const newEndTime = new Date(`${currentDay}T${endTimeStr}:00`);

    setStartTime(newStartTime);
    setEndTime(newEndTime);
    setSubject(lecture.subject);
    setLocation(lecture.location);
    setTeacher(lecture.teacher);
    setIsBreak(lecture.subject === "Break");
    setIsEditing(true);
    setEditingIndex(index);
    setHasChanges(true);
  };

  const deleteLecture = (index) => {
    const updatedLectures = lectures.filter((_, i) => i !== index);
    setLectures(updatedLectures);
    setHasChanges(true);
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

  const selectYear = (selectedYear) => {
    setYear(selectedYear);
    setShowYearModal(false);
  };

  const renderModal = (title, data, onSelect, onClose) => (
    <Modal transparent={true} visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => onSelect(item)}>
                <Text style={styles.modalOptionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lectures}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <>
            <Text style={styles.label}>Year:</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowYearModal(true)}>
              <Text>{year || "Select a year"}</Text>
            </TouchableOpacity>

            {showYearModal &&
              renderModal(
                "Select Year",
                ["First Year", "Second Year", "Third Year"],
                selectYear,
                () => setShowYearModal(false)
              )}

            <Text style={styles.label}>Day:</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDayModal(true)}>
              <Text>{day || "Select a day"}</Text>
            </TouchableOpacity>

            {showDayModal &&
              renderModal("Select Day", daysOfWeek, selectDay, () => setShowDayModal(false))}

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
                <TouchableOpacity style={styles.input} onPress={() => setShowSubjectModal(true)}>
                  <Text>{subject || "Select a subject"}</Text>
                </TouchableOpacity>

                {showSubjectModal &&
                  renderModal(
                    "Select Subject",
                    subjects.map((subj) => subj.name),
                    selectSubject,
                    () => setShowSubjectModal(false)
                  )}

                <Text style={styles.label}>Teacher:</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowTeacherModal(true)}>
                  <Text>{teacher || "Select a teacher"}</Text>
                </TouchableOpacity>

                {showTeacherModal &&
                  renderModal("Select Teacher", teachers, selectTeacher, () =>
                    setShowTeacherModal(false)
                  )}
              </>
            )}

            <View style={styles.breakContainer}>
              <Text style={styles.label}>Break:</Text>
              <Switch value={isBreak} onValueChange={() => setIsBreak(!isBreak)} />
            </View>

            <Button
              title={isEditing ? "Update Lecture" : "Add Lecture"}
              onPress={addOrUpdateLecture}
            />
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.lectureItemContainer}>
            <TouchableOpacity onPress={() => editLecture(index)} style={styles.lectureContainer}>
              <Text style={styles.lectureText}>
                {item.timeSlot} - {item.subject} {item.location ? `(${item.location})` : ""}{" "}
                {item.teacher ? `- Teacher: ${item.teacher}` : ""}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteLecture(index)} style={styles.deleteButton}>
              <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTimetable}>
              <Text style={styles.saveButtonText}>Save Timetable</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalOptionText: {
    fontSize: 16,
  },
  lectureItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lectureContainer: {
    flex: 1,
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  lectureText: {
    fontSize: 16,
  },
  deleteButton: {
    marginLeft: 10,
  },
  breakContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  footer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateTimetableScreen;