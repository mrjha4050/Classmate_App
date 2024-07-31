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
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../config';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { email } = route.params;
  const auth = getAuth();

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

  const fetchNotices = async () => {
    try {
      const noticesCollection = collection(db, 'notices');
      const noticesSnapshot = await getDocs(noticesCollection);
      const noticesList = noticesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      noticesList.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date
      setNotices(noticesList.slice(0,2));
    } catch (error) {
      console.error('Error fetching notices:', error);
      Alert.alert('Error', 'Error fetching notices');
    }
  };

  useEffect(() => {
    fetchUser();
    fetchNotices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    await fetchNotices();
    setRefreshing(false);
  };

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

      <ScrollView contentContainerStyle={styles.scrollContainer}
       refreshControl={
         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
       }>

       <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notices.map((notice) => (
            <TouchableOpacity
              key={notice.id}
              style={styles.card}
              onPress={() => navigation.navigate('NoticeDetail', { notice })}
            >
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{notice.title}</Text>
                <Text style={styles.cardDate}>{new Date(notice.date).toLocaleString()}</Text>
              </View>
              <MaterialIcons name="event" size={24} color="black" />
            </TouchableOpacity>
          ))}
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLinkButton}
            onPress={() => navigation.navigate('NoticePage')}>
              <Text style={styles.quickLinkText}>NoticePage</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('CreateNoticeScreen')}
            >
              <Text style={styles.quickLinkText}>Create Notice </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('TimeTableForm')}
            >
              <Text style={styles.quickLinkText}>TimeTableForm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('TimeTableScreen')}
            >
              <Text style={styles.quickLinkText}>TimeTable</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Lectures</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>Enterprise Java </Text>
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
    // backgroundColor: "#f5f5f5",
    backgroundColor:"transparent",
  },
  header: {
    backgroundColor: "#fff",
    // backgroundColor:"#38ad5c",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 2,
  },
  usernameContainer: {
    flex: 1,
    alignItems: "center",
  },
  username: {
    color: "#000",
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
    fontSize: 13,
    flex:1,
    marginRight: 6,
  },
  quickLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickLinkButton: {
    backgroundColor: "#38ad5c",
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
