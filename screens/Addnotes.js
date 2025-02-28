import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../config"; // Import Firestore instance
import { supabase } from "../services/supabaseclient";
import { COURSES } from "../components/constant"; // Import COURSES constant
import * as DocumentPicker from "expo-document-picker"; // For file picking in React Native
import { AuthContext } from "../AuthContext"; // Import AuthContext for user authentication (optional)

const AddNotes = () => {
  const [formData, setFormData] = useState({
    description: "",
    department: COURSES[0], // Default to the first course in COURSES ("Bsc.IT")
    division: "A",
    year: "Third Year",
    subject: "",
    unit: "1",
  });

  const [subjects, setSubjects] = useState([]); // State to store fetched subjects from Firestore
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [file, setFile] = useState(null); // State to store the selected file
  const [uploadProgress, setUploadProgress] = useState(0); // State for upload progress
  const { user } = useContext(AuthContext); // Optional: Use AuthContext for user info

  // Fetch subjects from Firestore based on the selected department
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null); // Reset error state

      try {
        console.log("Fetching subjects for department:", formData.department);
        if (!formData.department) {
          setSubjects([]);
          setFormData((prev) => ({ ...prev, subject: "" }));
          return;
        }

        const subjectsRef = collection(db, "subjects");
        console.log("Firestore collection reference:", subjectsRef.path); // Debug log

        // Query Firestore for subjects with the matching department (case-sensitive)
        const q = query(
          subjectsRef,
          where("department", "==", formData.department.trim())
        );
        console.log("Query created:", q); // Debug log

        const querySnapshot = await getDocs(q);
        console.log("Query snapshot:", querySnapshot); // Debug log

        if (querySnapshot.empty) {
          console.log(
            "No documents found for department:",
            formData.department
          );
          setSubjects([]);
          setFormData((prev) => ({ ...prev, subject: "" }));
          setError("No subjects found for the selected department.");
          return;
        }

        const fetchedSubjects = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Document data:", data); // Debug log for each document
          return {
            id: doc.id,
            name: data.subjectName || "Unknown", // Use subjectName from Firestore structure
          };
        });

        console.log("Fetched subjects from Firestore:", fetchedSubjects);
        setSubjects(fetchedSubjects);

        // Set the first subject as default if available
        if (fetchedSubjects.length > 0) {
          setFormData((prev) => ({
            ...prev,
            subject: fetchedSubjects[0].name,
          }));
        } else {
          setFormData((prev) => ({ ...prev, subject: "" }));
        }
      } catch (error) {
        console.error("Detailed error fetching subjects from Firestore:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        setError(`Failed to fetch subjects: ${error.message}`);
        setSubjects([]);
        setFormData((prev) => ({ ...prev, subject: "" }));
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [formData.department]);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types, adjust as needed
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        console.log("File selection cancelled");
        return;
      }

      console.log("File selected in modal:", result.assets[0]); // Debug log
      setFile(result.assets[0]);
    } catch (error) {
      console.error("Error picking file:", error);
      setError("Failed to pick file. Please try again.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      let supabaseFilePath = null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `notes/${fileName}`; // Use a folder 'notes' in Supabase storage

        // Convert the file URI to a Blob for Supabase upload
        const response = await fetch(file.uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from("notes") // Supabase bucket name
          .upload(filePath, blob, {
            upsert: true,
            onUploadProgress: (progressEvent) => {
              const progress =
                (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            },
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("notes").getPublicUrl(filePath);

        supabaseFilePath = filePath; // Store the Supabase file path instead of URL
        console.log("File uploaded successfully to Supabase:", publicUrl);
      }

      const notesRef = collection(db, "notes");
      await addDoc(notesRef, {
        description: formData.description,
        department: formData.department,
        division: formData.division,
        year: formData.year,
        subject: formData.subject,
        unit: formData.unit,
        filePath: supabaseFilePath, // Save the Supabase file path instead of URL
        timestamp: new Date().toISOString(), // Add a timestamp for when the note was created
      });

      console.log("Note added successfully to Firestore!");
      // Reset the form
      setFormData({
        description: "",
        department: COURSES[0], // Reset to the first course in COURSES
        division: "A",
        year: "Third Year",
        subject: "",
        unit: "1",
      });
      setSubjects([]); // Reset subjects since they’re fetched from Firestore
      setFile(null); // Reset file
      setUploadProgress(0); // Reset upload progress
    } catch (error) {
      console.error("Error adding note to Firestore or uploading file:", error);
      setError(
        "Failed to save note or upload file. Check console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Add Notes</Text>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#2E86C1"
            style={styles.loading}
          />
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.form}>
          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* File Upload Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Upload File</Text>
            <TouchableOpacity
              style={styles.fileUploadButton}
              onPress={handleFileUpload}
            >
              <View style={styles.fileUploadContent}>
                {/* You can add an Image component here for the envelope icon if needed */}
                <Text style={styles.fileUploadText}>
                  {file ? file.name : "Click to upload a file"}
                </Text>
              </View>
            </TouchableOpacity>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Uploading: {Math.round(uploadProgress)}%
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Right Column Fields (Department, Division, Year, Subject, Unit) */}
          <View style={styles.rightColumn}>
            {/* Department (from COURSES constant) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Department</Text>
              <View style={styles.pickerContainer}>
                <TextInput
                  style={styles.pickerInput}
                  value={formData.department}
                  onChangeText={(text) => handleChange("department", text)}
                  placeholder="Select Department"
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      "Select Department",
                      "",
                      [
                        { text: "Cancel", style: "cancel" },
                        ...COURSES.map((dept) => ({
                          text: dept,
                          onPress: () => handleChange("department", dept),
                          style: "default",
                        })),
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.pickerButtonText}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Division */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Division</Text>
              <View style={styles.pickerContainer}>
                <TextInput
                  style={styles.pickerInput}
                  value={formData.division}
                  onChangeText={(text) => handleChange("division", text)}
                  placeholder="Select Division"
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      "Select Division",
                      "",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "A",
                          onPress: () => handleChange("division", "A"),
                          style: "default",
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.pickerButtonText}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Year */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Year</Text>
              <View style={styles.pickerContainer}>
                <TextInput
                  style={styles.pickerInput}
                  value={formData.year}
                  onChangeText={(text) => handleChange("year", text)}
                  placeholder="Select Year"
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      "Select Year",
                      "",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Third Year",
                          onPress: () => handleChange("year", "Third Year"),
                          style: "default",
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.pickerButtonText}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Subject (Dropdown based on department from Firestore) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Subject</Text>
              <View style={styles.pickerContainer}>
                <TextInput
                  style={styles.pickerInput}
                  value={formData.subject}
                  onChangeText={(text) => handleChange("subject", text)}
                  placeholder="Select Subject"
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      "Select Subject",
                      "",
                      [
                        { text: "Cancel", style: "cancel" },
                        ...subjects.map((subject) => ({
                          text: subject.name,
                          onPress: () => handleChange("subject", subject.name),
                          style: "default",
                        })),
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.pickerButtonText}>▼</Text>
                </TouchableOpacity>
              </View>
              {loading && (
                <Text style={styles.loadingText}>Loading subjects...</Text>
              )}
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Unit */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={formData.unit}
                onChangeText={(text) => handleChange("unit", text)}
                placeholder="Enter unit"
                keyboardType="numeric"
              />
            </View>

            {/* POST Button */}
            <Button
              title={loading ? "Submitting..." : "POST"}
              onPress={handleSubmit}
              disabled={loading}
              color="#d3d3d3" // Gray color from the screenshot
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2E86C1",
    marginBottom: 16,
  },
  form: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  inputContainer: {
    width: "100%", // Full width on mobile, adjust for larger screens if needed
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top", // Ensure text starts at the top in multiline TextInput
  },
  fileUploadButton: {
    borderWidth: 2,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  fileUploadContent: {
    alignItems: "center",
  },
  fileUploadText: {
    fontSize: 16,
    color: "#666",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6200ee",
  },
  rightColumn: {
    width: "100%", // Full width on mobile, adjust for larger screens if needed
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  pickerInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
    color: "#333",
  },
  pickerButton: {
    padding: 8,
    backgroundColor: "#e0e0e0",
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#333",
  },
  loading: {
    marginVertical: 16,
  },

  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#ff0000",
    marginTop: 8,
  },
});

export default AddNotes;
