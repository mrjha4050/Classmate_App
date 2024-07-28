// src/screens/CreateNoticeScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { db } from '../config'; // Make sure you have Firebase configured

const CreateNoticeScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [teacher, setTeacher] = useState(''); // New state for teacher's name
  const [tag, setTag] = useState('Announcement'); // Default tag

  const handleCreateNotice = async () => {
    if (title && content && teacher && tag) {
      try {
        const currentDate = new Date().toISOString(); // Automatically assign current date and time
        await addDoc(collection(db, 'notices'), {
          title,
          date: currentDate,
          content,
          teacher, // Save teacher's name
          tag,
        });
        Alert.alert('Success', 'Notice created successfully!');
        navigation.goBack();
      } catch (error) {
        Alert.alert('Error', 'Failed to create notice. Please try again.');
        console.error(error);
      }
    } else {
      Alert.alert('Error', 'Please fill out all fields');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <Text style={styles.title}>Create Notice</Text> */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Content"
          value={content}
          onChangeText={setContent}
        />
        <TextInput
          style={styles.input}
          placeholder="Teacher's Name"
          value={teacher}
          onChangeText={setTeacher}
        />
        <Text style={styles.label}>Tag</Text>
        <View style={styles.tagContainer}>
          <TouchableOpacity
            style={[styles.tagButton, tag === 'Announcement' && styles.tagButtonActive]}
            onPress={() => setTag('Announcement')}
          >
            <Text style={[styles.tagText, tag === 'Announcement' && styles.tagTextActive]}>Announcement</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tagButton, tag === 'Event' && styles.tagButtonActive]}
            onPress={() => setTag('Event')}
          >
            <Text style={[styles.tagText, tag === 'Event' && styles.tagTextActive]}>Event</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateNotice}
        >
          <Text style={styles.createButtonText}>Create Notice</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tagButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 20,
  },
  tagButtonActive: {
    backgroundColor: '#4CAF50',
  },
  tagText: {
    color: '#555',
  },
  tagTextActive: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateNoticeScreen;
