import React, { useState, useEffect, useContext } from 'react';
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
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { AuthContext } from '../AuthContext';
import { db } from '../config';

const NoticesScreen = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [filter, setFilter] = useState('All');
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchNotices = async () => {
      const noticesCollection = collection(db, 'notices');
      const noticesSnapshot = await getDocs(noticesCollection);
      const noticesList = noticesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), readBy: doc.data().readBy || [] })); // Ensure readBy is initialized
      setNotices(noticesList);
      filterNoticesByTagAndUser(noticesList, 'All');
    };

    fetchNotices();
  }, []);

  const filterNoticesByTagAndUser = (noticesList, tag) => {
    const filtered = noticesList.filter(notice =>
      (tag === 'All' || notice.tag === tag) && !notice.readBy.includes(user.uid)
    );
    setFilteredNotices(filtered);
    setFilter(tag);
  };

  const handleMarkAsRead = async (noticeId) => {
    try {
      const noticeRef = doc(db, 'notices', noticeId);
      await updateDoc(noticeRef, {
        readBy: [...notices.find(notice => notice.id === noticeId).readBy, user.uid]
      });
      setNotices(notices.map(notice => notice.id === noticeId ? { ...notice, readBy: [...notice.readBy, user.uid] } : notice));
      filterNoticesByTagAndUser(notices, filter);
      Alert.alert("Success", "Notice marked as read");
    } catch (error) {
      console.error('Error marking notice as read: ', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
 
      <View style={styles.filterContainer}>
        {['All', 'Announcement', 'Sports', 'TimeTable', 'Event'].map((tagName) => (
          <TouchableOpacity
            key={tagName}
            style={[styles.filterButton, filter === tagName && styles.filterButtonActive]}
            onPress={() => filterNoticesByTagAndUser(notices, tagName)}
          >
            <Text style={[styles.filterText, filter === tagName && styles.filterTextActive]}>
              {tagName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.noticesContainer}>
        {filteredNotices.map(notice => (
          <TouchableOpacity
            key={notice.id}
            style={styles.noticeCard}
            onPress={() => navigation.navigate('NoticeDetail', { notice })}
          >
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeDate}>Date: {new Date(notice.date).toLocaleString()}</Text>
            <Text style={styles.noticeTeacher}>Teacher: {notice.teacher}</Text>
            <Text style={styles.noticeContent}>{notice.content}</Text>
            <TouchableOpacity
              style={styles.markAsReadButton}
              onPress={() => handleMarkAsRead(notice.id)}
            >
              <Text style={styles.markAsReadText}>Mark as Read</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E86C1',
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
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
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
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
    backgroundColor: '#28a745',
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
});

export default NoticesScreen;