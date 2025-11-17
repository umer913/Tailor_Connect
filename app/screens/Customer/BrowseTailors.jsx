import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function BrowseTailors() {
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTailors = async () => {
    try {
      const res = await axios.get('http://UF-MacBook-Pro.local:3000/get-tailors');
      setTailors(res.data.tailors || []);
    } catch (error) {
      console.log('Error fetching tailors:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTailors();
  }, []);

  return (
    <LinearGradient colors={['#a8edea', '#fed6e3']} style={styles.container}>
      <Text style={styles.title}>Browse Verified Tailors</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#333" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {tailors.map((tailor) => (
            <TouchableOpacity key={tailor.id} style={styles.card}>
              <Text style={styles.name}>{tailor.full_name}</Text>
            </TouchableOpacity>
          ))}
          {tailors.length === 0 && (
            <Text style={styles.noTailors}>No tailors found.</Text>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  list: { width: '90%', paddingBottom: 30 },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  name: { fontSize: 18, color: '#333', fontWeight: '600' },
  noTailors: { fontSize: 16, color: '#555', marginTop: 20, textAlign: 'center' },
});
