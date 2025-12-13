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
  TouchableOpacity
} from "react-native";

export default function TailorServices({ route, navigation }) {
  const { email, name } = route.params;
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
  };

  // Large images (male)
  const serviceTypeImagesMale = {
    "Shalwar Kameez": [
     require("../../../assets/images/shalwer.png"),
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
  };

  const defaultImage = require("../../../assets/images/2Peice.png");

  const buttonColors = [
    "#cdba12c3", "#588155b7", "#2ec9e1ab", "#f494b1ff",
    "#ebe7daff", "#d09de1ff", "#93eaf5ff", "#f2a087ff",
    "#d78484ff", "#bbbbadff"
  ];

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
    <LinearGradient colors={["#cea8edff", "#d6fee2ff"]} style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("BrowseTailors")}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{name} – Services</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#333" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {services.length > 0 ? (
            services.map((service, serviceIndex) =>
              service.service_types.map((type, index) => {
                const colorIndex = (serviceIndex + index) % buttonColors.length;

                const genderLower = (service.gender || '').toLowerCase();

                let imagesToPass = [];
                let iconImage;

                // ✅ MINIMAL CHANGE:
                // If gender = both → use male images
                if (
                  genderLower === "male" ||
                  genderLower === "men" ||
                  genderLower === "both"
                ) {
                  imagesToPass = serviceTypeImagesMale[type] || [defaultImage];
                  iconImage = serviceImagesMale[type] || defaultImage;
                } 
                else if (genderLower === "female" || genderLower === "women") {
                  imagesToPass = serviceTypeImagesFemale[type] || [defaultImage];
                  iconImage = serviceImagesFemale[type] || defaultImage;
                } 
                else {
                  imagesToPass = [defaultImage];
                  iconImage = defaultImage;
                }

                return (
                  <TouchableOpacity
                    key={`${service.id}-${index}`}
                    style={[styles.serviceBtn, { backgroundColor: buttonColors[colorIndex] }]}
                    onPress={() =>
                      navigation.navigate("OrderForm", {
                        tailorEmail: email,
                        tailorName: name,
                        serviceType: type,
                        price: service.price_range,
                        gender: service.gender,
                        images: imagesToPass,
                      })
                    }
                  >
                    <Image source={iconImage} style={styles.serviceImage} />

                    <Text style={styles.serviceText}>{type}</Text>

                    <Text style={styles.serviceSubText}>
                      {service.price_range || "Price not added"}
                    </Text>

                    <Text style={styles.genderText}>
                      {service.gender ? `For: ${service.gender}` : "For: All"}
                    </Text>
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
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2b2a74ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20
  },
  backText: { color: "#fff", fontSize: 16, marginLeft: 6 },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333"
  },

  list: { paddingBottom: 25 },

  serviceBtn: {
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 15,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3
  },

  serviceImage: {
    height: 180,
    width: 300,
    borderRadius: 10,
    resizeMode: "contain",
    marginBottom: 10
  },

  serviceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333"
  },

  serviceSubText: {
    fontSize: 14,
    color: "#555",
    marginTop: 4
  },

  genderText: {
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
    marginTop: 6
  },

  noServices: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginTop: 30
  }
});
