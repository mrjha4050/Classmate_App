// App.js

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignInScreen from './components/start';
// import LoginScreen from './components/Signup';
import LoginScreen2 from './components/login';
import LoginScreen1 from './components/Home';
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
          options={{ headerShown: false  }}
          />
        <Stack.Screen
        name="Login"
        component={LoginScreen2} 
        options={{ headerShown: false  }}
        />
         <Stack.Screen
        name="Home"
        component={LoginScreen1} 
        options={{ headerShown: false  }}
        />
         {/* <Stack.Screen
        name="SignUp"
        component={SignUpScreen} 
        options={{ headerShown: false  }}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
