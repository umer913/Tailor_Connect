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
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE_URL = "http://UF-MacBook-Pro.local:3000";
const DEFAULT_PRICE_CEILING = 100000;
const FILTER_DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.84, 360);
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

const BrowseTailors = ({ navigation, route }) => {
  const nearbyRadiusKm = 25;
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
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const drawerProgress = useRef(new Animated.Value(0)).current;

  const getServicesForTailor = async (email) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-tailor-services`, {
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
      const response = await axios.get(`${API_BASE_URL}/get-tailors-with-services`);
      setTailors(response.data.tailors || []);
      return;
    } catch {
      try {
        const fallbackResponse = await axios.get(`${API_BASE_URL}/get-tailors`);
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

    const effectiveMin = Math.min(selectedMinPrice, selectedMaxPrice);
    const effectiveMax = Math.max(selectedMinPrice, selectedMaxPrice);
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

  const calculateDistanceKm = (latitudeA, longitudeA, latitudeB, longitudeB) => {
    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const deltaLatitude = toRadians(latitudeB - latitudeA);
    const deltaLongitude = toRadians(longitudeB - longitudeA);
    const a =
      Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
      Math.cos(toRadians(latitudeA)) *
        Math.cos(toRadians(latitudeB)) *
        Math.sin(deltaLongitude / 2) *
        Math.sin(deltaLongitude / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
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

      const missingLocations = tailors
        .map((tailor) => tailor.location)
        .filter(Boolean)
        .filter((location, index, allLocations) => allLocations.indexOf(location) === index)
        .filter((location) => !tailorLocationCache[getLocationCacheKey(location)]);

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
          matchesLocation = distanceKm <= nearbyRadiusKm;
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
      const matchesName = normalizeText(tailor.full_name).includes(normalizeText(searchText));
      const priceMatched = matchesPriceRange(tailor);
      const servicesMatched = matchesSelectedServices(tailor);
      return tailor.matchesLocation && matchesName && priceMatched && servicesMatched;
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
    const selectedRangeMin = Math.min(selectedMinPrice, selectedMaxPrice);
    const selectedRangeMax = Math.max(selectedMinPrice, selectedMaxPrice);

    navigation.navigate("TailorServices", {
      CustomerEmail: customerEmail,
      email: tailor.email,
      name: tailor.full_name,
      location: tailor.location,
      phone_number: tailor.phone_number,
      isPriceFilterActive,
      selectedRangeMin,
      selectedRangeMax,
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
      return;
    }

    openFilterDrawer();
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
    <LinearGradient colors={["#1b254f", "#0c1435", "#080927"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color="#99aaff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={toggleFilterDrawer} activeOpacity={0.85}>
            <Animated.View style={[styles.menuBarsWrap, { transform: [{ rotate: menuIconRotate }] }]}>
              <View style={styles.menuBar} />
              <View style={styles.menuBar} />
              <View style={styles.menuBar} />
            </Animated.View>
          </TouchableOpacity>

        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Browse Tailors</Text>
          <Text style={styles.headerSub}>Choose the best tailor for you</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#7b9bff" style={styles.searchIcon} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search tailor by name"
            placeholderTextColor="#7f8dbd"
            style={styles.searchInput}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")} activeOpacity={0.85}>
              <Ionicons name="close-circle" size={18} color="#7b9bff" />
            </TouchableOpacity>
          ) : null}
        </View>



        {visibleTailors.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cut-outline" size={46} color="#506ba9" />
            <Text style={styles.emptyTitle}>{nearbyOnly ? "No nearby tailors found" : "No tailors found"}</Text>
            <Text style={styles.emptyText}>
              {searchText
                ? "Try a different name or clear the search."
                : selectedServiceTypes.length
                  ? "Try changing or clearing your selected services."
                : isPriceFilterActive
                  ? "Try changing or clearing your price range."
                : nearbyOnly
                  ? "Try switching off the nearby filter or update your saved locations."
                  : "Try again later when more profiles are available."}
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {visibleTailors.map((tailor) => (
              <TouchableOpacity key={tailor.id} style={styles.card} activeOpacity={0.9} onPress={() => openServices(tailor)}>
                <TouchableOpacity
                  style={styles.messageCardButton}
                  activeOpacity={0.85}
                  onPress={(event) => {
                    event.stopPropagation();
                    openChatbox(tailor);
                  }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={17} color="#d1d9ff" />
                </TouchableOpacity>

                <View style={styles.imageWrap}>
                  <Image
                    source={require("../../../assets/images/imTailor.png")}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.name}>{tailor.full_name}</Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="location-outline" size={16} color="#7b9bff" />
                  </View>
                  <View style={styles.locationInfoContent}>
                    <Text style={styles.infoText}>{tailor.location || "Location not added"}</Text>
                    {tailor.distanceKm != null ? (
                      <Text style={styles.distanceText}>{tailor.distanceKm.toFixed(1)} km away</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="call-outline" size={16} color="#7b9bff" />
                  </View>
                  <Text style={styles.infoText}>{tailor.phone_number || "Phone not added"}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => openServices(tailor)} activeOpacity={0.85}>
                    <Ionicons name="grid-outline" size={16} color="#d1d9ff" style={styles.buttonIcon} />
                    <Text style={styles.primaryButtonText}>View Services</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={() => openAppointment(tailor)} activeOpacity={0.85}>
                    <Ionicons name="calendar-outline" size={16} color="#d1d9ff" style={styles.buttonIcon} />
                    <Text style={styles.secondaryButtonText}>Book Appointment</Text>
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
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Filters</Text>
              <TouchableOpacity style={styles.menuButton} onPress={toggleFilterDrawer} activeOpacity={0.85}>
                <Animated.View style={[styles.menuBarsWrap, { transform: [{ rotate: menuIconRotate }] }]}>
                  <View style={styles.menuBar} />
                  <View style={styles.menuBar} />
                  <View style={styles.menuBar} />
                </Animated.View>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
              <View style={styles.filtersPanel}>
                <View style={styles.filterSection}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceHeaderLeft}>
                      <View style={styles.serviceHeaderIcon}>
                        <Ionicons name="options-outline" size={18} color="#d1d9ff" />
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
                        <Ionicons name="close-circle-outline" size={15} color="#aebcff" style={styles.buttonIcon} />
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
                          color="#aebcff"
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
                                  {isSelected ? <Ionicons name="checkmark-circle" size={18} color="#8ca6ff" /> : null}
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
                        <Ionicons name="pricetag-outline" size={18} color="#d1d9ff" />
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
                        <Ionicons name="close-circle-outline" size={15} color="#aebcff" style={styles.buttonIcon} />
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
                          minimumTrackTintColor="#8ca6ff"
                          maximumTrackTintColor="#364d8f"
                          thumbTintColor="#d1d9ff"
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
                          minimumTrackTintColor="#8ca6ff"
                          maximumTrackTintColor="#364d8f"
                          thumbTintColor="#d1d9ff"
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
                  <View style={styles.locationHeaderBar}>
                    <View style={styles.locationHeaderLeft}>
                      <View style={styles.locationHeaderIcon}>
                        <Ionicons name="locate-outline" size={18} color="#d1d9ff" />
                      </View>
                      <View style={styles.locationHeaderTextWrap}>
                        <Text style={styles.locationTitle}>Location Filter</Text>
                        <Text style={styles.locationSubtitle}>Nearby tailors within {nearbyRadiusKm} km</Text>
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
                        <ActivityIndicator size="small" color="#d1d9ff" />
                      ) : (
                        <>
                          <View style={[styles.locationToggleKnob, nearbyOnly && styles.locationToggleKnobActive]} />
                          <Text style={styles.locationToggleText}>{nearbyOnly ? "On" : "Off"}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.locationStrip}>
                    <Ionicons name="location-outline" size={16} color="#7b9bff" />
                    <Text style={styles.locationStripText} numberOfLines={2}>
                      {currentLocation?.text || "No location selected yet"}
                    </Text>
                  </View>

                  <View style={styles.manualLocationRow}>
                    <TextInput
                      value={typedLocation}
                      onChangeText={setTypedLocation}
                      placeholder="Type city or area"
                      placeholderTextColor="#7f8dbd"
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
                          <ActivityIndicator size="small" color="#aebcff" />
                        ) : (
                          <>
                            <Ionicons name="refresh-outline" size={16} color="#aebcff" style={styles.buttonIcon} />
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
    </LinearGradient>
  );
};

export default BrowseTailors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 65 : 45,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    marginLeft: -350, 
  },
  menuButton: {
    backgroundColor: "rgba(42,60,114,0.5)",
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBarsWrap: {
    height: 18,
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuBar: {
    width: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#99aaff",
  },
  backButton: {
    backgroundColor: "rgba(42,60,114,0.5)",
    padding: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.12)",
  },
  drawerRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  drawerBackdropTouchTarget: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 10, 24, 0.55)",
  },
  drawerPanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: FILTER_DRAWER_WIDTH,
    backgroundColor: "#101a3b",
    borderRightWidth: 1,
    borderRightColor: "rgba(155,179,255,0.15)",
    paddingTop: Platform.OS === "ios" ? 58 : 40,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(155,179,255,0.12)",
  },
  drawerTitle: {
    color: "#d1d9ff",
    fontSize: 19,
    fontWeight: "800",
  },
  drawerContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#d1d9ff",
  },
  headerSub: {
    fontSize: 14,
    color: "#8e9ccf",
    fontWeight: "600",
    marginTop: 4,
  },
  searchBox: {
    backgroundColor: "rgba(38,52,90,0.5)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#d1d9ff",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },
  filtersPanel: {
    backgroundColor: "rgba(38,52,90,0.5)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    marginBottom: 22,
  },
  filterSection: {
    paddingVertical: 2,
  },
  filterDivider: {
    height: 1,
    backgroundColor: "rgba(155,179,255,0.12)",
    marginVertical: 14,
  },
  servicePanel: {
    backgroundColor: "rgba(38,52,90,0.5)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  serviceHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  serviceHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(55,82,150,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(123,155,255,0.18)",
    marginRight: 12,
  },
  serviceTitle: {
    color: "#d1d9ff",
    fontSize: 17,
    fontWeight: "800",
  },
  serviceSubtitle: {
    color: "#8e9ccf",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  clearServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17,26,58,0.9)",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearServiceText: {
    color: "#aebcff",
    fontSize: 12,
    fontWeight: "700",
  },
  serviceDropdownButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.2)",
    backgroundColor: "rgba(17,26,58,0.75)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceDropdownText: {
    flex: 1,
    color: "#d1d9ff",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 8,
  },
  serviceDropdownMenu: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.2)",
    backgroundColor: "rgba(17,26,58,0.88)",
  },
  serviceDropdownScroll: {
    maxHeight: 220,
  },
  serviceOptionRow: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(155,179,255,0.08)",
  },
  serviceOptionRowActive: {
    backgroundColor: "rgba(70, 110, 220, 0.2)",
  },
  serviceOptionText: {
    color: "#b8c5f5",
    fontSize: 13,
    fontWeight: "700",
  },
  serviceOptionTextActive: {
    color: "#d1d9ff",
  },
  noServiceHint: {
    color: "#8e9ccf",
    fontSize: 12,
    fontWeight: "600",
  },
  locationPanel: {
    backgroundColor: "rgba(38,52,90,0.5)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    marginBottom: 22,
  },
  pricePanel: {
    backgroundColor: "rgba(38,52,90,0.5)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    marginBottom: 16,
  },
  priceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  priceHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  priceHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(55,82,150,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(123,155,255,0.18)",
    marginRight: 12,
  },
  priceTitle: {
    color: "#d1d9ff",
    fontSize: 17,
    fontWeight: "800",
  },
  priceSubtitle: {
    color: "#8e9ccf",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  clearPriceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17,26,58,0.9)",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearPriceText: {
    color: "#aebcff",
    fontSize: 12,
    fontWeight: "700",
  },
  priceValueText: {
    color: "#d1d9ff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  sliderGroup: {
    gap: 10,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sliderLabel: {
    width: 34,
    color: "#aebcff",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
  },
  slider: {
    flex: 1,
    height: 36,
  },
  noPriceHint: {
    color: "#8e9ccf",
    fontSize: 12,
    fontWeight: "600",
  },
  locationHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  locationHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  locationHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(55,82,150,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(123,155,255,0.18)",
  },
  locationHeaderTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    color: "#d1d9ff",
    fontSize: 17,
    fontWeight: "800",
  },
  locationSubtitle: {
    color: "#8e9ccf",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  locationToggle: {
    minWidth: 78,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(17,26,58,0.9)",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.1)",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationToggleActive: {
    backgroundColor: "rgba(70, 110, 220, 0.26)",
    borderColor: "rgba(123,155,255,0.3)",
  },
  locationToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6d7db3",
  },
  locationToggleKnobActive: {
    backgroundColor: "#d1d9ff",
  },
  locationToggleText: {
    color: "#d1d9ff",
    fontSize: 12,
    fontWeight: "800",
  },
  locationStrip: {
    marginTop: 14,
    backgroundColor: "rgba(17,26,58,0.58)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
  },
  manualLocationRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  manualLocationInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.15)",
    backgroundColor: "rgba(17,26,58,0.75)",
    color: "#d1d9ff",
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 12,
  },
  applyLocationButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(123,155,255,0.35)",
    backgroundColor: "rgba(70, 110, 220, 0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  applyLocationButtonText: {
    color: "#d1d9ff",
    fontSize: 13,
    fontWeight: "700",
  },
  locationStripText: {
    flex: 1,
    color: "#d1d9ff",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginLeft: 10,
  },
  locationStripBadge: {
    color: "#7b9bff",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 10,
  },
  locationHint: {
    color: "#8e9ccf",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 10,
  },
  locationBottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  clearLocationButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(17,26,58,0.9)",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.1)",
    minWidth: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  clearLocationText: {
    color: "#aebcff",
    fontSize: 12,
    fontWeight: "700",
  },
  locationHintSpacer: {
    height: 1,
  },
  resolvingRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  resolvingText: {
    color: "#8e9ccf",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },
  cardList: {
    gap: 18,
  },
  card: {
    backgroundColor: "rgba(38,52,90,0.5)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    shadowColor: "#18294a",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    alignItems: "center",
  },
  messageCardButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(22,34,70,0.92)",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  imageWrap: {
    backgroundColor: "rgba(42,60,114,0.4)",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    marginBottom: 12,
  },
  image: {
    width: 150,
    height: 90,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#d1d9ff",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    alignSelf: "stretch",
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(42,60,114,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    marginLeft: 10,
    color: "#c3d1ff",
    fontSize: 15,
    fontWeight: "600",
  },
  locationInfoContent: {
    flex: 1,
  },
  distanceText: {
    color: "#7b9bff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 10,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2a3c72",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    minWidth: 108,
    backgroundColor: "#2a3c72",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#d1d9ff",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#d1d9ff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "rgba(38,52,90,0.5)",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.15)",
  },
  emptyTitle: {
    color: "#d1d9ff",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: {
    color: "#8e9ccf",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
});