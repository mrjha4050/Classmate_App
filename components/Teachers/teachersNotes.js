import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config";
import { AuthContext } from "../../AuthContext"; // Import AuthContext

const TeachersNotes = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [unitFilter, setUnitFilter] = useState("All");
  const { user } = useContext(AuthContext); // Use useContext to access user

  // Fetch notes based on filters
  useEffect(() => {
    const notesCollection = collection(db, "notes");
    let q = query(notesCollection);

    if (subjectFilter !== "All") {
      q = query(q, where("subject", "==", subjectFilter));
    }
    if (unitFilter !== "All") {
      q = query(q, where("unit", "==", unitFilter));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notesList = [];
      querySnapshot.forEach((doc) => {
        notesList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setNotes(notesList);
    });

    return () => unsubscribe();
  }, [subjectFilter, unitFilter]);

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addDoc(collection(db, "notes"), {
        title: "New Note",
        content: newNote,
        subject: "SQA", // Default subject (can be dynamic)
        unit: "2", // Default unit (can be dynamic)
        timestamp: new Date(),
        postedBy: user?.email || "Anonymous",
      });
      setNewNote("");
    } catch (error) {
      console.error("Error adding note: ", error);
    }
  };

  return (
    // <SafeAreaView style={styles.container}>
    //   <ScrollView>
    //     {/* Filter Section */}
    //     <View style={styles.filterContainer}>
    //       <Text style={styles.filterTitle}>Filters</Text>
    //       <View style={styles.filterRow}>
    //         <TouchableOpacity
    //           style={[
    //             styles.filterButton,
    //             subjectFilter === "All" && styles.activeFilter,
    //           ]}
    //           onPress={() => setSubjectFilter("All")}
    //         >
    //           <Text>All Subjects</Text>
    //         </TouchableOpacity>
    //         <TouchableOpacity
    //           style={[
    //             styles.filterButton,
    //             subjectFilter === "SQA" && styles.activeFilter,
    //           ]}
    //           onPress={() => setSubjectFilter("SQA")}
    //         >
    //           <Text>SQA</Text>
    //         </TouchableOpacity>
    //       </View>
    //       <View style={styles.filterRow}>
    //         <TouchableOpacity
    //           style={[
    //             styles.filterButton,
    //             unitFilter === "All" && styles.activeFilter,
    //           ]}
    //           onPress={() => setUnitFilter("All")}
    //         >
    //           <Text>All Units</Text>
    //         </TouchableOpacity>
    //         <TouchableOpacity
    //           style={[
    //             styles.filterButton,
    //             unitFilter === "2" && styles.activeFilter,
    //           ]}
    //           onPress={() => setUnitFilter("2")}
    //         >
    //           <Text>Unit 2</Text>
    //         </TouchableOpacity>
    //       </View>
    //     </View>

    //     {/* Notes List */}
    //     <FlatList
    //       data={notes}
    //       keyExtractor={(item) => item.id}
    //       renderItem={({ item }) => (
    //         <View style={styles.noteCard}>
    //           <Text style={styles.noteTitle}>{item.title}</Text>
    //           <Text style={styles.noteContent}>{item.content}</Text>
    //           <Text style={styles.noteMeta}>
    //             Posted by: {item.postedBy} |{" "}
    //             {item.timestamp?.toDate().toLocaleString()}
    //           </Text>
    //         </View>
    //       )}
    //     />
    //   </ScrollView>

    //   {/* Add Note Section (Only for Teachers) */}
    //   {user?.role === "teacher" && (
    //     <View style={styles.addNoteContainer}>
    //       <TextInput
    //         style={styles.input}
    //         value={newNote}
    //         onChangeText={setNewNote}
    //         placeholder="Add a new note"
    //         multiline
    //       />
    //       <Button title="Add Note" onPress={addNote} />
    //     </View>
    //   )}
    // </SafeAreaView>
    <SafeAreaView style={styles.container}>
  <FlatList
    data={notes}
    keyExtractor={(item) => item.id}
    ListHeaderComponent={
      <View style={styles.filterContainer}>
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
              subjectFilter === "SQA" && styles.activeFilter,
            ]}
            onPress={() => setSubjectFilter("SQA")}
          >
            <Text>SQA</Text>
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
              unitFilter === "2" && styles.activeFilter,
            ]}
            onPress={() => setUnitFilter("2")}
          >
            <Text>Unit 2</Text>
          </TouchableOpacity>
        </View>
      </View>
    }
    renderItem={({ item }) => (
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.noteContent}>{item.content}</Text>
        <Text style={styles.noteMeta}>
          Posted by: {item.postedBy} |{" "}
          {item.timestamp?.toDate().toLocaleString()}
        </Text>
      </View>
    )}
    ListFooterComponent={
      user?.role === "teacher" && (
        <View style={styles.addNoteContainer}>
          <TextInput
            style={styles.input}
            value={newNote}
            onChangeText={setNewNote}
            placeholder="Add a new note"
            multiline
          />
          <Button title="Add Note" onPress={addNote} />
        </View>
      )
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
    backgroundColor: "#6200ee",
    borderColor: "#6200ee",
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
});

export default TeachersNotes;