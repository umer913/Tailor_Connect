import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import Forgot from '../screens/Forgot';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import Start from '../screens/Start';
import AddServices from '../screens/Tailor/AddServices';
import Appointment from '../screens/Tailor/Appointment';
import TailorChatbox from '../screens/Tailor/TailorChatbox';
import TailorDashboard from '../screens/Tailor/TailorDashboard';
import TailorOrders from '../screens/Tailor/TailorOrders';

// 👇 NEW imports for Drawer
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StyleSheet } from 'react-native';
import BookAppointment from '../screens/Customer/BookAppointment';
import BrowseTailors from '../screens/Customer/BrowseTailors';
import CustomerChatbox from '../screens/Customer/CustomerChatbox';
import CustomerDashboard from '../screens/Customer/CustomerDashboard';
import CustomerOrders from '../screens/Customer/CustomerOrders';
import Form from '../screens/Customer/Form';
import MyAppointments from '../screens/Customer/MyAppointments';
import OrderForm from '../screens/Customer/OrderForm';
import TailorServices from '../screens/Customer/TailorServices';
// Create Drawer
const Drawer = createDrawerNavigator();

// Drawer content (Customer side)
function CustomerDrawer({ route }) {
  const email = route.params?.email;
  return (
    <Drawer.Navigator
      initialRouteName="CustomerDashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#2b2a74ff' },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#2b2a74ff',
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="CustomerDashboard"
        component={CustomerDashboard}
        initialParams={{ email }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
        
      <Drawer.Screen
        name="BrowseTailors"
        component={BrowseTailors}
        initialParams={{ email }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
        
<Drawer.Screen
  name="TailorServices"
  initialParams={{ email }}
  component={TailorServices}
  options={{ drawerItemStyle: { height: 0 } }} // hide from drawer menu
/>
<Drawer.Screen
  name="OrderForm"
  initialParams={{ email }}
  component={OrderForm}
  options={{ drawerItemStyle: { height: 0 } }} // hide from drawer menu
/>
<Drawer.Screen
  name="MyAppointments"
  initialParams={{ email }}
  component={MyAppointments}
  options={{ drawerItemStyle: { height: 0 } }} // hide from drawer menu
/>
      <Drawer.Screen
        name="CustomerOrders"
        component={CustomerOrders}
        initialParams={{ email, }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="CustomerChatbox"
        component={CustomerChatbox}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
function TailorDrawer({route}) {
   const email = route.params?.email;
  return (
    <Drawer.Navigator
      initialRouteName="TailorDashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#E6B0B0' },
        headerTintColor: '#4A1C22',
        drawerActiveTintColor: '#E6B0B0',
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="TailorDashboard"
        component={TailorDashboard}
         initialParams={{ email }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AddServices"
        component={AddServices}
        initialParams={{ email }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
          title: 'Add Services',
        }}
      />
      <Drawer.Screen
        name="TailorOrders"
        component={TailorOrders}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="TailorChatbox"
        component={TailorChatbox}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ gestureEnabled: false }} initialRouteName="Login">
        <Stack.Screen options={{ headerShown: false }} name="Login" component={Login} />
        <Stack.Screen options={{ headerShown: false }} name="Signup" component={Signup} />
        {/* Use the Customer Drawer for customers */}
        <Stack.Screen options={{ headerShown: false }} name="CustomerDrawer" component={CustomerDrawer} />
        {/* Use the Tailor Drawer for tailors */}
        <Stack.Screen options={{ headerShown: false }} name="TailorDrawer" component={TailorDrawer} />
        <Stack.Screen  name="OrderForm" component={OrderForm} />
        <Stack.Screen options={{ headerShown: false }} name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="Appointment" component={Appointment} />
         <Stack.Screen options={{ headerShown: false }} name="BookAppointment" component={BookAppointment} />
         
        <Stack.Screen name="Forgot" component={Forgot} />
         <Stack.Screen options={{ headerShown: false }} name="Form"  component={Form} />
        <Stack.Screen options={{ headerShown: false }} name="Start" component={Start} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 20 },
  logoutButton: {
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});

export default App;