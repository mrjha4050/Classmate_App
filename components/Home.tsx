// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet ,TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

interface HomeScreenProps {
  username: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ username }) => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null); 

  
  useEffect(() => {
    const fetchUser = async () => {

      try {
        const usersRef = collection(db, 'student');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        console.log('Fetched Documents:', querySnapshot.docs); // Log fetched docs
        
        if (querySnapshot.docs.length > 0) {
          setUser(querySnapshot.docs[0].data()); 
        } else {
          console.log(`No user found with username: ${username}`);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchUser();
  }, [username]);


  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.appBar}>
       {user && <Text style={styles.username}>{user.username}</Text>} 
       </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AttendanceScreen')}
        >
          <Text style={styles.cardTitle}>Attendance</Text>
          <Text style={styles.cardContent}>View your attendance records.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('NoticePage')}
        >
          <Text style={styles.cardTitle}>Notices</Text>
          <Text style={styles.cardContent}>Check the latest notices.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          // onPress={() => navigation.navigate('Timetable')}
        >
          <Text style={styles.cardTitle}>Timetable</Text>
          <Text style={styles.cardContent}>View your class timetable.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 15,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    fontSize: 14,
    marginTop: 5,
  },
});

export default HomeScreen;
