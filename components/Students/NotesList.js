import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  collectionGroup,
  where,
} from "firebase/firestore";
import { Linking } from "react-native";

const NotesList = ({ subject }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("subjects")
      .doc(subject)
      .onSnapshot((doc) => {
        if (doc.exists) {
          setNotes(doc.data().notes || []);
        }
      });

    return () => unsubscribe();
  }, [subject]);

  return (
    <View>
      <FlatList
        data={notes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl)}>
              <Text style={{ color: "blue" }}>Download</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default NotesList;
