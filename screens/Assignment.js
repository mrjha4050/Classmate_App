import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config"; // Added auth import
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import supabase from "../services/supabaseclient";

const Assignments = () => {
  const navigation = useNavigation();
  const [assignments, setAssignments] = useState([]);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filter, setFilter] = useState("mine"); // "mine" or "all"

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userQuery = query(collection(db, "users"), where("email", "==", user.email));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            setUserName(userData.name || "Unknown");
          } else {
            setError("User data not found.");
          }
        } else {
          setError("No authenticated user found.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to fetch user data. Please try again.");
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!userName) return;
      try {
        setIsLoading(true);
        setError("");

        let q;
        if (filter === "mine") {
          q = query(collection(db, "assignments"), where("assignedBy", "==", userName));
        } else {
          q = query(collection(db, "assignments"));
        }

        const querySnapshot = await getDocs(q);
        const assignmentIdsWithFiles = querySnapshot.docs
          .filter((doc) => doc.data().filePath)
          .map((doc) => doc.id);

        const fetchedAssignments = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const assignmentData = doc.data();
            if (assignmentData.filePath && assignmentIdsWithFiles.includes(doc.id)) {
              try {
                const { data: fileData } = await supabase
                  .storage
                  .from("assignments")
                  .getPublicUrl(assignmentData.filePath);
                return {
                  id: doc.id,
                  ...assignmentData,
                  fileURL: fileData.publicUrl || "",
                };
              } catch (fileError) {
                console.warn(`Failed to fetch file URL for ${doc.id}:`, fileError);
                return {
                  id: doc.id,
                  ...assignmentData,
                  fileURL: "",
                };
              }
            }
            return {
              id: doc.id,
              ...assignmentData,
            };
          })
        );
        setAssignments(fetchedAssignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setError("Failed to fetch assignments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, [userName, filter]);

  const handleAddAssignments = () => {
    navigation.navigate("AddAssignment");
  };

  const handleViewAssignment = (id) => {
    navigation.navigate("AssignmentDetail", { assignmentId: id });
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleDeleteAssignment = async (id, filePath) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this assignment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "assignments", id));
              if (filePath) {
                await supabase.storage.from("assignments").remove([filePath]);
              }
              setAssignments(assignments.filter((assignment) => assignment.id !== id));
            } catch (error) {
              console.error("Error deleting assignment:", error);
              setError("Failed to delete assignment. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleUpdateAssignment = async () => {
    try {
      const assignmentRef = doc(db, "assignments", selectedAssignment.id);
      await updateDoc(assignmentRef, {
        subject: selectedAssignment.subject,
        description: selectedAssignment.description,
        dueDate: selectedAssignment.dueDate,
        marks: selectedAssignment.marks,
        assignedBy: selectedAssignment.assignedBy,
        department: selectedAssignment.department,
        division: selectedAssignment.division,
        title: selectedAssignment.title,
        year: selectedAssignment.year,
        timestamp: selectedAssignment.timestamp,
      });

      setAssignments(
        assignments.map((assignment) =>
          assignment.id === selectedAssignment.id ? selectedAssignment : assignment
        )
      );
      setIsEditModalOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error("Error updating assignment:", error);
      setError("Failed to update assignment. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignments</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilter(filter === "mine" ? "all" : "mine")}
          >
            <Text style={styles.filterButtonText}>
              {filter === "mine" ? "All Assignments" : "My Assignments"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddAssignments}>
            <Text style={styles.addButtonText}>Create Assignment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86C1" />
        </View>
      ) : assignments.length > 0 ? (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.assignmentCard}>
              <TouchableOpacity
                style={styles.assignmentContent}
                onPress={() => handleViewAssignment(item.id)}
              >
                <Text style={styles.assignmentTitle}>{item.title || item.subject}</Text>
                <Text style={styles.assignmentDescription}>{item.description}</Text>
                <Text style={styles.assignmentDetails}>Due Date: {item.dueDate}</Text>
                <Text style={styles.assignmentDetails}>Marks: {item.marks}</Text>
                <Text style={styles.assignmentDetails}>Created by: {item.assignedBy}</Text>
                <Text style={styles.assignmentDetails}>Department: {item.department}</Text>
                <Text style={styles.assignmentDetails}>Division: {item.division}</Text>
                <Text style={styles.assignmentDetails}>Year: {item.year}</Text>
                {item.fileURL && (
                  <TouchableOpacity
                    onPress={() => Alert.alert("Download", "Feature not implemented yet.")}
                  >
                    <Text style={styles.fileLink}>Download File</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {item.assignedBy === userName && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditAssignment(item)}
                  >
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAssignment(item.id, item.filePath)}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.noAssignmentsText}>No assignments available.</Text>}
        />
      ) : (
        <View style={styles.noAssignmentsContainer}>
          <Text style={styles.noAssignmentsText}>No assignments available.</Text>
        </View>
      )}

      <Modal
        visible={isEditModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Assignment</Text>
            <ScrollView style={styles.modalScroll}>
              <TextInput
                style={styles.input}
                value={selectedAssignment?.title || selectedAssignment?.subject || ""}
                onChangeText={(text) =>
                  setSelectedAssignment((prev) => ({ ...prev, title: text, subject: text }))
                }
                placeholder="Title/Subject"
                autoFocus
              />
              <TextInput
                style={styles.input}
                value={selectedAssignment?.description || ""}
                onChangeText={(text) =>
                  setSelectedAssignment((prev) => ({ ...prev, description: text }))
                }
                placeholder="Description"
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={styles.input}
                value={selectedAssignment?.dueDate || ""}
                onChangeText={(text) =>
                  setSelectedAssignment((prev) => ({ ...prev, dueDate: text }))
                }
                placeholder="Due Date (YYYY-MM-DD)"
              />
              <TextInput
                style={styles.input}
                value={selectedAssignment?.marks || ""}
                onChangeText={(text) =>
                  setSelectedAssignment((prev) => ({ ...prev, marks: text }))
                }
                placeholder="Marks"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={selectedAssignment?.department || ""}
                onChangeText={(text) =>
                  setSelectedAssignment((prev) => ({ ...prev, department: text }))
                }
                placeholder="Department"
              />
              <TextInput
                style={styles.input}
                value={selectedAssignment?.division || ""}
                onChangeText={(text) =>
                  setSelectedAssignment((prev) => ({ ...prev, division: text }))
                }
                placeholder="Division"
              />
              <TextInput
                style={styles.input}
                value={selectedAssignment?.year || ""}
                onChangeText={(text) =>
                  setSelectedAssignment((prev) => ({ ...prev, year: text }))
                }
                placeholder="Year"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditModalOpen(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleUpdateAssignment}
                >
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#2E86C1",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  assignmentCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  assignmentContent: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  assignmentDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  assignmentDetails: {
    fontSize: 14,
    color: "#666",
  },
  fileLink: {
    fontSize: 14,
    color: "#007BFF",
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 5,
  },
  editButton: {
    backgroundColor: "#ffc107",
    padding: 5,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    padding: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 20,
  },
  noAssignmentsContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  noAssignmentsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E86C1",
    marginBottom: 15,
    textAlign: "center",
  },
  modalScroll: {
    maxHeight: "60%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
});

export default Assignments;