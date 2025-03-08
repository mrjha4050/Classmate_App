import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../config";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../services/supabaseclient";

const AssignmentDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { assignmentId } = route.params;
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState(null);  
  const [editing, setEditing] = useState(false); 
  const [showEditForm, setShowEditForm] = useState(false); 
  const [newDescription, setNewDescription] = useState("");  
  const [newDueDate, setNewDueDate] = useState("");                                                 

  useEffect(() => {
    console.log("Supabase client:", supabase);
    const fetchUserRoleAndAssignmentDetails = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Fetch user role
        if (!auth?.currentUser?.uid) {
          throw new Error("No authenticated user found.");
        }
        const userId = auth.currentUser.uid;
        const userDocRef = doc(db, "users", userId);  
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error("User document not found.");
        }
        const userData = userDocSnap.data();
        const role = userData.role || "unknown";  
        setUserRole(role);

        // Fetch assignment details
        const docRef = doc(db, "assignments", assignmentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAssignment(data);
          setNewDescription(data.description || ""); // Pre-fill edit fields
          setNewDueDate(data.dueDate || ""); // Pre-fill edit fields
        } else {
          setError("Assignment not found.");
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
        setError("Failed to fetch data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserRoleAndAssignmentDetails();
  }, [assignmentId]);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log("File picked successfully:", file);
        setFile(file);
      } else if (result.canceled) {
        console.log("File picking cancelled by the user.");
        Alert.alert("Cancelled", "File picking was cancelled.");
      } else {
        console.log("File picking failed:", result);
        setError("Failed to pick document. Please try again.");
      }
    } catch (error) {
      console.error("Error picking document:", error.message);
      setError("Failed to pick document. Please try again.");
    }
  };

  const handleSubmitAssignment = async () => {
    if (!file) {
      Alert.alert("Error", "Please select a file to upload.");
      return;
    }
    setUploading(true);
    try {
      console.log("Supabase client check:", supabase);
      if (!supabase) {
        throw new Error("Supabase client is not initialized.");
      }

      console.log("Auth current user:", auth.currentUser);
      if (!auth.currentUser) {
        throw new Error("No authenticated user found.");
      }

      const idToken = await auth.currentUser.getIdToken();
      console.log("Firebase ID Token:", idToken);

      const filePath = `submissions/${auth.currentUser.uid}/${file.name}`;
      console.log("Uploading file to:", filePath);

      const { data, error: uploadError } = await supabase.storage
        .from("student-submissions")
        .upload(filePath, file.uri, {
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        throw uploadError;
      }
      console.log("File uploaded successfully:", data);

      const submissionData = {
        assignmentId,
        studentId: auth.currentUser.uid,
        filePath: data.path,
        submittedAt: new Date().toISOString(),
      };

      console.log("Submitting to Firestore:", submissionData);
      await addDoc(collection(db, "student-submissions"), submissionData);
      console.log("Submission data added to Firestore");
      Alert.alert("Success", "Assignment submitted successfully.");
      setFile(null);
    } catch (error) {
      console.error("Error submitting assignment:", error.message);
      if (error.message.includes("row-level security policy")) {
        setError("Upload failed due to security policy. Contact admin or check permissions.");
      } else {
        setError("Failed to submit assignment. Please try again. Details: " + error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    setEditing(true);
    try {
      const docRef = doc(db, "assignments", assignmentId);
      await updateDoc(docRef, {
        description: newDescription || assignment.description,
        dueDate: newDueDate || assignment.dueDate,
      });
      setAssignment({ ...assignment, description: newDescription, dueDate: newDueDate });
      setShowEditForm(false); // Hide form after save
      Alert.alert("Success", "Assignment updated successfully.");
    } catch (error) {
      console.error("Error updating assignment:", error.message);
      setError("Failed to update assignment. Please try again.");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteAssignment = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this assignment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setEditing(true);
            try {
              const docRef = doc(db, "assignments", assignmentId);
              await deleteDoc(docRef);
              Alert.alert("Success", "Assignment deleted successfully.");
              navigation.goBack(); // Navigate back after deletion
            } catch (error) {
              console.error("Error deleting assignment:", error.message);
              setError("Failed to delete assignment. Please try again.");
            } finally {
              setEditing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignment Details</Text>
      </View>

      {isLoading || editing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86C1" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.title}>{assignment?.title || assignment?.subject}</Text>
          <Text style={styles.description}>{assignment?.description}</Text>
          <Text style={styles.details}>Due Date: {assignment?.dueDate}</Text>
          <Text style={styles.details}>Marks: {assignment?.marks}</Text>
          <Text style={styles.details}>Created by: {assignment?.assignedBy}</Text>
          <Text style={styles.details}>Department: {assignment?.department}</Text>
          <Text style={styles.details}>Division: {assignment?.division}</Text>
          <Text style={styles.details}>Year: {assignment?.year}</Text>
          {assignment?.fileURL && (
            <TouchableOpacity onPress={() => Alert.alert("Download", "Feature not implemented yet.")}>
              <Text style={styles.fileLink}>Download File</Text>
            </TouchableOpacity>
          )}
          {userRole === "student" ? (
            <View style={styles.uploadSection}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
                <Text style={styles.buttonText}>Upload Assignment</Text>
              </TouchableOpacity>
              {file && (
                <Text style={styles.fileName}>Selected File: {file.name}</Text>
              )}
              {file && !uploading && (
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAssignment}>
                  <Text style={styles.buttonText}>Submit Assignment</Text>
                </TouchableOpacity>
              )}
              {uploading && (
                <ActivityIndicator size="small" color="#2E86C1" />
              )}
            </View>
          ) : userRole === "teacher" ? (
            <View style={styles.teacherSection}>
              {!showEditForm ? (
                <TouchableOpacity style={styles.editButton} onPress={() => setShowEditForm(true)}>
                  <Text style={styles.buttonText}>Edit Assignment</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.input}
                    value={newDescription}
                    onChangeText={setNewDescription}
                    placeholder="Enter new description"
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    value={newDueDate}
                    onChangeText={setNewDueDate}
                    placeholder="Enter new due date (e.g., YYYY-MM-DD)"
                  />
                  <View style={styles.formButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditForm(false)}>
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                      <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAssignment}>
                <Text style={styles.buttonText}>Delete Assignment</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#FE8441",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    backgroundColor: "#fee",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  errorText: {
    color: "#dc3545",
    textAlign: "center",
  },
  content: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  details: {
    fontSize: 14,
    color: "#666",
  },
  fileLink: {
    fontSize: 14,
    color: "#007BFF",
    marginTop: 5,
  },
  uploadSection: {
    marginTop: 20,
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  teacherSection: {
    marginTop: 20,
  },
  editButton: {
    backgroundColor: "#FFA500", // Orange for edit
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#DC3545", // Red for delete
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  editForm: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#28a745", // Green for save
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginLeft: 5,
  },
  cancelButton: {
    backgroundColor: "#6c757d", // Gray for cancel
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginRight: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  fileName: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
});

export default AssignmentDetail;