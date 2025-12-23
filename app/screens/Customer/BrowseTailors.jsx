import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BrowseTailors({ navigation, route }) {
const CustomerEmail = route?.params?.CustomerEmail || "";


  console.log("Customer Email:", CustomerEmail);
  

  // Get email from navigation params
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
    
    <LinearGradient
      colors={["#64769eff", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Tailors</Text>
        <Text style={styles.headerSub}>Choose the best tailor for you</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {tailors.map((tailor) => (
          <TouchableOpacity
            key={tailor.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("TailorServices", {
             CustomerEmail: CustomerEmail,
                email: tailor.email,
                name: tailor.full_name,
                location: tailor.location,
                phone_number: tailor.phone_number,
              })
            }
          >
            {/* Image */}
            <View style={styles.imageCircle}>
              <Image
                source={require("../../../assets/images/imTailor.png")}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* Info */}
            <Text style={styles.name}>{tailor.full_name}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#555" />
              <Text style={styles.infoText}>{tailor.location}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#555" />
              <Text style={styles.infoText}>{tailor.phone_number}</Text>
            </View>

            {/* Action */}
            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>View Services</Text>
            </View>
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
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: "center",
  },

  header: {
    width: "90%",
    marginBottom: 40,
    marginLeft:190
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",

  },

  headerSub: {
    fontSize: 14,
    color: "#eaeaea",
 
  },

  list: {
    width: "90%",
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#94b4bcff",
    shadowOpacity: 0.5,
    shadowRadius: 10,
 
    alignItems: "center",
  },

  imageCircle: {
    backgroundColor: "#64769eff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
  },

  image: {
    height: 80,
    width: 180,
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  infoText: {
    marginLeft: 6,
    fontSize: 15,
    color: "#555",
    fontWeight: "600",
  },

  viewBtn: {
    marginTop: 14,
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 100,
    borderRadius: 14,
  },

  viewBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  noTailors: {
    fontSize: 16,
    color: "#fff",
    marginTop: 40,
    textAlign: "center",
  },
});
