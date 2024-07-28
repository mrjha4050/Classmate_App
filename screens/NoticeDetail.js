import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NoticeDetail = ({ route }) => {
  const { notice } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.date}>{new Date(notice.date).toLocaleString()}</Text>
      <Text style={styles.content}>{notice.content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
  },
});

export default NoticeDetail;
