// App.js

import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import SignInScreen from "./components/start";
import LoginScreen2 from "./components/login";
import HomeScreen from "./components/Home";
import NoticePage from "./screens/NoticePage";
import AttendanceScreen from "./screens/AttendanceScreen";
import ProfileScreen from "./screens/ProfileScreen";
import CreateNoticeScreen from "./screens/CreateNoticeScreen";
import NoticeDetail from "./screens/NoticeDetail";
// import TeacherProfile from "./screens/TeacherProfileScreen";
import TimeTableScreen from "./screens/TimetableScreen";
import TimetableForm from "./components/TimeTableForm";
import { AuthContext } from "./AuthContext";

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthContext>
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
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="NoticePage" component={NoticePage} />
          <Stack.Screen name="TimeTableForm" component={TimetableForm} />
          <Stack.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            // options={{ title: 'Profile' }}
          />
          <Stack.Screen
            name="CreateNoticeScreen"
            component={CreateNoticeScreen}
            options={{ title: "CreateNoticeScreen" }}
          />
          <Stack.Screen name="NoticeDetail" component={NoticeDetail} />
          <Stack.Screen name="TimeTableScreen" component={TimeTableScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext>
  );
}
