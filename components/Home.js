// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../config';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const { email } = route.params;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDocRef = doc(db, 'Student', auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setUser(docSnap.data());
        } else {
          Alert.alert('Error', 'No such user!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Error fetching user data');
      }
    };

    fetchUser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome name="bars" size={24} color="white" />
        </TouchableOpacity>
        <View>
          {user && <Text style={styles.username}>{user.email}</Text>}
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome name="bell" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>Math Club Meeting |</Text>
            <Text style={styles.cardText}>October 12, 2023 | 3:00 PM</Text>
            <MaterialIcons name="event" size={24} color="black" />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>Career Fair |</Text>
            <Text style={styles.cardText}>October 15, 2023 | 10:00 AM</Text>
            <MaterialIcons name="event" size={24} color="black" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLinkButton}>
              <Text style={styles.quickLinkText}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('NoticePage')}
            >
              <Text style={styles.quickLinkText}>NoticePage</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('AttendanceScreen')}
            >
              <Text style={styles.quickLinkText}>Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('ProfileScreen')}
            >
              <Text style={styles.quickLinkText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalized Widgets</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>Assigned Homework</Text>
            <Text style={styles.cardText}>3 new assignments</Text>
            <MaterialIcons name="assignment" size={24} color="black" />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>Messages</Text>
            <Text style={styles.cardText}>2 unread messages</Text>
            <MaterialIcons name="message" size={24} color="black" />
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
  header: {
    backgroundColor: "#000",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    padding: 2,
  },
  usernameContainer: {
    flex: 1,
    alignItems: "center",
  },
  username: {
    color: "#fff",
    fontSize: 18,
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 10,
    paddingHorizontal: 8,
    backgroundColor: "#e7e7e6",
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardText: {
    fontSize: 12,
  },
  quickLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickLinkButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "48%",
    alignItems: "center",
  },
  quickLinkText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default HomeScreen;
