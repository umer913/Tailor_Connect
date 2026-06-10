import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../api.js";

const defaultImage = require("../../../assets/images/2Peice.png");
const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

// ── Static image maps (outside component — never re-created on render) ──
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
  "Pico": require("../../../assets/images/pico.png"),
  "Overlock": require("../../../assets/images/overlock.png"),
  "Button Hole": require("../../../assets/images/buttonhole.png"),
};

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
  "Pico": require("../../../assets/images/pico.png"),
  "Overlock": require("../../../assets/images/overlock.png"),
  "Button Hole": require("../../../assets/images/buttonhole.png"),
};

const serviceTypeImagesMale = {
  "Shalwar Kameez": [require("../../../assets/images/shalwar.png"), require("../../../assets/images/shalwer1.png"), require("../../../assets/images/shalwer2.png")],
  "Kurta": [require("../../../assets/images/Kurta.png"), require("../../../assets/images/Kurta1.png")],
  "Sherwani": [require("../../../assets/images/sherwani.png"), require("../../../assets/images/sherwani1.png")],
  "Blazers": [require("../../../assets/images/blazer.png"), require("../../../assets/images/2Peice1.png"), require("../../../assets/images/2Peice2.png"), require("../../../assets/images/2Peice3.png")],
  "Dress Pants": [require("../../../assets/images/pant.png"), require("../../../assets/images/2Peice4.png")],
  "2 Piece Suits": [require("../../../assets/images/2Peice.png"), require("../../../assets/images/2Peice1.png"), require("../../../assets/images/2Peice2.png"), require("../../../assets/images/2Peice3.png"), require("../../../assets/images/2Peice4.png")],
  "3 Piece Suits": [require("../../../assets/images/3Peice.png"), require("../../../assets/images/2Peice1.png"), require("../../../assets/images/2Peice2.png"), require("../../../assets/images/2Peice3.png"), require("../../../assets/images/2Peice4.png"), require("../../../assets/images/3Peice2.png")],
  "Pyjama": [require("../../../assets/images/pyj.png"), require("../../../assets/images/pyj1.png")],
  "Waistcoats": [require("../../../assets/images/coat.png"), require("../../../assets/images/coat1.png")],
  "Shirts": [require("../../../assets/images/shirt.png"), require("../../../assets/images/shirt1.png")],
  "Shalwar": [require("../../../assets/images/shalwer.png"), require("../../../assets/images/shalwer2.png")],
  "Pico": [require("../../../assets/images/pico.png")],
  "Overlock": [require("../../../assets/images/overlock.png")],
  "Button Hole": [require("../../../assets/images/buttonhole.png")],
};

