import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AdminDashboard = ({ navigation }) => {
  const handleLogout = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Admin</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ManageTailor")}
      >
        <Text style={styles.buttonText}>Manage Tailor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ManageCustomer")}
      >
        <Text style={styles.buttonText}>Manage Customer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ManageOrder")}
      >
        <Text style={styles.buttonText}>Manage Order</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 40,
  },
  button: { 
    backgroundColor: '#007AFF', 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    borderRadius: 10, 
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  logoutButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AdminDashboard;
