import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL, resolveImageUrl } from "../../api.js";

const DEFAULT_PRICE_CEILING = 100000;
const FILTER_DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.84, 360);
const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 980 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;
const ALL_SERVICE_TYPES = [
  "Shalwar Kameez",
  "Kurta",
  "Sherwani",
  "Blazers",
  "Dress Pants",
  "2 Piece Suits",
  "3 Piece Suits",
  "Pyjama",
  "Waistcoats",
  "Shirts",
  "Shalwar",
  "Pico",
  "Overlock",
  "Button Hole",
];
const NEARBY_RADIUS_KM = 25;

const normalizeText = (value) => (value || "").toLowerCase().replace(/[^a-z0-9\s,]/g, " ").replace(/\s+/g, " ").trim();

const getLocationCacheKey = (value) => normalizeText(value);

const parsePriceNumbers = (priceText) => {
  const matches = String(priceText || "").match(/\d+(?:\.\d+)?/g) || [];
  return matches.map((item) => Number(item)).filter((item) => Number.isFinite(item));
};

const extractPriceIntervals = (tailor) => {
  const intervals = [];

  for (const service of tailor?.services || []) {
    const numbers = parsePriceNumbers(service?.price_range);
    if (!numbers.length) {
      continue;
    }

    const first = numbers[0];
    const second = numbers.length > 1 ? numbers[1] : numbers[0];
    intervals.push({ min: Math.min(first, second), max: Math.max(first, second) });
  }

  return intervals;
};

const calculateDistanceKm = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const toSelectedRange = (min, max) => ({ min: Math.min(min, max), max: Math.max(min, max) });

