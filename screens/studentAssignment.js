import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../config";

const StudentAssignment = ({ navigation }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setLoading(true);
      getAssignments();
    });

    return unsubscribe;
  }, [navigation]);

  const getAssignments = async () => {
    const assignmentCollectionRef = collection(db, "assignments");
    const assignmentDocs = await getDocs(assignmentCollectionRef);

    const allAssignments = assignmentDocs.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    setAssignments(allAssignments);
    setLoading(false);
  };

  const renderAssignment = ({ item }) => (
    <TouchableOpacity
      style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#ccc" }}
      onPress={() => Linking.openURL(item.link)}
    >
      <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
      <Text>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      {loading ? (
        <ActivityIndicator size="large" color="#00ff00" />
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignment}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

export default StudentAssignment;
