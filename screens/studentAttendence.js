import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  FlatList,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { db } from "../config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function StudentAttendance({ navigation }) {
  const [attendance, setAttendance] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    const q = query(
      collection(db, "studentAttendance"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubscribe = getDocs(q).then((querySnapshot) => {
      const attendanceData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAttendance(attendanceData);
    });
    return unsubscribe;
  }, [auth]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("AttendanceDetails", { attendanceId: item.id })
      }
    >
      <View style={styles.item}>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.subject}>{item.subject}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={attendance}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  date: {
    fontSize: 16,
  },
  subject: {
    fontSize: 16,
  },
  status: {
    fontSize: 16,
    color: "green",
  },
});