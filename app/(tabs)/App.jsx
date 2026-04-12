import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import ManageComplain from '../screens/Admin/ManageComplain';
import ManageCustomers from '../screens/Admin/ManageCustomers';
import ManageOrders from '../screens/Admin/ManageOrders';
import ManageTailors from '../screens/Admin/ManageTailors';

import BookAppointment from '../screens/Customer/BookAppointment';
import BrowseTailors from '../screens/Customer/BrowseTailors';
import CustomerChatbox from '../screens/Customer/CustomerChatbox';
import CustomerComplainbox from '../screens/Customer/CustomerComplainbox';
import CustomerDashboard from '../screens/Customer/CustomerDashboard';
import CustomerOrders from '../screens/Customer/CustomerOrders';
import Form from '../screens/Customer/Form';
import MyAppointments from '../screens/Customer/MyAppointments';
import NotificationScreen from '../screens/Customer/NotificationScreen';
import OrderForm from '../screens/Customer/OrderForm';
import Payment from '../screens/Customer/Payment';
import TailorServices from '../screens/Customer/TailorServices';
import Forgot from '../screens/Forgot';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import Start from '../screens/Start';
import AddServices from '../screens/Tailor/AddServices';
import Appointment from '../screens/Tailor/Appointment';
import MyOrders from '../screens/Tailor/MyOrders';
import TailorChatbox from '../screens/Tailor/TailorChatbox';
import TailorComplainbox from '../screens/Tailor/TailorComplainbox';
import TailorDashboard from '../screens/Tailor/TailorDashboard';
const Tab = createBottomTabNavigator();

const customerTabColors = {
  header: '#1b254f',
  active: '#FFFFFF',
  inactive: '#BFD6EC',
  background: '#1F4E79',
  border: '#173C5E',
};

const tailorTabColors = {
  header: '#9D2A4B',
  active: '#FFFFFF',
  inactive: '#9D2A4B',
  background: '#1F4E79',
  border: '#173C5E',
};

// Customer tab navigation
function CustomerDrawer({ route }) {
  const email = route.params?.email;
  return (
    <Tab.Navigator
      initialRouteName="CustomerDashboard"
      backBehavior="history"
      screenOptions={{
        headerStyle: { backgroundColor: customerTabColors.header },
        headerTintColor: '#fff',
        tabBarActiveTintColor: customerTabColors.active,
        tabBarInactiveTintColor: customerTabColors.inactive,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor:"#3957a6",
          borderTopColor: customerTabColors.border,
          height: 72,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="CustomerDashboard"
        component={CustomerDashboard}
        initialParams={{ email }}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="BrowseTailors"
        component={BrowseTailors}
        initialParams={{ email }}
        options={{
          title: 'Browse',
          headerShown: false,
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="TailorServices"
        initialParams={{ email }}
        component={TailorServices}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="OrderForm"
        initialParams={{ email }}
        component={OrderForm}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="MyAppointments"
        initialParams={{ email }}
        component={MyAppointments}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="CustomerOrders"
        component={CustomerOrders}
        initialParams={{ email, }}
        options={{
          title: 'Orders',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CustomerChatbox"
        component={CustomerChatbox}
        initialParams={{ email }}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CustomerComplainbox"
        component={CustomerComplainbox}
        initialParams={{ email }}
        options={{
          title: 'Complaints',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationScreen"
        component={NotificationScreen}
        initialParams={{ email }}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="Payment"
        component={Payment}
        initialParams={{ email }}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
function TailorDrawer({ route }) {
  const email = route.params?.email;
  return (
    <Tab.Navigator
      initialRouteName="TailorDashboard"
      backBehavior="history"
      screenOptions={{
        headerStyle: { backgroundColor: "#E6B0B0" },
        headerTintColor: '#000000',
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: tailorTabColors.inactive,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: "#E6B0B0",
          borderTopColor: "#4a262d",
          height: 72,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="TailorDashboard"
        component={TailorDashboard}
        initialParams={{ email }}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddServices"
        component={AddServices}
        initialParams={{ email }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
          title: 'Add Services',
        }}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrders}
        initialParams={{ email }}
        options={{
          title: 'Orders',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TailorChatbox"
        component={TailorChatbox}
        initialParams={{ email }}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TailorComplainbox"
        initialParams={{ email }}
        component={TailorComplainbox}
        options={{
          title: 'Complaints',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ gestureEnabled: false }} initialRouteName="Login">
        <Stack.Screen options={{ headerShown: false }} name="Login" component={Login} />
        <Stack.Screen options={{ headerShown: false }} name="Signup" component={Signup} />
        {/* Customer navigation (bottom tabs) */}
        <Stack.Screen options={{ headerShown: false }} name="CustomerDrawer" component={CustomerDrawer} />
        {/* Tailor navigation (bottom tabs) */}
        <Stack.Screen options={{ headerShown: false }} name="TailorDrawer" component={TailorDrawer} />
        <Stack.Screen name="OrderForm" component={OrderForm} />
        <Stack.Screen options={{ headerShown: false }} name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen options={{ headerShown: false }} name="Appointment" component={Appointment} />
        <Stack.Screen options={{ headerShown: false }} name="BookAppointment" component={BookAppointment} />
        <Stack.Screen name="ManageTailors" component={ManageTailors} />
        <Stack.Screen name="ManageCustomers" component={ManageCustomers} />
        <Stack.Screen name="ManageOrders" component={ManageOrders} />
        <Stack.Screen name="ManageComplain" component={ManageComplain} />
        <Stack.Screen options={{ headerShown: false }} name="TailorServices" component={TailorServices} />
        <Stack.Screen name="Forgot" component={Forgot} />

        <Stack.Screen options={{ headerShown: false }} name="MyOrders" component={MyOrders} />
        <Stack.Screen options={{ headerShown: false }} name="Form" component={Form} />
        <Stack.Screen options={{ headerShown: false }} name="Start" component={Start} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;