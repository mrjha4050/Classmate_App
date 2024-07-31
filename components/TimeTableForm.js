import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config'; // Your Firebase configuration file

const TimetableForm = ({ navigation }) => {
  const [day, setDay] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [time, setTime] = useState('');

  const handleAddTimetable = async () => {
    if (day && subjectName && teacherName && roomNo && time) {
      try {
        await addDoc(collection(db, 'timetable'), {
          day,
          subjects: [
            {
              name: subjectName,
              teacher: teacherName,
              room: roomNo,
              time,
            },
          ],
        });
        Alert.alert('Success', 'Timetable added successfully');
        navigation.goBack(); // Go back to the previous screen after adding
      } catch (error) {
        console.error('Error adding timetable:', error);
        Alert.alert('Error', 'Failed to add timetable');
      }
    } else {
      Alert.alert('Error', 'All fields are required');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Timetable</Text>
      <TextInput
        style={styles.input}
        placeholder="Day"
        value={day}
        onChangeText={setDay}
      />
      <TextInput
        style={styles.input}
        placeholder="Subject Name"
        value={subjectName}
        onChangeText={setSubjectName}
      />
      <TextInput
        style={styles.input}
        placeholder="Teacher Name"
        value={teacherName}
        onChangeText={setTeacherName}
      />
      <TextInput
        style={styles.input}
        placeholder="Room No"
        value={roomNo}
        onChangeText={setRoomNo}
      />
      <TextInput
        style={styles.input}
        placeholder="Time (e.g., 9:00 AM - 10:30 AM)"
        value={time}
        onChangeText={setTime}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddTimetable}>
        <Text style={styles.buttonText}>Add Timetable</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#a8d080',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TimetableForm;
