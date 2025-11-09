import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AdminDashboard from '../screens/AdminDashboard';
import CustomerDashboard from '../screens/CustomerDashboard';
import Forgot from '../screens/Forgot';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import Start from '../screens/Start';
import TailorDashboard from '../screens/TailorDashboard';
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer  >
      <Stack.Navigator screenOptions={{ gestureEnabled: false }} initialRouteName="Login">
        <Stack.Screen   options={{ headerShown: false }} name="Login" component={Login} />
        <Stack.Screen   options={{ headerShown: false }} name="Signup" component={Signup} />
        <Stack.Screen   options={{ headerShown: false }} name="CustomerDashboard" component={CustomerDashboard} />
        <Stack.Screen options={{ headerShown: false }} name="TailorDashboard" component={TailorDashboard} />
        <Stack.Screen   options={{ headerShown: false }} name="AdminDashboard" component={AdminDashboard} />
         <Stack.Screen   name="Forgot" component={Forgot} />
        <Stack.Screen   options={{ headerShown: false }} name="Start" component={Start} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
