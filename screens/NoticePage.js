import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Modal, TextInput, Button } from 'react-native';
import { Appbar, FAB, List, Chip, Avatar } from 'react-native-paper';

const initialNotices = [
  { id: '1', title: 'Discuss about the new feature to add jobdesk® web application', author: 'Sabir Hossain', date: '04 June, 2022', tags: ['Feature', 'New', 'Web App'] },
];

const NoticeBoard = ({ navigation }) => {
  const [notices, setNotices] = useState(initialNotices);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', author: '', date: '', tags: [] });
  const [newTag, setNewTag] = useState('');

  const handleAddNotice = () => {
    setModalVisible(true);
  };

  const handleSaveNotice = () => {
    setNotices([...notices, { ...newNotice, id: (notices.length + 1).toString() }]);
    setModalVisible(false);
    setNewNotice({ title: '', author: '', date: '', tags: [] });
  };

  const handleAddTag = () => {
    setNewNotice({ ...newNotice, tags: [...newNotice.tags, newTag] });
    setNewTag('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle} placeholder="Title">{item.title}</Text>
            <View style={styles.noticeInfo}>
              <Avatar.Icon size={24} icon="account" />
              <Text style={styles.noticeAuthor} placeholder="Author" >{item.author}</Text>
              <Avatar.Icon size={24} icon="calendar" />
              <Text style={styles.noticeDate}>{item.date}</Text>
            </View>
            <View style={styles.noticeTags}>
              {item.tags.map((tag, index) => (
                <Chip key={index} style={styles.noticeTag}>{tag}</Chip>
              ))}
            </View>
          </View>
        )}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddNotice}
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={newNotice.title}
            onChangeText={(text) => setNewNotice({ ...newNotice, title: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Author"
            value={newNotice.author}
            onChangeText={(text) => setNewNotice({ ...newNotice, author: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Date"
            value={newNotice.date}
            onChangeText={(text) => setNewNotice({ ...newNotice, date: text })}
          />
          <View style={styles.tagsInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add Tag"
              value={newTag}
              onChangeText={(text) => setNewTag(text)}
            />
            <Button title="Add Tag" onPress={handleAddTag} />
          </View>
          <View style={styles.noticeTags}>
            {newNotice.tags.map((tag, index) => (
              <Chip key={index} style={styles.noticeTag}>{tag}</Chip>
            ))}
          </View>
          <Button title="Save Notice" onPress={handleSaveNotice} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  noticeCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noticeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  noticeAuthor: {
    marginLeft: 5,
    marginRight: 15,
    fontSize: 14,
    color: '#6c757d',
  },
  noticeDate: {
    marginLeft: 5,
    fontSize: 14,
    color: '#6c757d',
  },
  noticeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noticeTag: {
    marginRight: 5,
    marginBottom: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  tagsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default NoticeBoard;
