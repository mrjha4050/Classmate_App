import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignInScreen from './components/start';
import LoginScreen from './components/login';
import HomeScreen from './components/StudentHome';
import NoticePage from './screens/NoticePage';
import ProfileScreen from './screens/ProfileScreen';
import CreateNoticeScreen from './screens/CreateNoticeScreen';
import NoticeDetail from './screens/NoticeDetail';
import AttendanceScreen from './screens/AttendanceScreen';
import TeacherProfile from './screens/TeacherProfileScreen';
import SignupScreen from './screens/SignupScreen';
import TeacherHomeScreen from './screens/TeacherHomeScreen';
import { AuthProvider } from './AuthContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="SignIn">
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login1"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signupscreen"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="NoticePage" component={NoticePage} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />

          <Stack.Screen
            name="CreateNoticeScreen"
            component={CreateNoticeScreen}
          />
          <Stack.Screen name="NoticeDetail" component={NoticeDetail} />
          <Stack.Screen name="TeacherHomeScreen" component={TeacherHomeScreen} />
          <Stack.Screen name="TeacherProfile" component={TeacherProfile} />

        </Stack.Navigator>
      </NavigationContainer>
      </AuthProvider>
  );
}
