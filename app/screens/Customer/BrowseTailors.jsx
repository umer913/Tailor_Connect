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
  View
} from "react-native";

const BrowseTailors = ({ navigation, route }) => {
const CustomerEmail = route?.params?.email || "";

  console.log("Customer Email:", CustomerEmail);
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
    colors={["#1b254f", "#0c1435", "#080927"]}
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

          {/* Action Buttons Container */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.viewBtn}
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
              <Text style={styles.viewBtnText}>View Services</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookBtn}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("BookAppointment", {
                  tailor_name: tailor.full_name,
                  email: tailor.email,
                  CustomerEmail: CustomerEmail,
                })
              }
            
            >
              <Text style={styles.bookBtnText}>Book Appointment</Text>
            </TouchableOpacity>
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

export default BrowseTailors;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: "center",
  },

  header: {
    width: "90%",
    marginBottom: 40,
    marginLeft: 190,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },

  headerSub: {
    fontSize: 14,
    color: "#d1d9ff",
  },

  list: {
    width: "90%",
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#94b4bcff",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    alignItems: "center",
  },

  imageCircle: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
  },

  image: {
    height: 100,
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

  buttonsContainer: {
    padding:20,
    justifyContent: "space-between",
    marginTop: 14,
    width: "100%",
  },

  viewBtn: {
    marginBottom: 15,
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 14,
  },

  viewBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  bookBtn: {
    backgroundColor: "#28a745", // green color
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 14,
  },

  bookBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  noTailors: {
    fontSize: 16,
    color: "#fff",
    marginTop: 40,
    textAlign: "center",
  },
});
