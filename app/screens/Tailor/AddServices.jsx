import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

const AddServices = ({ navigation }) => {


  return (
    <LinearGradient colors={['#a8edea', '#fed6e3']} style={styles.container}>
      <Text style={styles.text}>Add Your Services</Text>
   
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 30 },
  logoutButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoutText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
});

export default AddServices;
