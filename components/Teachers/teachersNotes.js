import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config";
import { AuthContext } from "../../AuthContext";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system"; // For downloading files
import * as Sharing from "expo-sharing"; // For sharing/opening files
import { supabase } from "../../services/supabaseclient"; // Import Supabase client

const TeachersNotes = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [unitFilter, setUnitFilter] = useState("All");
  const [loading, setLoading] = useState(false); // Add loading state for downloads
  const { user } = useContext(AuthContext);
  const navigation = useNavigation(); // Use navigation hook

  // Log user object for debugging
  useEffect(() => {
    console.log("Current user:", user);
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          User not authenticated. Please log in.
        </Text>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    const notesCollection = collection(db, "notes");
    let q = query(notesCollection);

    if (subjectFilter !== "All") {
      q = query(q, where("subject", "==", subjectFilter));
    }
    if (unitFilter !== "All") {
      q = query(q, where("unit", "==", unitFilter));
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notesList = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          let formattedTimestamp = "Invalid Date";
          if (data.timestamp && typeof data.timestamp === "string") {
            const parsedDate = new Date(data.timestamp);
            formattedTimestamp = isNaN(parsedDate.getTime())
              ? "Invalid Date"
              : parsedDate.toLocaleString();
          } else if (data.timestamp && data.timestamp.toDate) {
            formattedTimestamp = data.timestamp.toDate().toLocaleString();
          } else if (data.timestamp && typeof data.timestamp === "number") {
            formattedTimestamp = new Date(data.timestamp).toLocaleString();
          }
          notesList.push({
            id: doc.id,
            description: data.description,
            subject: data.subject,
            unit: data.unit,
            timestamp: formattedTimestamp,
            department: data.department,
            division: data.division,
            year: data.year,
            filePath: data.filePath,
          });
        });
        setNotes(notesList);
      },
      (error) => {
        console.error("Error fetching notes:", error);
        Alert.alert("Error", "Failed to fetch notes. Please try again.");
      }
    );

    return () => unsubscribe();
  }, [subjectFilter, unitFilter]);

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addDoc(collection(db, "notes"), {
        description: newNote,
        subject: subjectFilter !== "All" ? subjectFilter : undefined,
        unit: unitFilter !== "All" ? unitFilter : undefined,
        timestamp: new Date().toISOString(),
        department: undefined,
        division: undefined,
        year: undefined,
        filePath: null,
      });
      setNewNote("");
    } catch (error) {
      console.error("Error adding note: ", error);
      Alert.alert("Error", "Failed to add note. Please try again.");
    }
  };

  const handleCreateNotes = () => {
    try {
      console.log("Navigating to AddNotes...");
      navigation.navigate("AddNotes");
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Error", "Failed to navigate to Add Notes screen.");
    }
  };

  const handleDownloadFile = async (filePath) => {
    if (!filePath) {
      Alert.alert("Error", "No file available for download.");
      return;
    }

    try {
      setLoading(true); // Show loading indicator during download
      console.log("Downloading file from Supabase:", filePath);

      // Generate the public URL for the file in Supabase storage
      const { data, error } = await supabase.storage
        .from("notes") // Supabase bucket name
        .getPublicUrl(filePath);

      if (error) {
        throw error;
      }

      const publicUrl = data.publicUrl;
      console.log("Public URL for download:", publicUrl);

      // Download the file to a temporary location
      const downloadDir =
        FileSystem.cacheDirectory +
        `note_${Date.now()}_${filePath.split("/").pop()}`;
      const downloadRes = await FileSystem.downloadAsync(
        publicUrl,
        downloadDir
      );

      if (downloadRes.status !== 200) {
        throw new Error("Download failed");
      }

      console.log("File downloaded to:", downloadRes.uri);

      // Share or open the file (e.g., PDF, image, etc.)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: "application/pdf", // Adjust based on file type (e.g., "image/jpeg" for images)
          dialogTitle: "Download File",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      Alert.alert("Error", `Failed to download file: ${error.message}`);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Create Notes Button (only for teachers) - Header Version */}
            {user?.role === "teacher" ? (
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateNotes}
              >
                <Text style={styles.createButtonText}>Create Notes</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.debugText}>
                User role: {user?.role || "No role"} (Button hidden for
                non-teachers)
              </Text>
            )}

            <Text style={styles.filterTitle}>Filters</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  subjectFilter === "All" && styles.activeFilter,
                ]}
                onPress={() => setSubjectFilter("All")}
              >
                <Text>All Subjects</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  subjectFilter === "SIC" && styles.activeFilter,
                ]}
                onPress={() => setSubjectFilter("SIC")}
              >
                <Text>SIC</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  unitFilter === "All" && styles.activeFilter,
                ]}
                onPress={() => setUnitFilter("All")}
              >
                <Text>All Units</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  unitFilter === "1" && styles.activeFilter,
                ]}
                onPress={() => setUnitFilter("1")}
              >
                <Text>Unit 1</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>{item.subject || "No Subject"}</Text>
            <Text style={styles.noteContent}>
              {item.description || "No description"}
            </Text>
            <Text style={styles.noteMeta}>
              Subject: {item.subject || "N/A"} | Unit: {item.unit || "N/A"} |
              Posted: {item.timestamp}
            </Text>
            <Text style={styles.noteMeta}>
              Department: {item.department || "N/A"} | Division:{" "}
              {item.division || "N/A"}
            </Text>
            {item.year && (
              <Text style={styles.noteMeta}>Year: {item.year}</Text>
            )}
            {item.filePath && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownloadFile(item.filePath)}
              >
                <Text style={styles.downloadButtonText}>Download File</Text>
              </TouchableOpacity>
            )}
            {loading && (
              <ActivityIndicator
                size="small"
                color="#007AFF"
                style={styles.loadingIndicator}
              />
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noNotesText}>No notes available.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
    textAlign: "center",
    padding: 20,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "#800080", // Purple color from screenshot
    borderColor: "#800080",
    color: "#fff", // White text for contrast
  },
  noteCard: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    marginBottom: 8,
  },
  noteMeta: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  downloadButton: {
    backgroundColor: "#007AFF", // Blue button for download
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    alignItems: "center",
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingIndicator: {
    marginTop: 8,
  },
  addNoteContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  input: {
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
  },
  noPermissionText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    padding: 20,
  },
  noNotesText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    padding: 20,
  },
  createButton: {
    backgroundColor: "#28a745", // Green button for visibility
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  debugText: {
    fontSize: 12,
    color: "#ff0000",
    textAlign: "center",
    marginBottom: 16,
  },
});

export default TeachersNotes;
