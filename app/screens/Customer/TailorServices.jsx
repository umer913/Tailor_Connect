import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function TailorServices({ route, navigation }) {
 
  const { CustomerEmail, email, name } = route.params;
  console.log("Customer Email:", CustomerEmail);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Small icon images (male)
  const serviceImagesMale = {
    "Shalwar Kameez": require("../../../assets/images/shalwar.png"),
    "Kurta": require("../../../assets/images/Kurta.png"),
    "Sherwani": require("../../../assets/images/sherwani.png"),
    "Blazers": require("../../../assets/images/blazer.png"),
    "Dress Pants": require("../../../assets/images/pant.png"),
    "2 Piece Suits": require("../../../assets/images/2Peice.png"),
    "3 Piece Suits": require("../../../assets/images/3Peice.png"),
    "Pyjama": require("../../../assets/images/pyj.png"),
    "Waistcoats": require("../../../assets/images/coat.png"),
    "Shirts": require("../../../assets/images/shirt.png"),
    "Shalwar": require("../../../assets/images/shalwer.png"),
    "Pico":require("../../../assets/images/pico.png"),
    "Overlock":require("../../../assets/images/overlock.png"),
    "Button Hole":require("../../../assets/images/buttonhole.png"),
  };

  // Small icon images (female)
  const serviceImagesFemale = {
    "Shalwar Kameez": require("../../../assets/images/Fshalwar.png"),
    "Kurta": require("../../../assets/images/FKurta.png"),
    "Sherwani": require("../../../assets/images/Fsherwani.png"),
    "Blazers": require("../../../assets/images/Fblazers.png"),
    "Dress Pants": require("../../../assets/images/Fpant.png"),
    "2 Piece Suits": require("../../../assets/images/F2Peice.png"),
    "3 Piece Suits": require("../../../assets/images/F3Peice.png"),
    "Pyjama": require("../../../assets/images/Fpyj.png"),
    "Waistcoats": require("../../../assets/images/Fcoat.png"),
    "Shirts": require("../../../assets/images/Fshirt.png"),
    "Shalwar": require("../../../assets/images/Fshalwer.png"),
    "Pico":require("../../../assets/images/pico.png"),
    "Overlock":require("../../../assets/images/overlock.png"),
    "Button Hole":require("../../../assets/images/buttonhole.png"),
  };

  // Large images (male)
  const serviceTypeImagesMale = {
    "Shalwar Kameez": [
     require("../../../assets/images/shalwar.png"),
     require("../../../assets/images/shalwer1.png"),
     require("../../../assets/images/shalwer2.png"), 
    ],
    "Kurta": [
      require("../../../assets/images/Kurta.png"),
      require("../../../assets/images/Kurta1.png"),
    ],
    "Sherwani": [
      require("../../../assets/images/sherwani.png"),
     require("../../../assets/images/sherwani1.png"),
    ],
    "Blazers": [
      require("../../../assets/images/blazer.png"),
      require("../../../assets/images/2Peice1.png"),
      require("../../../assets/images/2Peice2.png"),
      require("../../../assets/images/2Peice3.png"),
    ],
    "Dress Pants": [
      require("../../../assets/images/pant.png"),
      require("../../../assets/images/2Peice4.png"),
    ],
    "2 Piece Suits": [
      require("../../../assets/images/2Peice.png"),
      require("../../../assets/images/2Peice1.png"),
      require("../../../assets/images/2Peice2.png"),
      require("../../../assets/images/2Peice3.png"),
      require("../../../assets/images/2Peice4.png"),
    ],
    "3 Piece Suits": [
      require("../../../assets/images/3Peice.png"),
      require("../../../assets/images/2Peice1.png"),
      require("../../../assets/images/2Peice2.png"),
      require("../../../assets/images/2Peice3.png"),
      require("../../../assets/images/2Peice4.png"),
      require("../../../assets/images/3Peice2.png"),
    ],
    "Pyjama": [
      require("../../../assets/images/pyj.png"),
      require("../../../assets/images/pyj1.png"),
    ],
    "Waistcoats": [
      require("../../../assets/images/coat.png"),
      require("../../../assets/images/coat1.png"),
    ],
    "Shirts": [
      require("../../../assets/images/shirt.png"),
      require("../../../assets/images/shirt1.png"),
    ],
    "Shalwar": [
      require("../../../assets/images/shalwer.png"),
       require("../../../assets/images/shalwer2.png"),
    ],
    "Pico": [
      require("../../../assets/images/pico.png")
    ],
    "Overlock": [
      require("../../../assets/images/overlock.png")
    ],
    "Button Hole": [
      require("../../../assets/images/buttonhole.png")
    ],
  };

  // Large images (female)
  const serviceTypeImagesFemale = {
    "Shalwar Kameez": [
      require("../../../assets/images/Fshalwar.png"),
      require("../../../assets/images/shalwer1.png"),
      require("../../../assets/images/shalwer2.png"),
    ],
    "Kurta": [
      require("../../../assets/images/FKurta.png"),
      require("../../../assets/images/Kurta1.png"),
    ],
    "Sherwani": [
      require("../../../assets/images/Fsherwani.png"),
      require("../../../assets/images/sherwani1.png"),
    ],
    "Blazers": [
      require("../../../assets/images/Fblazers.png"),
      require("../../../assets/images/2Peice1.png"),
      require("../../../assets/images/2Peice2.png"),
      require("../../../assets/images/2Peice3.png"),
    ],
    "Dress Pants": [
      require("../../../assets/images/Fpant.png"),
      require("../../../assets/images/2Peice4.png"),
    ],
    "2 Piece Suits": [
      require("../../../assets/images/F2Peice.png"),
      require("../../../assets/images/2Peice1.png"),
      require("../../../assets/images/2Peice2.png"),
      require("../../../assets/images/2Peice3.png"),
      require("../../../assets/images/2Peice4.png"),
    ],
    "3 Piece Suits": [
      require("../../../assets/images/F3Peice.png"),
      require("../../../assets/images/2Peice1.png"),
      require("../../../assets/images/2Peice2.png"),
      require("../../../assets/images/2Peice3.png"),
      require("../../../assets/images/2Peice4.png"),
      require("../../../assets/images/3Peice2.png"),
    ],
    "Pyjama": [
      require("../../../assets/images/Fpyj.png"),
      require("../../../assets/images/pyj1.png"),
    ],
    "Waistcoats": [
      require("../../../assets/images/Fcoat.png"),
       require("../../../assets/images/coat1.png"),
    ],
    "Shirts": [
      require("../../../assets/images/Fshirt.png"),
      require("../../../assets/images/shirt1.png"),
    ],
    "Shalwar": [
      require("../../../assets/images/Fshalwer.png"),
       require("../../../assets/images/shalwer2.png"),
    ],
    "Pico": [
      require("../../../assets/images/pico.png")
    ],
    "Overlock": [
      require("../../../assets/images/overlock.png")
    ],
    "Button Hole": [
      require("../../../assets/images/buttonhole.png")
    ],
  };

  const defaultImage = require("../../../assets/images/2Peice.png");

  // Single uniform button color for all cards:
  const buttonColor = "rgba(90, 50, 180, 0.35)"; // soft purple translucent

  const fetchServices = async () => {
    try {
      const res = await axios.get("http://UF-MacBook-Pro.local:3000/get-tailor-services", {
        params: { email }
      });
      setServices(res.data.services || []);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, [email]);

  return (
    <LinearGradient
      colors={["#64769eff", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>navigation.navigate("BrowseTailors", {
            CustomerEmail: CustomerEmail,})}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>Available Services</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      ) : (
       <ScrollView contentContainerStyle={styles.list}>
  {services.length > 0 ? (
    services.map((service) => 
      service.service_types.map((type, index) => {
        const gender = (service.gender || "").toLowerCase();

        // Set default images first
        let imagesToPass = [defaultImage];
        let iconImage = defaultImage;

        // Assign images based on gender
        if (gender === "male" || gender === "men" || gender === "both") {
          imagesToPass = serviceTypeImagesMale[type] || [defaultImage];
          iconImage = serviceImagesMale[type] || defaultImage;
        } else if (gender === "female" || gender === "women") {
          imagesToPass = serviceTypeImagesFemale[type] || [defaultImage];
          iconImage = serviceImagesFemale[type] || defaultImage;
        }

        return (
          <TouchableOpacity
            key={`${service.id}-${index}`}
            activeOpacity={0.9}
            style={[styles.card, { backgroundColor: "#192f6a" }]}
            onPress={() =>
              navigation.navigate("OrderForm", {
                CustomerEmail,
                tailorEmail: email,
                name,
                serviceType: type,
                price: service.price_range,
                gender: service.gender,
                images: imagesToPass,
                description: service.description || "",
              })
            }
          >
            <Image source={iconImage} style={styles.image} />
            <Text style={styles.serviceText}>{type}</Text>
            <Text style={styles.priceText}>
              {service.price_range || "Price not added"}
            </Text>
            <View style={styles.genderBadge}>
              <Text style={styles.genderText}>
                {service.gender || "All"}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })
    )
  ) : (
    <Text style={styles.noServices}>No services added.</Text>
  )}
</ScrollView>

      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 18,
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },

  subtitle: {
    fontSize: 14,
    color: "#eaeaea",
    marginTop: 4,
  },

  list: {
    paddingBottom: 40,
  },

  card: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },

  image: {
    height: 130,
    width: "100%",
    resizeMode: "contain",
    borderRadius: 12,
    marginBottom: 12,
  },

  serviceText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f0f0f0",
    marginBottom: 4,
  },

  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ddd",
  },

  genderBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 14,
    backgroundColor: "#64769eff",
    borderRadius: 20,
  },

  genderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#eee",
    textTransform: "capitalize",
  },

  noServices: {
    textAlign: "center",
    fontSize: 16,
    color: "#fff",
    marginTop: 40,
  },
});
