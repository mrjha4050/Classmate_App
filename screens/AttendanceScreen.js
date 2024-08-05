// src/screens/AttendanceScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from "expo-haptics";


const AttendanceScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Attendance Screen</Text>
      <Text>Coming Soon!</Text>
      <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.navigate("ProfileScreen");
              }}
            >
              <Text style={styles.quickLinkText}>Profilescreen</Text>
            </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AttendanceScreen;