const serviceTypeImagesFemale = {
  "Shalwar Kameez": [require("../../../assets/images/Fshalwar.png"), require("../../../assets/images/shalwer1.png"), require("../../../assets/images/shalwer2.png")],
  "Kurta": [require("../../../assets/images/FKurta.png"), require("../../../assets/images/Kurta1.png")],
  "Sherwani": [require("../../../assets/images/Fsherwani.png"), require("../../../assets/images/sherwani1.png")],
  "Blazers": [require("../../../assets/images/Fblazers.png"), require("../../../assets/images/2Peice1.png"), require("../../../assets/images/2Peice2.png"), require("../../../assets/images/2Peice3.png")],
  "Dress Pants": [require("../../../assets/images/Fpant.png"), require("../../../assets/images/2Peice4.png")],
  "2 Piece Suits": [require("../../../assets/images/F2Peice.png"), require("../../../assets/images/2Peice1.png"), require("../../../assets/images/2Peice2.png"), require("../../../assets/images/2Peice3.png"), require("../../../assets/images/2Peice4.png")],
  "3 Piece Suits": [require("../../../assets/images/F3Peice.png"), require("../../../assets/images/2Peice1.png"), require("../../../assets/images/2Peice2.png"), require("../../../assets/images/2Peice3.png"), require("../../../assets/images/2Peice4.png"), require("../../../assets/images/3Peice2.png")],
  "Pyjama": [require("../../../assets/images/Fpyj.png"), require("../../../assets/images/pyj1.png")],
  "Waistcoats": [require("../../../assets/images/Fcoat.png"), require("../../../assets/images/coat1.png")],
  "Shirts": [require("../../../assets/images/Fshirt.png"), require("../../../assets/images/shirt1.png")],
  "Shalwar": [require("../../../assets/images/Fshalwer.png"), require("../../../assets/images/shalwer2.png")],
  "Pico": [require("../../../assets/images/pico.png")],
  "Overlock": [require("../../../assets/images/overlock.png")],
  "Button Hole": [require("../../../assets/images/buttonhole.png")],
};

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

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const parsePriceNumbers = (priceText) => {
    const matches = String(priceText || "").match(/\d+(?:\.\d+)?/g) || [];
    return matches.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  };

  const getPriceInterval = (priceText) => {
    const numbers = parsePriceNumbers(priceText);
    if (!numbers.length) return null;
    const first = numbers[0];
    const second = numbers.length > 1 ? numbers[1] : numbers[0];
    return { min: Math.min(first, second), max: Math.max(first, second) };
  };

  const hasValidSelectedRange = Number.isFinite(selectedRangeMin) && Number.isFinite(selectedRangeMax) && selectedRangeMin <= selectedRangeMax;
  const normalizeType = (value) => String(value || "").toLowerCase().trim();
  const selectedServiceTypeSet = useMemo(() => new Set(selectedServiceTypes.map((t) => normalizeType(t))), [selectedServiceTypes]);
  const hasSelectedServiceFilter = selectedServiceTypeSet.size > 0;

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const serviceTypes = Array.isArray(service?.service_types) ? service.service_types : [];
      const matchesServiceType = !hasSelectedServiceFilter || serviceTypes.some((t) => selectedServiceTypeSet.has(normalizeType(t)));
      if (!matchesServiceType) return false;
      if (!isPriceFilterActive || !hasValidSelectedRange) return true;
      const interval = getPriceInterval(service?.price_range);
      if (!interval) return false;
      return interval.max >= selectedRangeMin && interval.min <= selectedRangeMax;
    });
  }, [services, isPriceFilterActive, hasValidSelectedRange, selectedRangeMin, selectedRangeMax, hasSelectedServiceFilter, selectedServiceTypeSet]);

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/services/get-tailor-services`, { params: { email } });
      setServices(res.data.services || []);
    } catch (error) { console.log(error); }
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, [email]);

  const GENDER_COLORS = {
    male: { color: "#ffffffff", bg: "rgba(96,165,250,0.15)", border: "#E6B0B0" },
    men: { color: "#ffffffff", bg: "rgba(96,165,250,0.15)", border: "#E6B0B0" },
    female: { color: "#f472b6", bg: "rgba(244,114,182,0.15)", border: "rgba(244,114,182,0.35)" },
    women: { color: "#f472b6", bg: "rgba(244,114,182,0.15)", border: "rgba(244,114,182,0.35)" },
    both: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.35)" },
  };
  const getGenderStyle = (g) => GENDER_COLORS[(g || "").toLowerCase()] || { color: "#E6B0B0", bg: "rgba(157,42,75,0.15)", border: "rgba(157,42,75,0.35)" };

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#E6B0B0" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title} numberOfLines={1}>{name}</Text>
          <Text style={styles.subtitle}>Available Services</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#9D2A4B" />
          <Text style={styles.loaderText}>Loading services...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => {
              // ── Custom service → same card style as catalogue services ──
              if (service.is_custom) {
                if (hasSelectedServiceFilter) {
                  const matches = (service.service_types || []).some(t => selectedServiceTypeSet.has(normalizeType(t)));
                  if (!matches) return null;
                }
                const gStyle = getGenderStyle(service.gender);
                const iconImage = service.custom_images?.[0]
                  ? { uri: service.custom_images[0].startsWith('http') ? service.custom_images[0] : `${API_BASE_URL}${service.custom_images[0]}` }
                  : defaultImage;
                const allCustomImages = service.custom_images?.length
                  ? service.custom_images.map(img => ({ uri: img.startsWith('http') ? img : `${API_BASE_URL}${img}` }))
                  : [defaultImage];

                return (
                  <TouchableOpacity
                    key={service.id}
                    activeOpacity={0.85}
                    style={styles.card}
                    onPress={() => navigation.navigate("OrderForm", {
                      CustomerEmail, tailorEmail: email, name,
                      serviceType: service.custom_name || service.service_types?.[0],
                      price: service.price_range,
                      gender: service.gender,
                      images: allCustomImages,
                      description: service.description || "",
                      measurements_required: service.measurements_required || [],
                      is_custom: true,
                    })}
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.imageWrap}>
                        <Image source={iconImage} style={styles.image} resizeMode="cover" />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.serviceText}>{service.custom_name || service.service_types?.[0]}</Text>
                        <View style={styles.priceRow}>
                          <Ionicons name="pricetag-outline" size={12} color="#fcd34d" />
                          <Text style={styles.priceText}>{service.price_range || "Price not added"}</Text>
                        </View>
                        <View style={[styles.genderBadge, { backgroundColor: gStyle.bg, borderColor: gStyle.border }]}>
                          <Text style={[styles.genderText, { color: gStyle.color }]}>{service.gender || "All"}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              // ── Catalogue service → original rendering ──
              return (service.service_types || [])
                .filter((type) => !hasSelectedServiceFilter || selectedServiceTypeSet.has(normalizeType(type)))
                .map((type, index) => {
                  const gender = (service.gender || "").toLowerCase();
                  let imagesToPass = [defaultImage];
                  let iconImage = defaultImage;
                  if (gender === "male" || gender === "men" || gender === "both") {
                    imagesToPass = serviceTypeImagesMale[type] || [defaultImage];
                    iconImage = serviceImagesMale[type] || defaultImage;
                  } else if (gender === "female" || gender === "women") {
                    imagesToPass = serviceTypeImagesFemale[type] || [defaultImage];
                    iconImage = serviceImagesFemale[type] || defaultImage;
                  }
                  const gStyle = getGenderStyle(service.gender);

                  return (
                    <TouchableOpacity
                      key={`${service.id}-${index}`}
                      activeOpacity={0.85}
                      style={styles.card}
                      onPress={() => navigation.navigate("OrderForm", { CustomerEmail, tailorEmail: email, name, serviceType: type, price: service.price_range, gender: service.gender, images: imagesToPass, description: service.description || "" })}
                    >
                      <View style={styles.cardRow}>
                        <View style={styles.imageWrap}>
                          <Image source={iconImage} style={styles.image} />
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.serviceText}>{type}</Text>
                          <View style={styles.priceRow}>
                            <Ionicons name="pricetag-outline" size={12} color="#fcd34d" />
                            <Text style={styles.priceText}>{service.price_range || "Price not added"}</Text>
                          </View>
                          <View style={[styles.genderBadge, { backgroundColor: gStyle.bg, borderColor: gStyle.border }]}>
                            <Text style={[styles.genderText, { color: gStyle.color }]}>{service.gender || "All"}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                });
            })
          ) : (
            <View style={styles.emptyWrap}>
              <LinearGradient colors={["rgba(157,42,75,0.25)", "rgba(214,64,106,0.1)"]} style={styles.emptyIconBg}>
                <Ionicons name="cut-outline" size={40} color="#E6B0B0" />
              </LinearGradient>
              <Text style={styles.noServicesTitle}>No services found</Text>
              <Text style={styles.noServices}>
                {hasSelectedServiceFilter && isPriceFilterActive && hasValidSelectedRange
                  ? "No services match selected filters."
                  : hasSelectedServiceFilter ? "No services for selected types."
                    : isPriceFilterActive && hasValidSelectedRange ? "No services in selected price range."
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
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 16, paddingHorizontal: PAGE_GUTTER,
    borderBottomWidth: 1, borderBottomColor: "rgba(230,176,176,0.08)",
    gap: 14,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(157,42,75,0.15)", borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: 13, color: "#E6B0B0", marginTop: 2, fontWeight: "600" },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loaderText: { color: "#E6B0B0", marginTop: 12, fontSize: 15, fontWeight: "600" },
  list: { paddingHorizontal: PAGE_GUTTER, paddingBottom: 40, paddingTop: 16, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  card: {
    backgroundColor: "#1a0610", borderRadius: 20, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
    shadowColor: "#9D2A4B", shadowOpacity: 0.18, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  imageWrap: {
    width: 80, height: 90, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#130509",
    marginRight: 14, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
  },
  image: { height: 95, width: 105, resizeMode: "contain" },
  cardInfo: { flex: 1 },
  serviceText: { fontSize: 17, fontWeight: "800", color: "#fff", marginBottom: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  priceText: { fontSize: 13, fontWeight: "700", color: "#fcd34d" },
  genderBadge: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center",
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1,
  },
  genderText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  orderNow: { marginLeft: 10 },
  orderNowGrad: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  orderNowText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  emptyWrap: { alignItems: "center", marginTop: 80 },
  emptyIconBg: { width: 90, height: 90, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 1, borderColor: "rgba(157,42,75,0.3)" },
  noServicesTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  noServices: { textAlign: "center", fontSize: 15, color: "#E6B0B0", lineHeight: 22 },
});
