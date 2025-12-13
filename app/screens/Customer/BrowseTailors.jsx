import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function BrowseTailors({ navigation }) {
  const [tailors, setTailors] = useState([]);

  const fetchTailors = async () => {
    try {
      const res = await axios.get("http://UF-MacBook-Pro.local:3000/get-tailors");
      setTailors(res.data.tailors || []);
    } catch (error) {
      console.log("Error fetching tailors:", error);
    }
  };

  useEffect(() => {
    fetchTailors();
  }, []);

  return (
    <LinearGradient colors={["#000000ff", "#000000ff"]} style={styles.container}>
      

 <ScrollView contentContainerStyle={styles.list}>
  {tailors.map((tailor) => (
    <TouchableOpacity
      key={tailor.id}
      style={styles.card}
       onPress={() =>
      navigation.navigate("TailorServices", {
        email: tailor.email,      
        name: tailor.full_name,
        location: tailor.location,
        phone_number: tailor.phone_number
      })
    }
  >
      <View style={styles.imageCircle}>
        <Image
          source={require("../../../assets/images/imTailor.png")}
          style={{ height: 100, width: 300 }}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.name}>Name: {tailor.full_name}</Text>
      <Text style={styles.name}>Location: {tailor.location}</Text>
      <Text style={styles.name}>Phone Number: {tailor.phone_number}</Text>
    </TouchableOpacity>
  ))}

  {tailors.length === 0 && (
    <Text style={styles.noTailors}>No tailors found.</Text>
  )}
</ScrollView>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },

  imageCircle: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#e6e4fdff",
    marginTop: 5,
    alignSelf: "center",
  },

  list: {width: "65%", paddingBottom: 30 },

  card: {
    backgroundColor: "#f2f2f2ff",
    padding: 15,
    borderRadius: 10,
    margin: 22,
    shadowColor: "#6C63FF",
  
    alignItems: "center",
  },

  name: { fontSize: 18, color: "#333", fontWeight: "bold", marginTop: 10 },

  noTailors: { 
    fontSize: 16, 
    color: "#555", 
    marginTop: 20, 
    textAlign: "center" 
  },
});
