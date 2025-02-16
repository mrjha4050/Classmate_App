import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking } from 'react-native';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config'; 

const TeacherNotes = ({ subject }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const docRef = doc(db, 'subjects', subject);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setNotes(docSnap.data().notes || []);
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
          <View style={{ marginVertical: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.title}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl)}>
              <Text style={{ color: 'blue' }}>Download</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default TeacherNotes;