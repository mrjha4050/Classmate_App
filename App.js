// App.js

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignInScreen from './components/start';
import LoginScreen2 from './components/login';
import HomeScreen from './components/Home'; 
import NoticePage from './screens/NoticePage';
import AttendanceScreen from './screens/AttendanceScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login1"
          component={LoginScreen2}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen2}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={{ username: 'John Doe' }} // Pass default username
          options={{ headerShown: false }}
        /> 
         <Stack.Screen
          name="NoticePage"
          component={NoticePage}
          options={{ title: 'Notices' }}
        />
        <Stack.Screen
          name="AttendanceScreen"
          component={AttendanceScreen}
          options={{ title: 'Attendance' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
