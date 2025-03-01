import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../config";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker"; // Import DateTimePicker
import supabase from "../../services/supabaseclient";
import { COURSES, DIVISIONS, YEARS } from "../constant";

const CreateAssignment = () => {
  const navigation = useNavigation();
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [division, setDivision] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [file, setFile] = useState(null);
  const [assignedBy, setAssignedBy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        if (!auth.currentUser) return;
        const user = auth.currentUser;
        const userQuery = query(collection(db, "users"), where("email", "==", user.email));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setAssignedBy(userData.name || user.email);
        }

        const teachersQuery = query(
          collection(db, "teachersinfo"),
          where("teacheremail", "==", user.email)
        );
        const teachersSnapshot = await getDocs(teachersQuery);
        if (!teachersSnapshot.empty) {
          const teacherData = teachersSnapshot.docs[0].data();
          setDepartment(teacherData.department || "");
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        Alert.alert("Error", "Failed to fetch teacher data.");
      }
    };
    fetchTeacherData();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        if (!department) return;
        const q = query(collection(db, "subjects"), where("department", "==", department));
        const querySnapshot = await getDocs(q);
        const fetchedSubjects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().subjectName,
        }));
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        Alert.alert("Error", "Failed to fetch subjects.");
      }
    };
    fetchSubjects();
  }, [department]);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (result.type === "success") {
        setFile(result.assets[0]);
      } else {
        Alert.alert("Error", "No file selected.");
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file.");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const currentDate = new Date();
    if (dueDate < currentDate) {
      Alert.alert("Error", "Due date cannot be in the past.");
      setIsLoading(false);
      return;
    }

    if (!marks || parseInt(marks) <= 0) {
      Alert.alert("Error", "Marks must be a positive number.");
      setIsLoading(false);
      return;
    }

    try {
      let fileURL = "";
      if (file) {
        const filePath = `assignments/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignments")
          .upload(filePath, file.uri, {
            upsert: true,
            onUploadProgress: (progressEvent) => {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            },
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = await supabase.storage
          .from("assignments")
          .getPublicUrl(filePath);
        fileURL = publicUrl;
      }

      await addDoc(collection(db, "assignments"), {
        description,
        department,
        division,
        year,
        subject,
        marks: parseInt(marks),
        dueDate: dueDate.toISOString().split("T")[0],
        fileURL,
        assignedBy,
        timestamp: new Date().toISOString(),
        title: `${subject} Assignment`,
      });

      Alert.alert("Success", "Assignment added successfully!");
      resetForm();
      navigation.goBack();
    } catch (error) {
      console.error("Error adding assignment:", error);
      Alert.alert("Error", "Failed to add assignment. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setDescription("");
    setDepartment("");
    setDivision("");
    setYear("");
    setSubject("");
    setMarks("");
    setDueDate(new Date());
    setFile(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Assignment</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {isLoading && (
          <ActivityIndicator size="large" color="#2E86C1" style={styles.loading} />
        )}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            multiline
            numberOfLines={4}
          />
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Assigned By</Text>
          <TextInput
            style={styles.input}
            value={assignedBy}
            editable={false}
            placeholder="Assigned By"
          />
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Department</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={department}
              onValueChange={(itemValue) => setDepartment(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Department" value="" />
              {Object.values(COURSES).map((dept) => (
                <Picker.Item key={dept} label={dept} value={dept} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Division</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={division}
              onValueChange={(itemValue) => setDivision(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Division" value="" />
              {Object.values(DIVISIONS).map((div) => (
                <Picker.Item key={div} label={div} value={div} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Year</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={year}
              onValueChange={(itemValue) => setYear(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Year" value="" />
              {Object.values(YEARS).map((yr) => (
                <Picker.Item key={yr} label={yr} value={yr} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Subject</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={subject}
              onValueChange={(itemValue) => setSubject(itemValue)}
              style={styles.picker}
              enabled={subjects.length > 0}
            >
              <Picker.Item label="Select Subject" value="" />
              {subjects.map((subj) => (
                <Picker.Item key={subj.id} label={subj.name} value={subj.name} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Marks</Text>
          <TextInput
            style={styles.input}
            value={marks}
            onChangeText={setMarks}
            placeholder="Enter marks"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {dueDate.toISOString().split("T")[0]}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Upload File</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload} disabled={isLoading}>
            <Text style={styles.uploadButtonText}>{file ? file.name : "Select File"}</Text>
          </TouchableOpacity>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Uploading: {Math.round(uploadProgress)}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? <ActivityIndicator size="small" color="#fff" /> : "POST"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F6F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E86C1",
    padding: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
    textAlign: "left",
  },
  content: {
    flex: 1,
    padding: 15,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 0,
  },
  picker: {
    height: 50,
    width: "100",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButtonText: {
    fontSize: 16,
    color: "#2E86C1",
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2E86C1",
  },
  submitButton: {
    backgroundColor: "#2E86C1",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
});

export default CreateAssignment;