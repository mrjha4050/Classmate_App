import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { collection, addDoc, getDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "../config";
import { getAuth } from "firebase/auth";
import * as Notifications from "expo-notifications";

const CreateNoticeScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [teacher, setTeacher] = useState("");
  const [tag, setTag] = useState("Announcement");
  const [department, setDepartment] = useState(""); // Store teacher's department

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      try {
        // Fetch teacher's name and department
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setTeacher(userDocSnap.data().name);

          // Fetch teacher's department from teachersinfo
          const teacherInfoRef = doc(db, "teachersinfo", auth.currentUser.uid);
          const teacherInfoSnap = await getDoc(teacherInfoRef);

          if (teacherInfoSnap.exists()) {
            setDepartment(teacherInfoSnap.data().department);
          } else {
            Alert.alert("Error", "Teacher details not found!");
          }
        } else {
          Alert.alert("Error", "No such user!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Error fetching user data");
      }
    };

    fetchUser();
  }, []);

  const handleCreateNotice = async () => {
    if (!title || !content || !teacher || !tag || !department) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    try {
      const currentDate = new Date().toISOString();
      await addDoc(collection(db, "notices"), {
        title,
        date: currentDate,
        content,
        teacher,
        tag,
        department, // Include department in the notice
        readBy: [],
      });

      Alert.alert("Success", "Notice created successfully!");

      // Send notifications to students in the same department
      await sendNotificationsToDepartmentStudents();

      navigation.goBack();
    } catch (error) {
      console.error("Error creating notice:", error);
      Alert.alert("Error", "Failed to create notice. Please try again.");
    }
  };

  const sendNotificationsToDepartmentStudents = async () => {
    try {
      // Fetch students in the same department
      const studentsQuery = query(
        collection(db, "students"),
        where("department", "==", department)
      );
      const querySnapshot = await getDocs(studentsQuery);

      const tokens = querySnapshot.docs
        .map((doc) => doc.data().expoPushToken)
        .filter((token) => token);

      console.log("Sending notifications to tokens:", tokens);

      // Send notifications to each student
      for (const token of tokens) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "New Notice",
            body: `A new notice titled "${title}" has been published in ${department}.`,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      Alert.alert("Error", "Failed to send notifications.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          multiline
          numberOfLines={10}
          style={styles.input}
          placeholder="Content"
          value={content}
          onChangeText={setContent}
        />
        <TextInput
          style={styles.input}
          placeholder="Teacher's Name"
          value={teacher}
          editable={false}
        />
        <Text style={styles.label}>Tag</Text>
        <View style={styles.tagContainer}>
          {["Announcement", "TimeTable", "Sports", "Event"].map((tagName) => (
            <TouchableOpacity
              key={tagName}
              style={[
                styles.tagButton,
                tag === tagName && styles.tagButtonActive,
              ]}
              onPress={() => setTag(tagName)}
            >
              <Text
                style={[
                  styles.tagText,
                  tag === tagName && styles.tagTextActive,
                ]}
              >
                {tagName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNotice}>
          <Text style={styles.createButtonText}>Create Notice</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  input: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tagButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 20,
  },
  tagButtonActive: {
    backgroundColor: "#4CAF50",
  },
  tagText: {
    color: "#555",
  },
  tagTextActive: {
    color: "#fff",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateNoticeScreen;