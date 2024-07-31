// src/screens/NoticesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { db } from '../config'; // Make sure you have Firebase configured

const NoticesScreen = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [filter, setFilter] = useState('All');
  const navigation = useNavigation();
  const { user } = useContext(AuthContext); // Get the current user


  useEffect(() => {
    const fetchNotices = async () => {
      const noticesCollection = collection(db, 'notices');
      const noticesSnapshot = await getDocs(noticesCollection);
      const noticesList = noticesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(noticesList);
      setFilteredNotices(noticesList); // Initialize with all notices
    };

    fetchNotices();
  }, []);

  const filterNoticesByTagAndUser = (noticesList, tag) => {
    const filtered = noticesList.filter(notice =>
      (tag === 'All' || notice.tag === tag) && !notice.readBy.includes(user.uid)
    );
    setFilteredNotices(filtered);
  };

  const handleMarkAsRead = async (noticeId) => {
    try {
      const noticeRef = doc(db, 'notices', noticeId);
      await updateDoc(noticeRef, {
        readBy: [...notices.find(notice => notice.id === noticeId).readBy, user.uid]
      });
      // Update local state
      setNotices(notices.map(notice => notice.id === noticeId ? { ...notice, readBy: [...notice.readBy, user.uid] } : notice));
      filterNoticesByTagAndUser(notices, filter);
    } catch (error) {
      console.error('Error marking notice as read: ', error);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>CollegeManager</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search notices..."
      /> */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'All' && styles.filterButtonActive]}
          onPress={() => filterNotices('All')}
        >
          <Text style={[styles.filterText, filter === 'All' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'Announcement' && styles.filterButtonActive]}
          onPress={() => filterNotices('Announcement')}
        >
          <Text style={[styles.filterText, filter === 'Announcement' && styles.filterTextActive]}>Announcements</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'Event' && styles.filterButtonActive]}
          onPress={() => filterNotices('Event')}
        >
          <Text style={[styles.filterText, filter === 'Event' && styles.filterTextActive]}>Events</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.noticesContainer}>
        {filteredNotices.map(notice => (
          <View key={notice.id} style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeDate}>Date: {new Date(notice.date).toLocaleString()}</Text>
            <Text style={styles.noticeTeacher}>Teacher: {notice.teacher}</Text>
            <Text style={styles.noticeContent}>{notice.content}</Text>
            <TouchableOpacity style={styles.markAsReadButton}>
              <Text style={styles.markAsReadText}>Mark as Read</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateNoticeScreen')}
      >
        <Text style={styles.createButtonText}>Create Notice</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 15,
    alignItems: 'center', // Center the header text horizontally
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  filterButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#555',
  },
  filterTextActive: {
    color: '#fff',
  },
  noticesContainer: {
    padding: 10,
  },
  noticeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noticeDate: {
    fontSize: 14,
    color: '#888',
    marginVertical: 5,
  },
  noticeTeacher: {
    fontSize: 14,
    color: '#888',
    marginVertical: 5,
  },
  noticeContent: {
    fontSize: 14,
    color: '#555',
  },
  markAsReadButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  markAsReadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NoticesScreen;
