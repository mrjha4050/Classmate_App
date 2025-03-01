import React from "react";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider } from "./AuthContext";  
import SignInScreen from "./components/start";
import LoginScreen from "./components/login";
import HomeScreen from "./components/StudentHome";
import NoticePage from "./screens/NoticePage";
import ProfileScreen from "./screens/ProfileScreen";
import CreateNoticeScreen from "./screens/CreateNoticeScreen";
import NoticeDetail from "./screens/NoticeDetail";
import AttendanceScreen from "./screens/AttendanceScreen";
import TeacherProfile from "./screens/TeacherProfileScreen";
import TodaysLectures from "./components/Teachers/TodayLecture";
import TeacherHomeScreen from "./screens/TeacherHomeScreen";
import CreateTimetableScreen from "./screens/CreateTimeTableScreen";
import ViewTimetableScreen from "./screens/ViewTimeTableScreen";
import Teacherslot from "./screens/Teacherslot";
import TeachersNotes from "./components/Teachers/teachersNotes";
import AddNotes from "./screens/Addnotes";
import Assignments from "./screens/Assignment";
import SeeAttendance from "./components/Teachers/Seettendence";


// Student Imports

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="SignIn">
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="NoticePage" component={NoticePage} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="SeeAttendance" component={SeeAttendance} />
          <Stack.Screen
            name="AttendanceScreen"
            component={AttendanceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ViewTimeTable" component={ViewTimetableScreen} />
          <Stack.Screen
            name="CreateNoticeScreen"
            component={CreateNoticeScreen}
          />
          <Stack.Screen name="NoticeDetail" component={NoticeDetail} />
          <Stack.Screen
            name="TeacherHomeScreen"
            component={TeacherHomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="AddNotes" component={AddNotes} />
          <Stack.Screen
            name="TodaysLectures"
            component={TodaysLectures}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TeacherProfile"
            component={TeacherProfile}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateTimetableScreen"
            component={CreateTimetableScreen}
          />
          <Stack.Screen name="Teacherslot" component={Teacherslot} />
          <Stack.Screen name="TeachersNotes" component={TeachersNotes} />
          <Stack.Screen name="Assignments" component={Assignments} options={{ headerShown: false }} />
          {/* <Stack.Screen name="StudentAttendance" component={StudentAttendance} /> */}
          {/* <Stack.Screen name="StudentNotes" component={StudentNotes} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}