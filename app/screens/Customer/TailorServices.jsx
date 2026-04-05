import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
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
 
  const {
    CustomerEmail,
    email = "",
    name = "",
    isPriceFilterActive = false,
    selectedRangeMin,
    selectedRangeMax,
    selectedServiceTypes = [],
  } = route.params || {};

  console.log("Customer Email:", CustomerEmail);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const parsePriceNumbers = (priceText) => {
    const matches = String(priceText || "").match(/\d+(?:\.\d+)?/g) || [];
    return matches.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  };

  const getPriceInterval = (priceText) => {
    const numbers = parsePriceNumbers(priceText);
    if (!numbers.length) {
      return null;
    }

    const first = numbers[0];
    const second = numbers.length > 1 ? numbers[1] : numbers[0];
    return {
      min: Math.min(first, second),
      max: Math.max(first, second),
    };
  };

  const hasValidSelectedRange =
    Number.isFinite(selectedRangeMin) &&
    Number.isFinite(selectedRangeMax) &&
    selectedRangeMin <= selectedRangeMax;

  const normalizeType = (value) => String(value || "").toLowerCase().trim();
  const selectedServiceTypeSet = useMemo(
    () => new Set(selectedServiceTypes.map((type) => normalizeType(type))),
    [selectedServiceTypes]
  );
  const hasSelectedServiceFilter = selectedServiceTypeSet.size > 0;

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const serviceTypes = Array.isArray(service?.service_types) ? service.service_types : [];

      const matchesServiceType =
        !hasSelectedServiceFilter ||
        serviceTypes.some((type) => selectedServiceTypeSet.has(normalizeType(type)));

      if (!matchesServiceType) {
        return false;
      }

      if (!isPriceFilterActive || !hasValidSelectedRange) {
        return true;
      }

      const interval = getPriceInterval(service?.price_range);
      if (!interval) {
        return false;
      }

      return interval.max >= selectedRangeMin && interval.min <= selectedRangeMax;
    });
  }, [
    services,
    isPriceFilterActive,
    hasValidSelectedRange,
    selectedRangeMin,
    selectedRangeMax,
    hasSelectedServiceFilter,
    selectedServiceTypeSet,
  ]);

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
      colors={["#1b254f", "#0c1435", "#080927"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("BrowseTailors", {
            CustomerEmail: CustomerEmail,
          })}
        >
          <Ionicons name="arrow-back" size={22} color="#99aaff" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>Available Services</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#99aaff" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredServices.length > 0 ? (
            filteredServices.map((service) =>
              (service.service_types || [])
                .filter((type) => !hasSelectedServiceFilter || selectedServiceTypeSet.has(normalizeType(type)))
                .map((type, index) => {
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
                    activeOpacity={0.85}
                    style={styles.card}
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
                    <View style={styles.cardRow}>
                      <View style={styles.imageWrap}>
                        <Image source={iconImage} style={styles.image} />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.serviceText}>{type}</Text>
                        <Text style={styles.priceText}>
                          {service.price_range || "Price not added"}
                        </Text>
                        <View style={styles.genderBadge}>
                          <Text style={styles.genderText}>
                            {service.gender || "All"}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(155,179,255,0.4)" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="cut-outline" size={48} color="#506ba9" />
              <Text style={styles.noServices}>
                {hasSelectedServiceFilter && isPriceFilterActive && hasValidSelectedRange
                  ? "No services found for selected services and price range."
                  : hasSelectedServiceFilter
                    ? "No services found for selected service types."
                  : isPriceFilterActive && hasValidSelectedRange
                    ? "No services found in selected price range."
                  : "No services added yet."}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 55,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    padding: 10,
    backgroundColor: "rgba(42,60,114,0.5)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.12)",
  },

  headerTextWrap: {
    marginLeft: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#d1d9ff",
  },

  subtitle: {
    fontSize: 13,
    color: "#8e9ccf",
    marginTop: 2,
    fontWeight: "600",
  },

  list: {
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    shadowColor: "#18294a",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  imageWrap: {
    width: 80,
    height: 90,
    borderRadius: 16,
    backgroundColor: "rgba(42,60,114,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
  },

  image: {
    height: 85,
    width: 85,
    resizeMode: "contain",
  },

  cardInfo: {
    flex: 1,
  },

  serviceText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#d1d9ff",
    marginBottom: 4,
  },

  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8e9ccf",
    marginBottom: 8,
  },

  genderBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 14,
    backgroundColor: "rgba(42,60,114,0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.2)",
  },

  genderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#99aaff",
    textTransform: "capitalize",
  },

  emptyWrap: {
    alignItems: "center",
    marginTop: 80,
  },

  noServices: {
    textAlign: "center",
    fontSize: 16,
    color: "#8e9ccf",
    marginTop: 14,
    fontWeight: "600",
  },
});
