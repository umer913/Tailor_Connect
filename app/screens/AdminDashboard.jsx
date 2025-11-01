import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const AdminDashboard = ({ navigation }) => {
   const handleLogout = () => {
    
    navigation.navigate("Login"); 
  };
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome Admin</Text>
       <TouchableOpacity style={styles.logoutButton}
        onPress={handleLogout}
      ><Text style={styles.Logoutext}>Logout</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
  logoutButton:{ 
          backgroundColor: "red",
          paddingVertical: 12,
          paddingHorizontal: 25,
          borderRadius: 10,
          shadowColor: "#000",
          margin:50
  },
  Logoutext:{
    fontSize: 20, 
    fontWeight: 'bold',
    color:'#F7F7F7',
    borderRadius:20,

  }
});
export default AdminDashboard;