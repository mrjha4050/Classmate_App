import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

const TeacherProfile = () => {
  return (
    <View style={styles.container}>

      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2187&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }} // Replace with your image URL
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>John Doe</Text>
        <View style={styles.row}>
          <MaterialIcons name="schedule" size={16} color="gray" />
          <Text style={styles.profileSubtitle}>Today's Schedule</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Monday</Text>
          <Text style={styles.infoLabel}>5 Lectures</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.upgradeButton}>
        <Text style={styles.upgradeButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <View style={styles.performanceSection}>
        <Text style={styles.performanceTitle}>Overall Performance</Text>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Completed Courses</Text>
          <Text style={styles.performanceValue}>5</Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Total Hours Taught</Text>
          <Text style={styles.performanceValue}>120</Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Skills Development</Text>
          <Text style={styles.performanceValue}>10</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  profileSubtitle: {
    marginLeft: 5,
    color: 'gray',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoBox: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    // borderRadius: 5,
    // backgroundColor: '#f1f1f1',
    fontWeight: 'bold',
    color: '#333',
  },
  upgradeButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  performanceSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  performanceLabel: {
    fontSize: 14,
    color: 'gray',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
});

export default TeacherProfile;
