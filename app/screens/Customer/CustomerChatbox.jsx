import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

export default function CustomerChatbox() {
  return (
    <LinearGradient colors={['#a8edea', '#fed6e3']} style={styles.container}>
      <Text style={styles.text}>Chat with Tailors here</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: '600', color: '#333', textAlign: 'center' },
});