const BrowseTailors = ({ navigation, route }) => {
  const customerEmail = route?.params?.CustomerEmail || route?.params?.email || "";
  const [tailors, setTailors] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isResolvingTailorLocations, setIsResolvingTailorLocations] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [tailorLocationCache, setTailorLocationCache] = useState({});
  const [typedLocation, setTypedLocation] = useState("");
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(0);
  const [isPriceFilterActive, setIsPriceFilterActive] = useState(false);
  const [selectedMinStars, setSelectedMinStars] = useState(0);
  const [isStarFilterActive, setIsStarFilterActive] = useState(false);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const drawerProgress = useRef(new Animated.Value(0)).current;
  const [reviewSummary, setReviewSummary] = useState({});
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewModalTailor, setReviewModalTailor] = useState(null);
  const [reviewList, setReviewList] = useState([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const getServicesForTailor = async (email) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/services/get-tailor-services`, {
        params: { email },
      });
      return response.data.services || [];
    } catch {
      return [];
    }
  };

  const addServicesToTailors = async (basicTailors) => {
    const enrichedTailors = await Promise.all(
      basicTailors.map(async (tailor) => ({
        ...tailor,
        services: await getServicesForTailor(tailor.email),
      }))
    );

    return enrichedTailors;
  };

  const fetchTailors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tailors/get-tailors-with-services`);
      setTailors(response.data.tailors || []);
      return;
    } catch {
      try {
        const fallbackResponse = await axios.get(`${API_BASE_URL}/tailors/get-tailors`);
        const fallbackTailors = fallbackResponse.data.tailors || [];
        const tailorsWithServices = await addServicesToTailors(fallbackTailors);
        setTailors(tailorsWithServices);
      } catch (error) {
        console.log("Error fetching tailors:", error);
        setTailors([]);
      }
    }
  };

  useEffect(() => {
    fetchTailors();
  }, []);

  useEffect(() => {
    const fetchReviewSummary = async () => {
      const ids = (tailors || []).map((tailor) => tailor.email).filter(Boolean);
      if (!ids.length) {
        setReviewSummary({});
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/reviews/tailor-reviews/summary`, {
          params: { tailor_ids: ids.join(",") },
        });
        setReviewSummary(response?.data?.summary || {});
      } catch {
        setReviewSummary({});
      }
    };

    fetchReviewSummary();
  }, [tailors]);

  const priceBounds = useMemo(() => {
    const allIntervals = tailors.flatMap((tailor) => extractPriceIntervals(tailor));

    if (!allIntervals.length) {
      return {
        hasPrices: false,
        min: 0,
        max: DEFAULT_PRICE_CEILING,
        step: 1,
      };
    }

    const min = Math.floor(Math.min(...allIntervals.map((interval) => interval.min)));
    const highestKnownPrice = Math.ceil(Math.max(...allIntervals.map((interval) => interval.max)));
    const max = Math.max(highestKnownPrice, DEFAULT_PRICE_CEILING);
    const span = Math.max(max - min, 1);
    const step = Math.max(1, Math.round(span / 100));

    return {
      hasPrices: true,
      min,
      max,
      step,
    };
  }, [tailors]);

  const availableServiceTypes = useMemo(() => {
    const allTypes = tailors.flatMap((tailor) =>
      (tailor?.services || []).flatMap((service) => (Array.isArray(service?.service_types) ? service.service_types : []))
    );

    const normalizedBuiltInTypes = new Set(ALL_SERVICE_TYPES.map((type) => normalizeText(type)));
    const uniqueExtraTypes = Array.from(new Set(allTypes))
      .filter((type) => !normalizedBuiltInTypes.has(normalizeText(type)))
      .sort((firstType, secondType) => firstType.localeCompare(secondType));

    return [...ALL_SERVICE_TYPES, ...uniqueExtraTypes];
  }, [tailors]);

  const selectedServiceTypeSet = useMemo(() => {
    return new Set(selectedServiceTypes.map((type) => normalizeText(type)));
  }, [selectedServiceTypes]);

  const normalizedSearchText = useMemo(() => normalizeText(searchText), [searchText]);

  useEffect(() => {
    if (!priceBounds.hasPrices) {
      setSelectedMinPrice(0);
      setSelectedMaxPrice(DEFAULT_PRICE_CEILING);
      setIsPriceFilterActive(false);
      return;
    }

    setSelectedMinPrice((previous) => Math.min(Math.max(previous || priceBounds.min, priceBounds.min), priceBounds.max));
    setSelectedMaxPrice((previous) => Math.min(Math.max(previous || priceBounds.max, priceBounds.min), priceBounds.max));
  }, [priceBounds.hasPrices, priceBounds.min, priceBounds.max]);

  const matchesPriceRange = (tailor) => {
    if (!isPriceFilterActive || !priceBounds.hasPrices) {
      return true;
    }

    const { min: effectiveMin, max: effectiveMax } = toSelectedRange(selectedMinPrice, selectedMaxPrice);
    const serviceIntervals = extractPriceIntervals(tailor);

    if (!serviceIntervals.length) {
      return false;
    }

    return serviceIntervals.some((interval) => {
      return interval.max >= effectiveMin && interval.min <= effectiveMax;
    });
  };

  const matchesSelectedServices = (tailor) => {
    if (!selectedServiceTypes.length) {
      return true;
    }

    return (tailor?.services || []).some((service) => {
      const serviceTypes = Array.isArray(service?.service_types) ? service.service_types : [];
      return serviceTypes.some((type) => selectedServiceTypeSet.has(normalizeText(type)));
    });
  };

  const matchesMinStars = (tailor) => {
    if (!isStarFilterActive) return true;

    const avg = Number(reviewSummary[tailor.email]?.avg) || 0;
    return avg >= Number(selectedMinStars || 0);
  };

  const locationMatchesTextually = (tailorLocation) => {
    if (!currentLocation) {
      return true;
    }

    const tailorText = normalizeText(tailorLocation);
    if (!tailorText) {
      return false;
    }

    const { city, region, country, text } = currentLocation;
    const exactText = normalizeText(text);
    const cityText = normalizeText(city);
    const regionText = normalizeText(region);
    const countryText = normalizeText(country);

    if (exactText && tailorText.includes(exactText)) {
      return true;
    }

    if (cityText && countryText && tailorText.includes(cityText) && tailorText.includes(countryText)) {
      return true;
    }

    if (cityText && tailorText.includes(cityText)) {
      return true;
    }

    if (regionText && countryText && tailorText.includes(regionText) && tailorText.includes(countryText)) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    const resolveTailorLocations = async () => {
      if (!currentLocation?.coords || !tailors.length) {
        return;
      }

      const uniqueLocations = [...new Set(tailors.map((tailor) => tailor.location).filter(Boolean))];
      const missingLocations = uniqueLocations.filter((location) => !tailorLocationCache[getLocationCacheKey(location)]);

      if (!missingLocations.length) {
        return;
      }

      setIsResolvingTailorLocations(true);

      try {
        const resolvedLocations = await Promise.all(
          missingLocations.map(async (location) => {
            try {
              const result = await Location.geocodeAsync(location);
              const firstMatch = result[0];

              if (!firstMatch) {
                return [getLocationCacheKey(location), { failed: true }];
              }

              return [
                getLocationCacheKey(location),
                {
                  latitude: firstMatch.latitude,
                  longitude: firstMatch.longitude,
                },
              ];
            } catch (error) {
              return [getLocationCacheKey(location), { failed: true }];
            }
          })
        );

        setTailorLocationCache((prev) => ({
          ...prev,
          ...Object.fromEntries(resolvedLocations),
        }));
      } finally {
        setIsResolvingTailorLocations(false);
      }
    };

    resolveTailorLocations();
  }, [currentLocation, tailors, tailorLocationCache]);

  const visibleTailors = tailors
    .map((tailor) => {
      const cacheEntry = tailorLocationCache[getLocationCacheKey(tailor.location)];
      let distanceKm = null;
      let matchesLocation = true;

      if (nearbyOnly) {
        if (currentLocation?.coords && cacheEntry?.latitude && cacheEntry?.longitude) {
          distanceKm = calculateDistanceKm(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            cacheEntry.latitude,
            cacheEntry.longitude
          );
          matchesLocation = distanceKm <= NEARBY_RADIUS_KM;
        } else {
          matchesLocation = locationMatchesTextually(tailor.location);
        }
      }

      return {
        ...tailor,
        distanceKm,
        matchesLocation,
      };
    })
    .filter((tailor) => {
      const matchesName = normalizeText(tailor.full_name).includes(normalizedSearchText);
      const priceMatched = matchesPriceRange(tailor);
      const servicesMatched = matchesSelectedServices(tailor);
      const starsMatched = matchesMinStars(tailor);
      return tailor.matchesLocation && matchesName && priceMatched && servicesMatched && starsMatched;
    })
    .sort((firstTailor, secondTailor) => {
      if (!nearbyOnly) {
        return 0;
      }

      if (firstTailor.distanceKm == null && secondTailor.distanceKm == null) {
        return 0;
      }

      if (firstTailor.distanceKm == null) {
        return 1;
      }

      if (secondTailor.distanceKm == null) {
        return -1;
      }

      return firstTailor.distanceKm - secondTailor.distanceKm;
    });

  const fetchCurrentLocation = async () => {
    try {
      setIsFetchingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required to find nearby tailors.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (!geocode.length) {
        Alert.alert("Location unavailable", "Could not detect your current location.");
        return;
      }

      const place = geocode[0];
      const exactLocation = [place.name, place.street, place.city, place.region, place.country]
        .filter(Boolean)
        .join(", ");

      setCurrentLocation({
        text: exactLocation,
        city: place.city || "",
        region: place.region || "",
        country: place.country || "",
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });
      setTypedLocation(exactLocation);
      setNearbyOnly(true);
    } catch (error) {
      console.log("Error fetching current location:", error);
      Alert.alert("Location error", "Something went wrong while fetching your current location.");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const clearLocationFilter = () => {
    setCurrentLocation(null);
    setTypedLocation("");
    setNearbyOnly(false);
  };

  const applyTypedLocationFilter = () => {
    const value = typedLocation.trim();

    if (!value) {
      Alert.alert("Location required", "Please type a location first.");
      return;
    }

    setCurrentLocation({
      text: value,
      city: "",
      region: "",
      country: "",
      coords: null,
    });
    setNearbyOnly(true);
  };

  const openServices = (tailor) => {
    const selectedRange = toSelectedRange(selectedMinPrice, selectedMaxPrice);

    navigation.navigate("TailorServices", {
      CustomerEmail: customerEmail,
      email: tailor.email,
      name: tailor.full_name,
      location: tailor.location,
      phone_number: tailor.phone_number,
      isPriceFilterActive,
      selectedRangeMin: selectedRange.min,
      selectedRangeMax: selectedRange.max,
      selectedServiceTypes,
    });
  };

  const toggleServiceType = (serviceType) => {
    setSelectedServiceTypes((previous) => {
      if (previous.includes(serviceType)) {
        return previous.filter((item) => item !== serviceType);
      }

      return [...previous, serviceType];
    });
  };

  const selectedServiceSummary =
    selectedServiceTypes.length === 0
      ? "All services"
      : selectedServiceTypes.length === 1
        ? selectedServiceTypes[0]
        : `${selectedServiceTypes.length} services selected`;

  const openAppointment = (tailor) => {
    navigation.navigate("BookAppointment", {
      tailor_name: tailor.full_name,
      email: tailor.email,
      CustomerEmail: customerEmail,
    });
  };

  const openChatbox = (tailor) => {
    navigation.navigate("CustomerChatbox", {
      CustomerEmail: customerEmail,
      email: customerEmail,
      tailorEmail: tailor.email,
      tailorName: tailor.full_name,
    });
  };

  const openReviewModal = async (tailor) => {
    setReviewModalTailor(tailor);
    setReviewModalVisible(true);
    setIsReviewLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/reviews/tailor-reviews`, {
        params: { tailor_id: tailor.email },
      });
      setReviewList(response?.data?.reviews || []);
    } catch {
      setReviewList([]);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const renderStars = (average) => {
    const safeAvg = Number(average) || 0;
    return [1, 2, 3, 4, 5].map((value) => {
      const showFull = safeAvg >= value;
      const showHalf = !showFull && safeAvg >= value - 0.5;
      return (
        <Ionicons
          key={value}
          name={showFull ? "star" : showHalf ? "star-half" : "star-outline"}
          size={16}
          color="#f59e0b"
        />
      );
    });
  };

  const openFilterDrawer = () => {
    setIsFilterDrawerOpen(true);
    Animated.timing(drawerProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeFilterDrawer = () => {
    Animated.timing(drawerProgress, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsFilterDrawerOpen(false);
      setIsServiceDropdownOpen(false);
    });
  };

  const toggleFilterDrawer = () => {
    if (isFilterDrawerOpen) {
      closeFilterDrawer();
    } else {
      openFilterDrawer();
    }
  };

  const drawerTranslateX = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-FILTER_DRAWER_WIDTH, 0],
  });

  const drawerOverlayOpacity = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuIconRotate = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color="#E6B0B0" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Browse Tailors</Text>
            <Text style={styles.headerSub}>Find your perfect tailor</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={toggleFilterDrawer} activeOpacity={0.85}>
            <Animated.View style={[styles.menuBarsWrap, { transform: [{ rotate: menuIconRotate }] }]}>
              <View style={styles.menuBar} />
              <View style={styles.menuBar} />
              <View style={styles.menuBar} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#E6B0B0" style={styles.searchIcon} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search tailor by name..."
            placeholderTextColor="#8c7a82"
            style={styles.searchInput}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")} activeOpacity={0.85}>
              <Ionicons name="close-circle" size={18} color="#E6B0B0" />
            </TouchableOpacity>
          ) : null}
        </View>
        {visibleTailors.length === 0 ? (
          <View style={styles.emptyCard}>
            <LinearGradient colors={["rgba(157,42,75,0.2)", "rgba(214,64,106,0.1)"]} style={styles.emptyIconWrap}>
              <Ionicons name="cut-outline" size={40} color="#E6B0B0" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>{nearbyOnly ? "No nearby tailors" : "No tailors found"}</Text>
            <Text style={styles.emptyText}>
              {searchText
                ? "Try a different name or clear the search."
                : selectedServiceTypes.length
                  ? "Try changing or clearing your selected services."
                  : isPriceFilterActive
                    ? "Try changing or clearing your price range."
                    : nearbyOnly
                      ? "Try switching off the nearby filter."
                      : "Try again later when more profiles are available."}
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {visibleTailors.map((tailor) => (
              <TouchableOpacity key={tailor.id} style={styles.card} activeOpacity={0.9} onPress={() => openServices(tailor)}>
                {/* chat button */}
                <TouchableOpacity
                  style={styles.messageCardButton}
                  activeOpacity={0.85}
                  onPress={(event) => { event.stopPropagation(); openChatbox(tailor); }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#E6B0B0" />
                </TouchableOpacity>

                {/* Avatar + name */}
                <LinearGradient colors={["rgba(157,42,75,0.2)", "rgba(214,64,106,0.1)"]} style={styles.imageWrap}>
                  {tailor.profile_image ? (
                    <Image
                      source={{ uri: resolveImageUrl(tailor.profile_image) }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={44} color="#E6B0B0" />
                  )}
                </LinearGradient>

                <Text style={styles.name}>{tailor.full_name}</Text>

                <Pressable
                  style={styles.ratingRow}
                  onPress={(event) => { event.stopPropagation(); openReviewModal(tailor); }}
                >
                  <View style={styles.ratingStars}>
                    {renderStars(reviewSummary[tailor.email]?.avg)}
                  </View>
                  <Text style={styles.ratingText}>
                    {reviewSummary[tailor.email]?.count
                      ? `${reviewSummary[tailor.email].avg} (${reviewSummary[tailor.email].count})`
                      : "No reviews yet"}
                  </Text>
                </Pressable>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="location-outline" size={15} color="#E6B0B0" />
                  </View>
                  <View style={styles.locationInfoContent}>
                    <Text style={styles.infoText} numberOfLines={1}>{tailor.location || "Location not added"}</Text>
                    {tailor.distanceKm != null ? (
                      <Text style={styles.distanceText}>{tailor.distanceKm.toFixed(1)} km away</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="call-outline" size={15} color="#E6B0B0" />
                  </View>
                  <Text style={styles.infoText}>{tailor.phone_number || "Phone not added"}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => openServices(tailor)} activeOpacity={0.85}>
                    <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="grid-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryButtonText}>View Services</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={() => openAppointment(tailor)} activeOpacity={0.85}>
                    <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="calendar-outline" size={15} color="#ffffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.secondaryButtonText}>Appointment</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {isFilterDrawerOpen ? (
        <View style={styles.drawerRoot} pointerEvents="box-none">
          <Pressable style={styles.drawerBackdropTouchTarget} onPress={closeFilterDrawer}>
            <Animated.View style={[styles.drawerBackdrop, { opacity: drawerOverlayOpacity }]} />
          </Pressable>

          <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerTranslateX }] }]}>


            <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
              <View style={styles.filtersPanel}>
                <View style={styles.filterSection}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceHeaderLeft}>
                      <View style={styles.serviceHeaderIcon}>
                        <Ionicons name="options-outline" size={18} color="#E6B0B0" />
                      </View>
                      <View>
                        <Text style={styles.serviceTitle}>Service Filter</Text>
                        <Text style={styles.serviceSubtitle}>Choose one or multiple services</Text>
                      </View>
                    </View>

                    {selectedServiceTypes.length ? (
                      <TouchableOpacity
                        style={styles.clearServiceButton}
                        onPress={() => setSelectedServiceTypes([])}
                        activeOpacity={0.85}>
                        <Ionicons name="close-circle-outline" size={15} color="#E6B0B0" style={styles.buttonIcon} />
                        <Text style={styles.clearServiceText}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {availableServiceTypes.length ? (
                    <View>
                      <TouchableOpacity
                        style={styles.serviceDropdownButton}
                        onPress={() => setIsServiceDropdownOpen((prev) => !prev)}
                        activeOpacity={0.85}>
                        <Text style={styles.serviceDropdownText} numberOfLines={1}>{selectedServiceSummary}</Text>
                        <Ionicons
                          name={isServiceDropdownOpen ? "chevron-up-outline" : "chevron-down-outline"}
                          size={18}
                          color="#E6B0B0"
                        />
                      </TouchableOpacity>

                      {isServiceDropdownOpen ? (
                        <View style={styles.serviceDropdownMenu}>
                          <ScrollView
                            style={styles.serviceDropdownScroll}
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}>
                            {availableServiceTypes.map((serviceType) => {
                              const isSelected = selectedServiceTypes.includes(serviceType);

                              return (
                                <TouchableOpacity
                                  key={serviceType}
                                  style={[styles.serviceOptionRow, isSelected && styles.serviceOptionRowActive]}
                                  onPress={() => toggleServiceType(serviceType)}
                                  activeOpacity={0.85}>
                                  <Text style={[styles.serviceOptionText, isSelected && styles.serviceOptionTextActive]}>{serviceType}</Text>
                                  {isSelected ? <Ionicons name="checkmark-circle" size={18} color="#E6B0B0" /> : null}
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={styles.noServiceHint}>No services available yet.</Text>
                  )}
                </View>

                <View style={styles.filterDivider} />

                <View style={styles.filterSection}>
                  <View style={styles.priceHeader}>
                    <View style={styles.priceHeaderLeft}>
                      <View style={styles.priceHeaderIcon}>
                        <Ionicons name="pricetag-outline" size={18} color="#E6B0B0" />
                      </View>
                      <View>
                        <Text style={styles.priceTitle}>Price Range</Text>
                        <Text style={styles.priceSubtitle}>Show tailors with services in your budget</Text>
                      </View>
                    </View>

                    {isPriceFilterActive ? (
                      <TouchableOpacity
                        style={styles.clearPriceButton}
                        onPress={() => {
                          setSelectedMinPrice(priceBounds.min);
                          setSelectedMaxPrice(priceBounds.max);
                          setIsPriceFilterActive(false);
                        }}
                        activeOpacity={0.85}>
                        <Ionicons name="close-circle-outline" size={15} color="#E6B0B0" style={styles.buttonIcon} />
                        <Text style={styles.clearPriceText}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {priceBounds.hasPrices ? (
                    <View style={styles.sliderGroup}>
                      <Text style={styles.priceValueText}>
                        Rs. {Math.min(selectedMinPrice, selectedMaxPrice)} - Rs. {Math.max(selectedMinPrice, selectedMaxPrice)}
                      </Text>

                      <View style={styles.sliderRow}>
                        <Text style={styles.sliderLabel}>Min</Text>
                        <Slider
                          style={styles.slider}
                          minimumValue={priceBounds.min}
                          maximumValue={selectedMaxPrice || priceBounds.max}
                          value={selectedMinPrice || priceBounds.min}
                          step={priceBounds.step}
                          minimumTrackTintColor="#E6B0B0"
                          maximumTrackTintColor="#9D2A4B"
                          thumbTintColor="#E6B0B0"
                          onValueChange={(value) => {
                            setSelectedMinPrice(Math.round(value));
                            setIsPriceFilterActive(true);
                          }}
                        />
                      </View>

                      <View style={styles.sliderRow}>
                        <Text style={styles.sliderLabel}>Max</Text>
                        <Slider
                          style={styles.slider}
                          minimumValue={selectedMinPrice || priceBounds.min}
                          maximumValue={priceBounds.max}
                          value={selectedMaxPrice || priceBounds.max}
                          step={priceBounds.step}
                          minimumTrackTintColor="#E6B0B0"
                          maximumTrackTintColor="#9D2A4B"
                          thumbTintColor="#E6B0B0"
                          onValueChange={(value) => {
                            setSelectedMaxPrice(Math.round(value));
                            setIsPriceFilterActive(true);
                          }}
                        />
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.noPriceHint}>No service prices available yet.</Text>
                  )}
                </View>

                <View style={styles.filterDivider} />

                <View style={styles.filterSection}>
                  <View style={styles.priceHeader}>
                    <View style={styles.priceHeaderLeft}>
                      <View style={styles.priceHeaderIcon}>
                        <Ionicons name="star" size={18} color="#E6B0B0" />
                      </View>
                      <View>
                        <Text style={styles.priceTitle}>Rating Filter</Text>

                      </View>
                    </View>

                    {isStarFilterActive ? (
                      <TouchableOpacity
                        style={styles.clearPriceButton}
                        onPress={() => {
                          setSelectedMinStars(0);
                          setIsStarFilterActive(false);
                        }}
                        activeOpacity={0.85}>
                        <Ionicons name="close-circle-outline" size={15} color="#E6B0B0" style={styles.buttonIcon} />
                        <Text style={styles.clearPriceText}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.starFilterRow}>
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isActive = selectedMinStars >= starValue;

                      return (
                        <TouchableOpacity
                          key={starValue}
                          style={[styles.starFilterButton, isActive && styles.starFilterButtonActive]}
                          onPress={() => {
                            setSelectedMinStars(starValue);
                            setIsStarFilterActive(true);
                          }}
                          activeOpacity={0.85}>
                          <Ionicons
                            name={isActive ? "star" : "star-outline"}
                            size={20}
                            color={isActive ? "#f59e0b" : "#E6B0B0"}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.starFilterSummaryRow}>
                    <Text style={styles.starFilterSummaryText}>
                      {selectedMinStars ? `` : "Tap a star to filter"}
                    </Text>
                  </View>
                </View>

                <View style={styles.filterDivider} />

                <View style={styles.filterSection}>
                  <View style={styles.locationHeaderBar}>
                    <View style={styles.locationHeaderLeft}>
                      <View style={styles.locationHeaderIcon}>
                        <Ionicons name="locate-outline" size={18} color="#E6B0B0" />
                      </View>
                      <View style={styles.locationHeaderTextWrap}>
                        <Text style={styles.locationTitle}>Location Filter</Text>
                        <Text style={styles.locationSubtitle}>Nearby tailors within {NEARBY_RADIUS_KM} km</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.locationToggle, nearbyOnly && styles.locationToggleActive]}
                      onPress={() => {
                        if (!currentLocation && !nearbyOnly && !isFetchingLocation) {
                          fetchCurrentLocation();
                          return;
                        }

                        if (nearbyOnly) {
                          clearLocationFilter();
                          return;
                        }

                        setNearbyOnly(true);
                      }}
                      activeOpacity={0.85}>
                      {isFetchingLocation ? (
                        <ActivityIndicator size="small" color="#E6B0B0" />
                      ) : (
                        <>
                          <View style={[styles.locationToggleKnob, nearbyOnly && styles.locationToggleKnobActive]} />
                          <Text style={styles.locationToggleText}>{nearbyOnly ? "On" : "Off"}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.locationStrip}>
                    <Ionicons name="location-outline" size={16} color="#E6B0B0" />
                    <Text style={styles.locationStripText} numberOfLines={2}>
                      {currentLocation?.text || "No location selected yet"}
                    </Text>
                  </View>

                  <View style={styles.manualLocationRow}>
                    <TextInput
                      value={typedLocation}
                      onChangeText={setTypedLocation}
                      placeholder="Type city or area"
                      placeholderTextColor="#E6B0B0"
                      style={styles.manualLocationInput}
                    />

                    <TouchableOpacity
                      style={styles.applyLocationButton}
                      onPress={applyTypedLocationFilter}
                      activeOpacity={0.85}>
                      <Text style={styles.applyLocationButtonText}>Apply</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.locationBottomRow}>
                    {currentLocation ? (
                      <TouchableOpacity
                        style={styles.clearLocationButton}
                        onPress={fetchCurrentLocation}
                        activeOpacity={0.85}>
                        {isFetchingLocation ? (
                          <ActivityIndicator size="small" color="#99aaff" />
                        ) : (
                          <>
                            <Ionicons name="refresh-outline" size={16} color="#E6B0B0" style={styles.buttonIcon} />
                            <Text style={styles.clearLocationText}>Refresh</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.locationHintSpacer} />
                    )}
                  </View>

                  {isResolvingTailorLocations ? (
                    <View style={styles.resolvingRowCompact}>
                      <ActivityIndicator size="small" color="#7b9bff" />
                      <Text style={styles.resolvingText}>Checking tailor distances...</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}

      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.reviewModalBackdrop}>
          <View style={styles.reviewModalCard}>
            <View style={styles.reviewModalHeader}>
              <Text style={styles.reviewModalTitle}>Reviews</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={20} color="#e0e7ff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewModalSubtitle}>{reviewModalTailor?.full_name || "Tailor"}</Text>

            {isReviewLoading ? (
              <View style={styles.reviewLoadingRow}>
                <ActivityIndicator size="small" color="#99aaff" />
                <Text style={styles.reviewLoadingText}>Loading reviews...</Text>
              </View>
            ) : reviewList.length ? (
              <ScrollView style={styles.reviewList} showsVerticalScrollIndicator={false}>
                {reviewList.map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewStarsRow}>
                      {renderStars(review.rating)}
                      <Text style={styles.reviewRatingValue}>{review.rating}</Text>
                    </View>
                    <Text style={styles.reviewDescription}>
                      {review.description || "No description provided."}
                    </Text>
                    <Text style={styles.reviewMetaText}>{review.customer_id}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.reviewEmptyRow}>
                <Text style={styles.reviewEmptyText}>No reviews yet.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default BrowseTailors;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 58 : 42,
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom: 34,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  menuButton: { backgroundColor: 'rgba(157,42,75,0.15)', width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(157,42,75,0.3)', alignItems: 'center', justifyContent: 'center' },
  menuBarsWrap: { height: 16, justifyContent: 'space-between', alignItems: 'center' },
  menuBar: { width: 18, height: 2, borderRadius: 2, backgroundColor: '#E6B0B0' },
  backButton: { backgroundColor: 'rgba(157,42,75,0.15)', padding: 11, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(157,42,75,0.3)' },
  // ── Drawer ──
  drawerRoot: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  drawerBackdropTouchTarget: { ...StyleSheet.absoluteFillObject },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,8,13,0.85)' },
  drawerPanel: { position: 'absolute', top: 0, bottom: 0, left: 0, width: FILTER_DRAWER_WIDTH, backgroundColor: '#1a0610', borderRightWidth: 1, borderRightColor: 'rgba(157,42,75,0.2)', paddingTop: Platform.OS === 'ios' ? 58 : 40 },
  drawerHeader: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(157,42,75,0.15)' },
  drawerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  drawerIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  drawerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  drawerContent: { padding: 16, paddingBottom: 30, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  // ── Header ──
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#E6B0B0', fontWeight: '600', marginTop: 2 },
  // ── Search ──
  searchBox: { backgroundColor: '#1a0610', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', marginBottom: 18, flexDirection: 'row', alignItems: 'center' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', paddingVertical: 0 },
  // ── Filters Panel (inline) ──
  filtersPanel: { backgroundColor: 'rgba(26,6,16,0.7)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', marginBottom: 22 },
  filterSection: { paddingVertical: 2 },
  filterDivider: { height: 1, backgroundColor: 'rgba(157,42,75,0.15)', marginVertical: 14 },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  serviceHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  serviceHeaderIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(157,42,75,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(157,42,75,0.25)', marginRight: 10 },
  serviceTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  serviceSubtitle: { color: '#E6B0B0', fontSize: 12, fontWeight: '600', marginTop: 2 },
  clearServiceButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,6,16,0.9)', borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  clearServiceText: { color: '#E6B0B0', fontSize: 12, fontWeight: '700' },
  serviceDropdownButton: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(157,42,75,0.25)', backgroundColor: 'rgba(26,6,16,0.7)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceDropdownText: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700', marginRight: 8 },
  serviceDropdownMenu: { marginTop: 6, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', backgroundColor: 'rgba(26,6,16,0.95)' },
  serviceDropdownScroll: { maxHeight: 220 },
  serviceOptionRow: { minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(157,42,75,0.08)' },
  serviceOptionRowActive: { backgroundColor: 'rgba(157,42,75,0.15)' },
  serviceOptionText: { color: '#E6B0B0', fontSize: 13, fontWeight: '700' },
  serviceOptionTextActive: { color: '#fff' },
  noServiceHint: { color: '#E6B0B0', fontSize: 12, fontWeight: '600' },
  priceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  priceHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  priceHeaderIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(157,42,75,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(157,42,75,0.25)', marginRight: 10 },
  priceTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  priceSubtitle: { color: '#E6B0B0', fontSize: 11, fontWeight: '600', marginTop: 2 },
  clearPriceButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,6,16,0.9)', borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  clearPriceText: { color: '#E6B0B0', fontSize: 12, fontWeight: '700' },
  priceValueText: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  sliderGroup: { gap: 10 },
  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  sliderLabel: { width: 34, color: '#E6B0B0', fontSize: 12, fontWeight: '700', marginRight: 8 },
  slider: { flex: 1, height: 36 },
  starFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  starFilterButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,6,16,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(157,42,75,0.18)',
  },
  starFilterButtonActive: {
    backgroundColor: 'rgba(157,42,75,0.22)',
    borderColor: 'rgba(245,158,11,0.35)',
  },
  starFilterSummaryRow: { marginTop: 10, alignItems: 'center' },
  starFilterSummaryText: { color: '#E6B0B0', fontSize: 12, fontWeight: '700' },
  noPriceHint: { color: '#E6B0B0', fontSize: 12, fontWeight: '600' },
  locationHeaderBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  locationHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  locationHeaderIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(157,42,75,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(157,42,75,0.25)' },
  locationHeaderTextWrap: { flex: 1, marginLeft: 10 },
  locationTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  locationSubtitle: { color: '#E6B0B0', fontSize: 12, fontWeight: '600', marginTop: 2 },
  locationToggle: { minWidth: 76, height: 36, borderRadius: 999, backgroundColor: 'rgba(26,6,16,0.9)', borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationToggleActive: { backgroundColor: 'rgba(157,42,75,0.2)', borderColor: 'rgba(157,42,75,0.4)' },
  locationToggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#E6B0B0' },
  locationToggleKnobActive: { backgroundColor: '#fff' },
  locationToggleText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  locationStrip: { marginTop: 12, backgroundColor: 'rgba(26,6,16,0.6)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(157,42,75,0.15)', flexDirection: 'row', alignItems: 'center' },
  manualLocationRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  manualLocationInput: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(157,42,75,0.25)', backgroundColor: 'rgba(26,6,16,0.7)', color: '#fff', fontSize: 13, fontWeight: '600', paddingHorizontal: 12 },
  applyLocationButton: { minHeight: 42, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(157,42,75,0.35)', backgroundColor: 'rgba(157,42,75,0.2)', alignItems: 'center', justifyContent: 'center' },
  applyLocationButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  locationStripText: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 18, marginLeft: 8 },
  locationBottomRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  clearLocationButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(26,6,16,0.9)', borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', minWidth: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  clearLocationText: { color: '#E6B0B0', fontSize: 12, fontWeight: '700' },
  locationHintSpacer: { height: 1 },
  resolvingRowCompact: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  resolvingText: { color: '#E6B0B0', fontSize: 12, fontWeight: '600', marginLeft: 8 },
  // ── Cards ──
  cardList: { gap: 18, width: '100%' },
  card: { backgroundColor: '#1a0610', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(157,42,75,0.25)', shadowColor: '#9D2A4B', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8, alignItems: 'center', width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  messageCardButton: { position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(157,42,75,0.2)', borderWidth: 1, borderColor: 'rgba(157,42,75,0.35)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  imageWrap: { width: 90, height: 90, borderRadius: 45, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(157,42,75,0.5)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: 90, height: 90, borderRadius: 45 },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#130509', borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)' },
  ratingStars: { flexDirection: 'row', gap: 2, marginRight: 8 },
  ratingText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, alignSelf: 'stretch' },
  infoIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(157,42,75,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)' },
  infoText: { marginLeft: 10, color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  locationInfoContent: { flex: 1 },
  distanceText: { color: '#E6B0B0', fontSize: 12, fontWeight: '700', marginLeft: 10, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14, alignSelf: 'stretch' },
  primaryButton: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, width: '100%' },
  secondaryButton: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  buttonIcon: { marginRight: 6 },
  primaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  secondaryButtonText: { color: '#ffffffff', fontSize: 12, fontWeight: '700' },
  // ── Empty ──
  emptyCard: { borderRadius: 24, paddingVertical: 50, paddingHorizontal: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', backgroundColor: '#1a0610', width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(157,42,75,0.3)' },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  emptyText: { color: '#E6B0B0', fontSize: 14, fontWeight: '600', marginTop: 8, textAlign: 'center', lineHeight: 21 },
  reviewModalBackdrop: { flex: 1, backgroundColor: 'rgba(15,8,13,0.8)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  reviewModalCard: { width: '100%', maxHeight: '80%', borderRadius: 18, padding: 16, backgroundColor: '#1a0610', borderWidth: 1, borderColor: 'rgba(157,42,75,0.3)' },
  reviewModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewModalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  reviewModalSubtitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginTop: 4, marginBottom: 12 },
  reviewLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 20, justifyContent: 'center' },
  reviewLoadingText: { color: '#99aaff', fontSize: 12, fontWeight: '700' },
  reviewList: { marginTop: 6 },
  reviewItem: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(26,6,16,0.7)', borderWidth: 1, borderColor: 'rgba(157,42,75,0.2)', marginBottom: 10 },
  reviewStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  reviewRatingValue: { color: '#f59e0b', fontWeight: '800', fontSize: 12 },
  reviewDescription: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  reviewMetaText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  reviewEmptyRow: { alignItems: 'center', paddingVertical: 24 },
  reviewEmptyText: { color: '#99aaff', fontSize: 12, fontWeight: '700' },
});
